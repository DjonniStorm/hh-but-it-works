# ML data card

`open_vacancy_seeds.jsonl` — компактный набор профессиональных признаков из
публичных вакансий «Работы России». Имена работодателей, точные адреса,
контакты и реальные резюме намеренно не сохраняются. Источники и дата доступа
зафиксированы в `SOURCES.json`.

`gold*.jsonl` — **не человеческий gold**. Это controlled-synthetic benchmark:
реальная вакансия превращается в `HiringNeed`, а восемь обезличенных профилей
с разной квалификацией и мотивацией генерируются детерминированно. Метки
`qualificationLabel`, `intentLabel` и итоговый `label` определяются сценарием,
а не текущим rules-score. `labelConfidence` используется как sample weight.

Набор подходит для smoke/regression/e2e-проверок ML-пайплайна и безопасной
разработки признаков. Он не подходит для доказательства production uplift.
Для production promotion нужны независимые двойные человеческие оценки,
adjudication и group-disjoint holdout. Шаблон готовит `human_labels.py`;
батч-001 и инструкция для экспертов — `evaluation/annotation/README.md`.

Ограничения: небольшой размер, вакансии 2021 года, синтетические кандидаты,
нет причинно-следственных данных о найме, возможен selection bias источника.
Protected attributes не генерируются и не используются.

`llm_gold*.jsonl` — те же 168 пар, размеченные **одним LLM-судьёй**
(`labelSource: llm_judge_v1`, blind: scenario и синтетические метки перед
разметкой вырезаны). Сплиты зеркалят need-принадлежность `gold_*`-сплитов.
Провенанс, условия импорта и честная сверка со сценариями (exact match 87.5 %,
mean Kendall tau 1.0 — llm-порядок внутри групп совпал со сценарным) —
`llm_gold_provenance.json`. Это **не human gold**: бандл на этих метках
открывает замок только через явный `train_ltr.py --llm-approved`
(`approvalSource: llm_judge_v1` в metadata).
