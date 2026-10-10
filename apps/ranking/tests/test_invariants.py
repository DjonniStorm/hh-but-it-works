from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from factories import candidate, need
from schemas import CandidateSnapshot, HiringNeedSnapshot, ScoreBreakdown
from scoring import MODEL_VERSION, eligibility, rank_candidates, score_pair

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent.parent
SCORING_SRC = (ROOT / "scoring.py").read_text(encoding="utf-8")
TS_CLIENT = (REPO / "apps/api/src/modules/employers/ranking.client.ts").read_text(
    encoding="utf-8",
)

sys.path.insert(0, str(ROOT / "evaluation"))
from features import FEATURE_ORDER  # noqa: E402

GRADES = ["intern", "junior", "middle", "senior"]
GRADE_ORDER = {grade: index for index, grade in enumerate(GRADES)}


def _python_weights(block: str) -> list[float]:
    match = re.search(rf"\n    {block} = \(\n(.*?)\n    \)", SCORING_SRC, re.S)
    assert match, f"блок {block} не найден в scoring.py"
    return [float(value) for value in re.findall(r"(\d+\.\d+) \*", match.group(1))]


def _typescript_breakdown() -> list[tuple[str, float]]:
    # Первое "}[] = [" закрывает типовую аннотацию, сам массив начинается после неё.
    match = re.search(
        r"const breakdownGroups:.*?\}\[\] = \[(.*?)\n\];",
        TS_CLIENT,
        re.S,
    )
    assert match, "breakdownGroups не найден в ranking.client.ts"
    body = match.group(1)
    keys = re.findall(r'key: "(\w+)"', body)
    # В однострочных записях запятая стоит после "}", в многострочных — сразу за числом.
    weights = [
        float(value)
        for value in re.findall(r"weight: ([0-9.]+)\s*[,}]", body)
    ]
    assert len(keys) == len(weights), "keys и weights в TS разного размера"
    return list(zip(keys, weights))


def test_qualification_weights_sum_to_one():
    weights = _python_weights("qualification")
    assert len(weights) == 10
    assert sum(weights) == pytest.approx(1.0)


def test_opportunity_weights_sum_to_one():
    weights = _python_weights("opportunity")
    assert len(weights) == 3
    assert sum(weights) == pytest.approx(1.0)


def test_typescript_breakdown_covers_every_score_component():
    ts_keys = {key for key, _ in _typescript_breakdown()}
    # freshness и intent живут в matchScore, но не в разбивке UI — это осознанно.
    assert ts_keys == set(ScoreBreakdown.model_fields) - {"freshness"}


def test_typescript_weights_are_the_same_set_as_python_weights():
    ts_weights = sorted(weight for _, weight in _typescript_breakdown())
    py_weights = sorted(_python_weights("qualification") + _python_weights("opportunity"))
    assert ts_weights == py_weights


def test_feature_order_matches_score_breakdown_fields():
    # Порядок признаков LTR задаёт оси обученной модели: тихая перестановка полей
    # в ScoreBreakdown молча ломает применение model.txt.
    assert FEATURE_ORDER == [
        *ScoreBreakdown.model_fields,
        "qualificationScore",
        "opportunityFit",
        "intentScore",
        "rulesMatchScore",
    ]


def test_skill_catalog_slug_and_title_canonicalize_alike():
    from taxonomy import canonical_skill

    catalog = REPO / "packages/types/src/skill-catalog.ts"
    entries = re.findall(
        r'slug: "([^"]+)",\s*title: "([^"]+)"',
        catalog.read_text(encoding="utf-8"),
    )
    assert entries, "skill-catalog.ts пуст или формат изменился"
    for slug, title in entries:
        assert canonical_skill(slug) == canonical_skill(title), (
            f"slug {slug!r} и title {title!r} каноникализируются по-разному: "
            f"{canonical_skill(slug)!r} != {canonical_skill(title)!r}"
        )


def test_ranking_is_deterministic():
    candidates = [candidate(id=f"c{i}") for i in range(5)]
    first = rank_candidates(candidates, need())
    second = rank_candidates(candidates, need())
    assert [item.model_dump() for item in first] == [item.model_dump() for item in second]


def test_input_order_does_not_change_scores():
    forward = [candidate(id="a"), candidate(id="b"), candidate(id="c")]
    backward = list(reversed(forward))
    left = {item.candidateId: item.matchScore for item in rank_candidates(forward, need())}
    right = {item.candidateId: item.matchScore for item in rank_candidates(backward, need())}
    assert left == right


def test_non_model_metadata_cannot_change_a_candidate_score():
    plain = candidate(id="same", metadata={})
    with_sensitive_metadata = candidate(
        id="same",
        metadata={
            "name": "Иван Иванов",
            "gender": "male",
            "age": 42,
            "email": "private@example.test",
        },
    )

    assert score_pair(plain, need()).model_dump() == score_pair(
        with_sensitive_metadata,
        need(),
    ).model_dump()


def test_model_version_is_reported_on_every_item():
    items = rank_candidates([candidate()], need())
    assert {item.modelVersion for item in items} == {MODEL_VERSION}


def test_eligible_items_sort_before_rejected_ones():
    visible = candidate(id="visible")
    hidden = candidate(id="hidden", availability="hidden")
    ranked = rank_candidates([hidden, visible], need())
    assert ranked[0].candidateId == "visible"
    assert ranked[-1].candidateId == "hidden"
    assert ranked[0].eligible is True
    assert ranked[-1].eligible is False


skill_st = st.fixed_dictionaries(
    {
        "id": st.sampled_from(
            ["python", "fastapi", "postgresql", "docker", "redis", "cobol"],
        ),
        "verified": st.booleans(),
        "level": st.floats(min_value=0.0, max_value=1.0),
        "confidence": st.floats(min_value=0.0, max_value=1.0),
    },
)

candidate_st = st.fixed_dictionaries(
    {
        "id": st.text(min_size=1, max_size=8),
        "specialization": st.sampled_from(["backend", "frontend"]),
        "claimedGrade": st.sampled_from(GRADES),
        "verifiedGrade": st.one_of(st.none(), st.sampled_from(GRADES)),
        "gradeConfidence": st.floats(min_value=0.0, max_value=1.0),
        "experienceYears": st.floats(min_value=0.0, max_value=30.0),
        "skills": st.lists(skill_st, max_size=4),
        "assessmentScore": st.one_of(st.none(), st.floats(min_value=0.0, max_value=1.0)),
        "availability": st.sampled_from(
            ["actively_looking", "open_to_offers", "passive", "hidden"],
        ),
        "profileFreshness": st.floats(min_value=0.0, max_value=1.0),
        "semanticSimilarity": st.one_of(
            st.none(),
            st.floats(min_value=-1.0, max_value=1.0),
        ),
        "preferences": st.fixed_dictionaries(
            {},
            optional={
                "salaryMin": st.one_of(
                    st.none(),
                    st.integers(min_value=0, max_value=500000),
                ),
                "workModes": st.lists(
                    st.sampled_from(["remote", "office", "hybrid"]),
                    max_size=2,
                ),
            },
        ),
    },
)

need_st = st.fixed_dictionaries(
    {
        "specialization": st.sampled_from(["backend", "frontend"]),
        "gradeMin": st.sampled_from(GRADES),
        "gradeMax": st.sampled_from(GRADES),
        "mustSkills": st.lists(
            st.sampled_from(["python", "fastapi", "postgresql", "cobol"]),
            max_size=3,
        ),
        "niceSkills": st.lists(st.sampled_from(["docker", "redis"]), max_size=2),
        "salaryMin": st.one_of(st.none(), st.integers(min_value=0, max_value=500000)),
        "salaryMax": st.one_of(st.none(), st.integers(min_value=0, max_value=500000)),
        "workModes": st.lists(
            st.sampled_from(["remote", "office", "hybrid"]),
            max_size=2,
        ),
    },
    optional={
        "strictSalary": st.booleans(),
        "strictWorkMode": st.booleans(),
        "experienceMin": st.one_of(
            st.none(),
            st.floats(min_value=0.0, max_value=20.0),
        ),
    },
).map(
    # Схема требует gradeMin <= gradeMax и salaryMin <= salaryMax.
    lambda payload: {
        **payload,
        "gradeMin": min(payload["gradeMin"], payload["gradeMax"], key=GRADE_ORDER.get),
        "gradeMax": max(payload["gradeMin"], payload["gradeMax"], key=GRADE_ORDER.get),
        "salaryMin": _min_salary(payload),
        "salaryMax": _max_salary(payload),
    },
)


def _min_salary(payload: dict) -> int | None:
    low, high = payload["salaryMin"], payload["salaryMax"]
    if low is None or high is None:
        return low
    return min(low, high)


def _max_salary(payload: dict) -> int | None:
    low, high = payload["salaryMin"], payload["salaryMax"]
    if low is None or high is None:
        return high
    return max(low, high)


@settings(max_examples=150, deadline=None)
@given(candidate=candidate_st, need=need_st)
def test_scores_stay_in_range(candidate: dict, need: dict):
    item = score_pair(
        CandidateSnapshot.model_validate(candidate),
        HiringNeedSnapshot.model_validate(need),
    )
    assert 0.0 <= item.matchScore <= 1.0
    assert 0.0 <= item.qualificationScore <= 1.0
    assert 0.0 <= item.opportunityFit <= 1.0
    assert 0.0 <= item.intentScore <= 1.0
    for name, value in item.components.model_dump().items():
        assert 0.0 <= value <= 1.0, f"{name} вне [0, 1]: {value}"


@settings(max_examples=100, deadline=None)
@given(candidate=candidate_st, need=need_st)
def test_hidden_candidate_is_never_eligible_and_scores_zero(
    candidate: dict,
    need: dict,
):
    payload = {**candidate, "availability": "hidden"}
    person = CandidateSnapshot.model_validate(payload)
    job = HiringNeedSnapshot.model_validate(need)
    item = score_pair(person, job)
    assert eligibility(person, job).eligible is False
    assert item.matchScore == 0.0
    assert "candidate_hidden" in item.rejectedBy


@settings(max_examples=100, deadline=None)
@given(
    grade_confidence=st.floats(min_value=0.0, max_value=1.0),
    grade=st.sampled_from(GRADES),
)
def test_verified_grade_never_scores_below_claimed(
    grade_confidence: float,
    grade: str,
):
    shared = {
        "skills": [{"id": "python", "verified": True, "level": 1.0, "confidence": 1.0}],
        "assessmentScore": 1.0,
        "gradeConfidence": grade_confidence,
        "claimedGrade": grade,
        "availability": "actively_looking",
    }
    verified = score_pair(candidate(**shared, verifiedGrade=grade), need())
    claimed = score_pair(candidate(**shared, verifiedGrade=None), need())
    assert verified.qualificationScore >= claimed.qualificationScore
    assert verified.matchScore >= claimed.matchScore
