import json

from factories import backend_need, candidate
from ltr import LTRRanker
from monitoring import METRICS_LOGGER, record_rank_metrics


def test_rank_metrics_are_structured_and_do_not_include_candidate_ids(caplog):
    run = LTRRanker().rank_run(
        [candidate(id="private-id"), candidate(id="hidden", availability="hidden")],
        backend_need(),
    )

    METRICS_LOGGER.addHandler(caplog.handler)
    try:
        record_rank_metrics(run, candidate_count=2, latency_ms=12.3456)
    finally:
        METRICS_LOGGER.removeHandler(caplog.handler)

    payload = json.loads(caplog.records[-1].message)
    assert payload["event"] == "rank_completed"
    assert payload["candidateCount"] == 2
    assert payload["eligibleCount"] == 1
    assert payload["rejectedCount"] == 1
    assert payload["latencyMs"] == 12.346
    assert "private-id" not in caplog.records[-1].message
