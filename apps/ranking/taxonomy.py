from __future__ import annotations

import re
from dataclasses import dataclass


_NORMALIZE_RE = re.compile(r"[^a-zа-я0-9+#.]+")


ALIASES: dict[str, set[str]] = {
    "javascript": {"javascript", "js", "ecmascript"},
    "typescript": {"typescript", "ts"},
    "nodejs": {"node", "nodejs", "node.js", "node js"},
    "nestjs": {"nestjs", "nest", "nest.js", "nest js"},
    "postgresql": {"postgresql", "postgres", "postgres sql", "pg"},
    "mysql": {"mysql", "my sql"},
    "python": {"python", "py"},
    "fastapi": {"fastapi", "fast api"},
    "django": {"django"},
    "flask": {"flask"},
    "docker": {"docker", "containers", "containerization", "контейнеризация"},
    "kubernetes": {"kubernetes", "k8s"},
    "redis": {"redis"},
    "kafka": {"kafka", "apache kafka"},
    "rabbitmq": {"rabbitmq", "rabbit mq"},
    "git": {"git"},
    "linux": {"linux", "gnu linux"},
    "pytest": {"pytest", "py.test"},
    "sql": {"sql"},
    "java": {"java"},
    "spring": {"spring", "spring boot", "springboot"},
    "react": {"react", "reactjs", "react.js"},
    "fastapi_testing": {"fastapi testing"},
    # Слаги и заголовки каталога (packages/types/src/skill-catalog.ts) обязаны
    # сводиться к одному канону: иначе must-have из формы вакансии не совпадёт
    # с навыком кандидата, который шлётся заголовком.
    "http_api": {"http api", "http и api", "http-api"},
    "testing": {"testing", "тестирование", "тесты"},
    "csharp": {"csharp", "c#", "c sharp"},
    "nextjs": {"nextjs", "next.js", "next js"},
    "dotnet": {"dotnet", ".net"},
    "cicd": {"cicd", "ci/cd", "ci cd", "ci-cd"},
    "cplusplus": {"cplusplus", "c++", "cpp", "c plus plus"},
    "vue": {"vue", "vue.js", "vuejs", "vue js"},
    "microservices": {"microservices", "microservice", "микросервисы"},
    "networks": {"networks", "networking", "сети"},
    "statistics": {"statistics", "статистика"},
    "cryptography": {"cryptography", "криптография"},
    "algorithms": {"algorithms", "алгоритмы"},
    "pentest": {"pentest", "penetration testing"},
}

# Partial relations are deliberately conservative: related tech is not a substitute
# for a strict must-have skill, but can improve soft relevance.
RELATED: dict[str, dict[str, float]] = {
    "nestjs": {"nodejs": 0.72, "typescript": 0.58, "javascript": 0.35},
    "nodejs": {"javascript": 0.62, "typescript": 0.42},
    "fastapi": {"python": 0.68},
    "django": {"python": 0.64},
    "flask": {"python": 0.64},
    "spring": {"java": 0.70},
    "postgresql": {"sql": 0.58},
    "mysql": {"sql": 0.58},
    "kafka": {"rabbitmq": 0.22},
    "rabbitmq": {"kafka": 0.22},
    "typescript": {"javascript": 0.55},
    "javascript": {"typescript": 0.30},
}


@dataclass(frozen=True)
class SkillMatch:
    score: float
    exact: bool
    matched_candidate_skill: str | None


def _norm(value: str) -> str:
    lowered = value.strip().lower().replace("ё", "е")
    return _NORMALIZE_RE.sub(" ", lowered).strip()


def canonical_skill(value: str) -> str:
    normalized = _norm(value)
    for canonical, aliases in ALIASES.items():
        if normalized in {_norm(alias) for alias in aliases}:
            return canonical
    return normalized.replace(" ", "_")


def skill_match(required: str, candidate_skills: set[str]) -> SkillMatch:
    req = canonical_skill(required)
    canonical_candidate = {canonical_skill(item) for item in candidate_skills}
    if req in canonical_candidate:
        return SkillMatch(1.0, True, req)

    best_score = 0.0
    best_skill: str | None = None
    for candidate in canonical_candidate:
        score = RELATED.get(req, {}).get(candidate, 0.0)
        reverse_score = RELATED.get(candidate, {}).get(req, 0.0) * 0.8
        score = max(score, reverse_score)
        if score > best_score:
            best_score = score
            best_skill = candidate
    return SkillMatch(best_score, False, best_skill)
