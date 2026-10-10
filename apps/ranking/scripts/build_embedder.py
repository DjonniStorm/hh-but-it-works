"""Build the committed int8 ONNX text embedder from a pinned HF model.

Dev-only tool: runs outside the serving image, is never imported at runtime
and never trains anything — it converts a released sentence-embedding model
to ONNX, quantizes it to int8 and records provenance in embedder.meta.json.
The runtime loads the committed files fail-closed (see embedding_similarity.py).

GitHub rejects files over 100 MB, and the int8 model exceeds that, so the
build also splits the ONNX into equal ``embedder-int8.onnx.NNNN`` parts below
the limit. The parts are what git stores; the assembled file is gitignored and
rebuilt on first load (embedding_similarity.assemble_from_parts).

Usage:
    python scripts/build_embedder.py --output evaluation/models
"""

from __future__ import annotations

import argparse
import hashlib
import json
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
DEFAULT_REVISION = "e8f8c211226b894fcb81acc59f3b34ba3efd5f42"
DEFAULT_MAX_LENGTH = 128
DEFAULT_OPSET = 17
# GitHub pre-receive rejects files over 100 MB; stay comfortably below.
PART_MAX_BYTES = 90 * 1024 * 1024
ONNX_NAME = "embedder-int8.onnx"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def split_paths(output: Path, parts: int) -> list[Path]:
    return [output / f"{ONNX_NAME}.{index:04d}" for index in range(parts)]


def split_onnx(output: Path) -> list[Path]:
    data = (output / ONNX_NAME).read_bytes()
    count = max(1, -(-len(data) // PART_MAX_BYTES))
    chunk = -(-len(data) // count)
    paths = split_paths(output, count)
    expected = {path.name for path in paths}
    for stale in output.glob(f"{ONNX_NAME}.*"):
        if stale.name not in expected:
            stale.unlink()
    for index, path in enumerate(paths):
        path.write_bytes(data[index * chunk : (index + 1) * chunk])
    return paths


def mean_pool(last_hidden_state, attention_mask):
    import numpy as np

    mask = np.expand_dims(attention_mask, axis=-1).astype("float32")
    summed = np.sum(last_hidden_state * mask, axis=1)
    counts = np.clip(np.sum(mask, axis=1), 1e-9, None)
    return summed / counts


def l2_normalize(vectors):
    import numpy as np

    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    return vectors / np.clip(norms, 1e-9, None)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--revision", default=DEFAULT_REVISION)
    parser.add_argument("--output", type=Path, default=ROOT / "evaluation/models")
    parser.add_argument("--max-length", type=int, default=DEFAULT_MAX_LENGTH)
    parser.add_argument("--opset", type=int, default=DEFAULT_OPSET)
    args = parser.parse_args()

    import numpy as np
    import onnxruntime as ort
    import torch
    import transformers
    from onnxruntime.quantization import QuantType, quantize_dynamic
    from transformers import AutoModel, AutoTokenizer

    args.output.mkdir(parents=True, exist_ok=True)
    tokenizer = AutoTokenizer.from_pretrained(args.model, revision=args.revision)
    model = AutoModel.from_pretrained(args.model, revision=args.revision).eval()

    encoded = tokenizer("пример текста", return_tensors="pt")
    input_ids = encoded["input_ids"]
    attention_mask = encoded["attention_mask"]
    token_type_ids = encoded.get("token_type_ids")
    if token_type_ids is None:
        token_type_ids = torch.zeros_like(input_ids)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        fp32_path = tmp_dir / "embedder-fp32.onnx"
        tokenizer_json = tmp_dir / "tokenizer.json"
        tokenizer.save_pretrained(tmp_dir)
        if not tokenizer_json.exists():
            raise SystemExit("tokenizer.save_pretrained did not produce tokenizer.json")

        torch.onnx.export(
            model,
            (input_ids, attention_mask, token_type_ids),
            str(fp32_path),
            input_names=["input_ids", "attention_mask", "token_type_ids"],
            output_names=["last_hidden_state"],
            dynamic_axes={
                "input_ids": {0: "batch", 1: "sequence"},
                "attention_mask": {0: "batch", 1: "sequence"},
                "token_type_ids": {0: "batch", 1: "sequence"},
                "last_hidden_state": {0: "batch", 1: "sequence"},
            },
            opset_version=args.opset,
        )

        int8_path = args.output / ONNX_NAME
        quantize_dynamic(str(fp32_path), str(int8_path), weight_type=QuantType.QInt8)
        (args.output / "tokenizer.json").write_bytes(tokenizer_json.read_bytes())

        # Sanity: int8 runtime output must match the torch reference on texts.
        session = ort.InferenceSession(str(int8_path), providers=["CPUExecutionProvider"])
        with torch.no_grad():
            reference = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                token_type_ids=token_type_ids,
            ).last_hidden_state.numpy()
        outputs = session.run(
            None,
            {
                "input_ids": input_ids.numpy(),
                "attention_mask": attention_mask.numpy(),
                "token_type_ids": token_type_ids.numpy(),
            },
        )[0]
        cosine = float(
            np.dot(reference.reshape(-1), outputs.reshape(-1))
            / (
                np.linalg.norm(reference)
                * np.linalg.norm(outputs)
            )
        )
        if cosine < 0.99:
            raise SystemExit(f"int8 output drifted from the reference: cosine={cosine}")

    parts = split_onnx(args.output)
    meta = {
        "schemaVersion": 2,
        "source": args.model,
        "revision": args.revision,
        "maxSeqLength": args.max_length,
        "opset": args.opset,
        "quantization": "dynamic-int8",
        "pooling": "mean-with-attention-mask+l2-normalize",
        "similarity": "cosine",
        "artifact": {
            "name": ONNX_NAME,
            "sha256": sha256(args.output / ONNX_NAME),
            "parts": len(parts),
            "partMaxBytes": PART_MAX_BYTES,
        },
        "files": {
            **{path.name: sha256(path) for path in parts},
            "tokenizer.json": sha256(args.output / "tokenizer.json"),
        },
        "build": {
            "torch": torch.__version__,
            "transformers": transformers.__version__,
            "onnxruntime": ort.__version__,
        },
        "referenceCosine": round(cosine, 6),
    }
    (args.output / "embedder.meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    onnx_size = (args.output / ONNX_NAME).stat().st_size
    part_sizes = ", ".join(f"{path.name}:{path.stat().st_size / 1_048_576:.1f}MiB" for path in parts)
    print(
        f"built {args.output}/{ONNX_NAME} "
        f"({onnx_size / 1_048_576:.1f} MiB, cosine={cosine:.4f}) "
        f"revision={args.revision} parts=[{part_sizes}]"
    )


if __name__ == "__main__":
    main()
