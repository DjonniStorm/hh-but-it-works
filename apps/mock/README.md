# mock

Мок реестра ФСП на Bun и Elysia. `GET /participants/:fspId` отдаёт достижения. Если истории нет — `404`. Известный id для проверки: `fsp-demo`.

В dev Compose это сервис `mock`, порт `3001`.
