from __future__ import annotations

import re


TOKEN_RE = re.compile(r"[a-zа-яё0-9+#.]{2,}", re.IGNORECASE)
STOP_WORDS = {
    "the", "and", "for", "with", "from", "this", "that", "или", "для",
    "как", "при", "это", "под", "над", "без", "его", "ее", "их", "мы",
    "вы", "они", "будет", "нужно", "работа", "работы", "опыт", "знание",
    "знания", "умение", "навык", "навыки", "требуется", "обязанности",
}
RU_SUFFIXES = (
    "иями", "ями", "ами", "ого", "ему", "ому", "ение", "ений", "ания",
    "ать", "ять", "ить", "ость", "ости", "ами", "ами", "ов", "ев", "ий",
    "ый", "ая", "ое", "ые", "ам", "ям", "ах", "ях", "ом", "ем", "а",
    "я", "ы", "и", "у", "ю", "е", "о",
)
EN_SUFFIXES = ("ments", "ment", "ing", "ers", "er", "ed", "es", "s")


def _stem(token: str) -> str:
    value = token.lower().replace("ё", "е")
    suffixes = RU_SUFFIXES if re.search(r"[а-я]", value) else EN_SUFFIXES
    for suffix in suffixes:
        if value.endswith(suffix) and len(value) - len(suffix) >= 4:
            value = value[: -len(suffix)]
            break
    # Prefix capping makes «разработка» and «разрабатывать» meet even when a
    # conservative suffix rule misses them, while long random words stay apart.
    return value[:8]


def text_terms(text: str | None) -> set[str]:
    if not text:
        return set()
    return {
        stem
        for raw in TOKEN_RE.findall(text.lower())
        if raw not in STOP_WORDS and len(stem := _stem(raw)) >= 2
    }


def overlap_terms(candidate_text: str | None, need_text: str | None) -> list[str]:
    return sorted(text_terms(candidate_text) & text_terms(need_text))


def lexical_similarity(candidate_text: str | None, need_text: str | None) -> float:
    """Explainable 0..1 relevance using requirement coverage and Jaccard.

    Coverage matters more than raw Jaccard because a detailed candidate profile
    naturally contains many terms that are irrelevant to one vacancy.
    """
    candidate = text_terms(candidate_text)
    need = text_terms(need_text)
    if not candidate or not need:
        return 0.0
    overlap = candidate & need
    coverage = len(overlap) / len(need)
    jaccard = len(overlap) / len(candidate | need)
    return min(1.0, 0.80 * coverage + 0.20 * jaccard)
