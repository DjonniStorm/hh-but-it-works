import hashlib
import json
from pathlib import Path

import pytest

import embedding_similarity as es
from scoring import SEMANTIC_EMBEDDING_BAND, _semantic_fit
from schemas import CandidateSnapshot, HiringNeedSnapshot
from text_similarity import lexical_similarity

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "evaluation" / "models"


def _reset_state(**overrides):
    es._STATE.clear()
    es._STATE.update(overrides)


@pytest.fixture(autouse=True)
def clean_state():
    _reset_state()
    yield
    _reset_state()


def test_embedder_is_committed_and_available():
    meta = json.loads((MODELS_DIR / "embedder.meta.json").read_text(encoding="utf-8"))
    assert meta["schemaVersion"] == 2
    artifact = meta["artifact"]
    assert artifact["name"] == "embedder-int8.onnx"
    assert artifact["parts"] >= 2
    parts = sorted(MODELS_DIR.glob("embedder-int8.onnx.*"))
    assert len(parts) == artifact["parts"]
    # GitHub rejects files over 100 MB: every committed part must stay below.
    assert all(path.stat().st_size <= artifact["partMaxBytes"] for path in parts)
    assert all(path.stat().st_size < 100 * 1024 * 1024 for path in parts)
    assert meta["source"]
    assert meta["revision"]
    assert es.embedding_available() is True


def test_assembles_onnx_from_committed_parts():
    meta = json.loads((MODELS_DIR / "embedder.meta.json").read_text(encoding="utf-8"))
    full = MODELS_DIR / "embedder-int8.onnx"
    # Собранный файл gitignored: чистая копия репозитория собирает его из частей.
    full.unlink()
    _reset_state()
    assert es.embedding_available() is True
    assert full.exists()
    assert (
        hashlib.sha256(full.read_bytes()).hexdigest() == meta["artifact"]["sha256"]
    )


def test_embedding_similarity_separates_related_from_unrelated():
    related = es.embedding_similarity(
        "разработка backend API на python fastapi",
        "backend python разработка REST API fastapi",
    )
    unrelated = es.embedding_similarity(
        "разработка backend API на python fastapi",
        "продавец консультант в розничном магазине",
    )
    assert related is not None and unrelated is not None
    assert related > 0.5
    assert unrelated < 0.3
    assert related - unrelated > 0.5


def test_embedding_similarity_unavailable_fails_closed(monkeypatch):
    monkeypatch.setenv("RANKING_EMBEDDINGS", "off")
    _reset_state()
    assert es.embedding_available() is False
    assert es.embedding_similarity("a b c", "a b c") is None
    assert es.embedding_similarity("a b c", "") is None


def test_embedding_cache_hits_and_limit(monkeypatch):
    assert es.embedding_similarity("python developer", "python developer") is not None
    assert len(es._STATE["cache"]) == 1
    for index in range(es._CACHE_LIMIT + 5):
        es.embedding_similarity(f"текст {index}", "нужно")
    assert len(es._STATE["cache"]) <= es._CACHE_LIMIT


def test_broken_model_files_fail_closed(tmp_path, monkeypatch):
    meta_path = MODELS_DIR / "embedder.meta.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    broken = dict(meta["files"])
    part = next(name for name in broken if name.startswith("embedder-int8"))
    broken[part] = "0" * 64
    monkeypatch.setattr(es, "META_FILE", tmp_path / "embedder.meta.json")
    (tmp_path / "embedder.meta.json").write_text(
        json.dumps({**meta, "files": broken}), encoding="utf-8"
    )
    # Missing assembled file forces a rebuild from parts: a part hash that
    # does not match embedder.meta.json fails closed.
    (MODELS_DIR / "embedder-int8.onnx").unlink()
    _reset_state()
    assert es.embedding_available() is False
    assert es.embedding_similarity("abc", "abc") is None


def _band_pair() -> tuple[str, str]:
    candidate = "python backend разработка api"
    need = "java backend spring api"
    lexical = lexical_similarity(candidate, need)
    assert SEMANTIC_EMBEDDING_BAND[0] <= lexical <= SEMANTIC_EMBEDDING_BAND[1]
    return candidate, need


def test_semantic_fit_delegates_band_pairs_to_embedding(monkeypatch):
    candidate_text, need_text = _band_pair()
    lexical = lexical_similarity(candidate_text, need_text)

    candidate = CandidateSnapshot(
        id="c1", specialization="Backend", profileText=candidate_text
    )
    need = HiringNeedSnapshot(id="n1", specialization="Backend", text=need_text)
    monkeypatch.setattr("scoring.embedding_similarity", lambda left, right: 0.8)
    assert abs(_semantic_fit(candidate, need) - (0.8 + 1.0) / 2.0) < 1e-9

    # Embedder unavailable -> lexical fallback keeps the documented range.
    monkeypatch.setattr("scoring.embedding_similarity", lambda left, right: None)
    expected = min(1.0, 0.20 + 0.80 * lexical)
    assert abs(_semantic_fit(candidate, need) - expected) < 1e-9


def test_semantic_fit_keeps_lexical_path_outside_band(monkeypatch):
    monkeypatch.setattr(
        "scoring.embedding_similarity",
        lambda left, right: pytest.fail("embedder must not run outside the band"),
    )
    # Near-empty overlap: lexical below the band -> pure lexical range.
    candidate = CandidateSnapshot(
        id="c1", specialization="Backend", profileText="микроволновка инструкция"
    )
    need = HiringNeedSnapshot(
        id="n1", specialization="Backend", text="kubernetes operators helm charts"
    )
    lexical = lexical_similarity(candidate.profileText, need.text)
    assert lexical < SEMANTIC_EMBEDDING_BAND[0]
    assert abs(_semantic_fit(candidate, need) - (0.20 + 0.80 * lexical)) < 1e-9


def test_semantic_fit_explicit_similarity_still_wins(monkeypatch):
    monkeypatch.setattr(
        "scoring.embedding_similarity",
        lambda left, right: pytest.fail("explicit semanticSimilarity short-circuits"),
    )
    candidate = CandidateSnapshot(
        id="c1", specialization="Backend", semanticSimilarity=0.0
    )
    assert _semantic_fit(candidate) == 0.5


def test_ranker_status_reports_embedding_ready():
    from ltr import LTRRanker

    ranker = LTRRanker(mode="rules")
    assert ranker.status["embeddingReady"] is True
