import pytest

from taxonomy import ALIASES, RELATED, canonical_skill, skill_match

SAMPLE = [
    "python",
    "Py",
    "JavaScript",
    "js",
    "TypeScript",
    "node.js",
    "node js",
    "PostgreSQL",
    "postgres",
    "C++",
    "c#",
    "Go",
    "HTTP и API",
    "http-api",
    "Тестирование",
    "контейнеризация",
    "питон",
    "ёржик",
    "  Docker  ",
    "java",
]


@pytest.mark.parametrize("value", SAMPLE)
def test_canonical_skill_is_idempotent(value):
    once = canonical_skill(value)
    assert canonical_skill(once) == once


def test_every_alias_resolves_to_its_own_canonical_key():
    for canonical, aliases in ALIASES.items():
        assert canonical_skill(canonical) == canonical
        for alias in aliases:
            assert canonical_skill(alias) == canonical, alias


def test_every_related_entry_points_at_known_canonicals():
    for source, targets in RELATED.items():
        assert canonical_skill(source) == source
        for target, weight in targets.items():
            assert canonical_skill(target) == target
            assert 0.0 < weight <= 1.0


def test_java_and_javascript_are_different_skills():
    assert canonical_skill("java") != canonical_skill("javascript")


def test_cyrillic_and_unknown_phrases_fall_back_to_underscored_form():
    assert canonical_skill("питон") == "питон"
    assert canonical_skill("База данных") == "база_данных"


def test_skill_match_prefers_exact_over_related():
    exact = skill_match("python", {"python"})
    assert exact.exact is True
    assert exact.score == 1.0

    related = skill_match("fastapi", {"python"})
    assert related.exact is False
    assert 0.0 < related.score < 1.0


def test_skill_match_reverse_relation_is_discounted():
    reverse = skill_match("python", {"fastapi"})
    forward = skill_match("fastapi", {"python"})
    assert reverse.score == pytest.approx(forward.score * 0.8)


def test_skill_match_without_any_relation_is_zero():
    assert skill_match("cobol", {"python"}).score == 0.0
    assert skill_match("cobol", set()).score == 0.0
