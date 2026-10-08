from text_similarity import lexical_similarity, overlap_terms, text_terms


def test_text_terms_normalize_ru_and_en_word_forms():
    assert "разработ" in text_terms("Разработка и разрабатывать")
    assert "test" in text_terms("tested testing")


def test_lexical_similarity_rewards_requirement_coverage():
    need = "Python FastAPI PostgreSQL разработка API"
    strong = lexical_similarity(
        "Разрабатывал API на Python FastAPI и PostgreSQL",
        need,
    )
    weak = lexical_similarity("Python", need)
    unrelated = lexical_similarity("Дизайн иллюстрация Figma", need)
    assert strong > weak > unrelated
    assert unrelated == 0.0


def test_text_similarity_is_deterministic_and_handles_missing_text():
    assert lexical_similarity(None, "Python") == 0.0
    assert lexical_similarity("Python", "") == 0.0
    assert lexical_similarity("Python API", "Python API") == 1.0
    assert overlap_terms("FastAPI Python", "Python SQL") == ["python"]
