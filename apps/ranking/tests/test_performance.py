import json
import subprocess
import sys
from pathlib import Path

import pytest

from evaluation.performance import run
from factories import backend_need, synthetic_candidate
from scoring import rank_candidates

BUDGET = Path(__file__).resolve().parents[1] / "evaluation/performance_budget.json"


def test_ranking_scores_every_candidate_in_non_increasing_order():
    need = backend_need(id="perf")
    items = [synthetic_candidate(index) for index in range(200)]
    results = rank_candidates(items, need)

    assert {item.candidateId for item in results} == {item.id for item in items}
    scores = [item.matchScore for item in results]
    assert scores == sorted(scores, reverse=True)
    assert all(0.0 <= score <= 1.0 for score in scores)
    # Элиминация срабатывает раньше скоринга: провалившие кандидаты не впереди.
    first_ineligible = next(
        (index for index, item in enumerate(results) if not item.eligible),
        len(results),
    )
    assert all(item.eligible for item in results[:first_ineligible])


def test_small_performance_run_reports_metrics():
    stats = run(candidates=50, runs=1)
    assert stats["candidates"] == 50.0
    assert stats["runs"] == 1.0
    assert stats["avg_seconds"] > 0.0
    assert stats["throughput"] > 0.0


@pytest.mark.slow
def test_ranking_throughput_stays_within_budget():
    # Порог и объём прогона живут в evaluation/performance_budget.json — его же
    # читает check.sh, поэтому тест и CI не могут разойтись в цифрах.
    budget = json.loads(BUDGET.read_text(encoding="utf-8"))
    stats = run(candidates=budget["candidates"], runs=budget["runs"])
    assert stats["avg_seconds"] <= budget["maxAvgSeconds"], stats
    assert stats["throughput"] > 0.0, stats


def test_performance_cli_fails_when_budget_is_exceeded():
    script = Path(__file__).resolve().parents[1] / "evaluation/performance.py"
    result = subprocess.run(
        [sys.executable, str(script), "--candidates", "50", "--runs", "1", "--max-avg-seconds", "-1"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 1
    assert "превышает бюджет" in result.stderr


def test_budget_file_is_well_formed():
    budget = json.loads(BUDGET.read_text(encoding="utf-8"))
    assert budget["candidates"] > 0
    assert budget["runs"] > 0
    assert budget["maxAvgSeconds"] > 0


def test_performance_cli_prints_throughput():
    script = Path(__file__).resolve().parents[1] / "evaluation/performance.py"
    result = subprocess.run(
        [sys.executable, str(script), "--candidates", "50", "--runs", "1"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
    assert "avg_seconds=" in result.stdout
    assert "throughput_candidates_per_second=" in result.stdout
