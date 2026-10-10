"""Local ONNX sentence-embedding similarity with fail-closed availability.

Serving-time helper for ``scoring._semantic_fit``: encodes two short texts
with the committed int8 model (see ``scripts/build_embedder.py``) and returns
their cosine similarity in [-1, 1]. No network, no LLM: a small local encoder
runs in-process. Any missing dependency, missing/modified model file or runtime
error makes the feature unavailable (``None``) and callers fall back to the
lexical similarity — the ranking formula never fails because of embeddings.

The ONNX artifact is stored in git as ``embedder-int8.onnx.NNNN`` parts (GitHub
rejects files over 100 MB). On first load the parts are verified against
``embedder.meta.json`` and assembled into the gitignored
``embedder-int8.onnx``; a stale assembled file with the wrong hash is rebuilt
from verified parts automatically.
"""

from __future__ import annotations

import hashlib
import json
import os
import threading
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
MODELS_DIR = ROOT / "evaluation" / "models"
ONNX_FILE = MODELS_DIR / "embedder-int8.onnx"
TOKENIZER_FILE = MODELS_DIR / "tokenizer.json"
META_FILE = MODELS_DIR / "embedder.meta.json"

_CACHE_LIMIT = 4096
_STATE: dict[str, Any] = {}
_LOCK = threading.Lock()


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _assemble(full: Path, artifact: dict[str, Any], files: dict[str, str]) -> None:
    tmp = full.with_name(full.name + ".tmp")
    try:
        with tmp.open("wb") as out:
            for index in range(int(artifact["parts"])):
                name = f"{artifact['name']}.{index:04d}"
                path = MODELS_DIR / name
                if _sha256(path) != files[name]:
                    raise ValueError(f"embedder part {name} does not match embedder.meta.json")
                out.write(path.read_bytes())
        os.replace(tmp, full)
    finally:
        if tmp.exists():
            tmp.unlink(missing_ok=True)


def _ensure_onnx(meta: dict[str, Any]) -> Path:
    artifact = meta.get("artifact")
    if not artifact or artifact.get("name") != ONNX_FILE.name:
        raise ValueError("embedder.meta.json has no artifact section for embedder-int8.onnx")
    files = meta["files"]
    if _sha256(TOKENIZER_FILE) != files["tokenizer.json"]:
        raise ValueError("tokenizer.json does not match embedder.meta.json")
    expected = artifact["sha256"]
    if ONNX_FILE.exists() and _sha256(ONNX_FILE) == expected:
        return ONNX_FILE
    # Missing or stale assembled file: rebuild it from verified parts.
    _assemble(ONNX_FILE, artifact, files)
    return ONNX_FILE


def _load_state() -> dict[str, Any] | None:
    if "session" in _STATE:
        return _STATE if _STATE.get("session") is not None else None
    if _STATE.get("failed"):
        return None
    if os.getenv("RANKING_EMBEDDINGS", "").strip().lower() in {"0", "off", "false"}:
        _STATE["failed"] = True
        return None
    try:
        import numpy as np
        import onnxruntime as ort
        from tokenizers import Tokenizer

        meta = json.loads(META_FILE.read_text(encoding="utf-8"))
        onnx_path = _ensure_onnx(meta)
        tokenizer = Tokenizer.from_file(str(TOKENIZER_FILE))
        tokenizer.enable_truncation(int(meta["maxSeqLength"]))
        session = ort.InferenceSession(
            str(onnx_path), providers=["CPUExecutionProvider"]
        )
        _STATE["session"] = session
        _STATE["tokenizer"] = tokenizer
        _STATE["cache"] = {}
        _STATE["np"] = np
    except Exception:
        _STATE["failed"] = True
        return None
    return _STATE


def embedding_available() -> bool:
    """True when the local embedder is loaded and usable right now."""
    return _load_state() is not None


def _encode(state: dict[str, Any], text: str) -> Any:
    np = state["np"]
    key = hashlib.sha256(text.encode("utf-8")).hexdigest()
    cached = state["cache"].get(key)
    if cached is not None:
        return cached
    encoding = state["tokenizer"].encode(text)
    input_ids = np.array([encoding.ids], dtype=np.int64)
    attention_mask = np.array([encoding.attention_mask], dtype=np.int64)
    token_types = np.array([encoding.type_ids], dtype=np.int64)
    if input_ids.shape[1] == 0:
        vector = np.zeros(1, dtype=np.float32)
    else:
        last_hidden = state["session"].run(
            None,
            {
                "input_ids": input_ids,
                "attention_mask": attention_mask,
                "token_type_ids": token_types,
            },
        )[0]
        mask = np.expand_dims(attention_mask, axis=-1).astype(np.float32)
        pooled = np.sum(last_hidden * mask, axis=1) / np.clip(
            np.sum(mask, axis=1), 1e-9, None
        )
        norm = float(np.linalg.norm(pooled))
        vector = (pooled[0] / norm if norm > 0 else pooled[0]).astype(np.float32)
    if len(state["cache"]) >= _CACHE_LIMIT:
        state["cache"].pop(next(iter(state["cache"])))
    state["cache"][key] = vector
    return vector


def embedding_similarity(candidate_text: str, need_text: str) -> float | None:
    """Cosine similarity in [-1, 1] or None when the embedder is unavailable."""
    state = _load_state()
    if state is None or not candidate_text or not need_text:
        return None
    try:
        with _LOCK:
            left = _encode(state, candidate_text)
            right = _encode(state, need_text)
        return float(np_dot(state, left, right))
    except Exception:
        return None


def np_dot(state: dict[str, Any], left: Any, right: Any) -> float:
    return float(state["np"].dot(left, right))
