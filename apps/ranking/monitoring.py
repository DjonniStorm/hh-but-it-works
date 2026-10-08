from __future__ import annotations

import json
import logging
from statistics import fmean

from ltr import RankingRun


METRICS_LOGGER = logging.getLogger("ranking.metrics")
METRICS_LOGGER.setLevel(logging.INFO)
if not METRICS_LOGGER.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(message)s"))
    METRICS_LOGGER.addHandler(_handler)
METRICS_LOGGER.propagate = False


def record_rank_metrics(run: RankingRun, candidate_count: int, latency_ms: float) -> None:
    """Emit one privacy-safe structured summary per ranking request."""
    eligible_scores = [item.matchScore for item in run.items if item.eligible]
    payload = {
        "event": "rank_completed",
        "modelVersion": run.model_version,
        "mode": run.mode,
        "candidateCount": candidate_count,
        "eligibleCount": len(eligible_scores),
        "rejectedCount": candidate_count - len(eligible_scores),
        "scoreMean": round(fmean(eligible_scores), 6) if eligible_scores else None,
        "scoreMin": round(min(eligible_scores), 6) if eligible_scores else None,
        "scoreMax": round(max(eligible_scores), 6) if eligible_scores else None,
        "latencyMs": round(latency_ms, 3),
        **{
            name: round(value, 6)
            for name, value in run.diagnostics.items()
        },
    }
    METRICS_LOGGER.info(json.dumps(payload, ensure_ascii=False, sort_keys=True))
