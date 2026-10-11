---
title: ФСП
order: 4
---

# ФСП

Реестр Федерации спортивного программирования нужен, чтобы показать достижения в анкете и дать ранжированию небольшой бонус `fspEvidence`. Пустая история не отсекает кандидата: нет ID или реестр ответил 404, подборка всё равно считается.

Bun и Elysia, сид и тестовые `fsp-b101`: страница [мока](/stack/fsp-mock).

## Как привязывают

В профиле кнопка «Войти через ФСП» уводит браузер на мок `/authorize` (как Keycloak: почта, пароль любой). После формы мок кидает обратно на `/profile/fsp-callback` с `code` и `state`. Кабинет отдаёт код в `POST /profile/fsp-login`, API меняет его на моке через `POST /token` и пишет `fspId` в анкету.

Почту можно сверить заранее: `GET /participants/by-email/:email`. Три исхода: `found`, `not-found` и `unavailable`. При сбое нельзя врать, что истории нет.

Подборка ходит `GET /participants/:fspId`. Таймаут 2 секунды, кэш Redis на час. 404 и простой превращаются в пустой список.

Живой мок: [fsp-mock.eegov.net](https://fsp-mock.eegov.net), OpenAPI: [fsp-mock.eegov.net/docs](https://fsp-mock.eegov.net/docs).

![Вход через ФСП](/diagrams/fsp-login.svg)

Исходник: `site/excalidraw/fsp-login.excalidraw` (пересборка: `npm run excalidraw:fsp` в `docs/prod`).
