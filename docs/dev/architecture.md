# Где что лежит

pnpm workspace: `apps/web`, `apps/api`, `apps/mock`, `packages/*`. `apps/ranking` на Python и в workspace не входит.

Локально Postgres, Redis, ranking и mock:

```bash
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up
```

Порты: Postgres `5432`, Redis `6379`, ranking `8000`, mock `3001`. Логин, пароль и база Postgres — `hh`.

Брендбук: [docs/dev/model.md](model.md).

# Сценарии

Узлы с пометкой «не MVP» в ТЗ необязательны.

```mermaid
flowchart LR
  candidate[Кандидат]
  employer[Работодатель]

  candidate --> register[Регистрация и согласие на обработку]
  candidate --> profile[Профиль и резюме]
  candidate --> assessment[Опрос, тест, категория и грейд]
  candidate --> invitations[Приглашения: принять или отклонить]
  candidate --> fspLink[Связь с ФСП ID]
  candidate --> tasks["Короткие задания (не MVP)"]
  candidate --> ownApply["Вакансии и свой отклик (не MVP)"]

  employer --> company[Профиль компании]
  employer --> need[Описание потребности]
  employer --> shortlist[Подборка с объяснением]
  employer --> search[Поиск по банку кандидатов]
  employer --> invitation[Приглашение с зарплатой]
  employer --> vacancy["Публикация вакансии (не MVP)"]
```

# Компоненты

`ranking` без своей БД. `fspMock` снаружи, пустая история — обычный ответ, не ошибка продукта. Redis только для очередей и rate limit, не для бизнес-состояния.

```mermaid
flowchart LR
  browser[Browser]
  web[web]
  api[api]
  ranking[ranking]
  mock[fspMock]
  postgres[(postgres)]
  redis[(redis)]
  browser --> web
  web --> api
  api --> postgres
  api --> redis
  api --> ranking
  api --> mock
```
