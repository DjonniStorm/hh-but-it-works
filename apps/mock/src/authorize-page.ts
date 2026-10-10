// Страница «Входа в ФСП»: эмуляция логина Keycloak.
// Пароль не проверяется — это демо; связь подтверждает почта,
// на которую участник зарегистрирован в реестре.

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const authorizePage = (options: {
  redirectUri: string;
  state: string;
  clientId: string;
  email: string;
  error: string | null;
}): string => {
  const errorBlock = options.error
    ? `<p class="error">${escapeHtml(options.error)}</p>`
    : "";
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Вход в ФСП</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        background: #f4f5ff;
        color: #1c1c2b;
      }
      .card {
        width: 100%;
        max-width: 420px;
        background: #fff;
        border: 1px solid #e3e4f2;
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 8px 24px rgba(28, 20, 120, 0.08);
      }
      h1 { margin: 0 0 8px; font-size: 22px; }
      .sub { margin: 0 0 20px; font-size: 14px; color: #5b5b74; }
      .error {
        margin: 0 0 16px;
        padding: 10px 12px;
        border-radius: 8px;
        background: #fff1f3;
        color: #a10e20;
        font-size: 14px;
      }
      label { display: block; font-size: 13px; font-weight: 600; margin: 14px 0 6px; }
      label:first-of-type { margin-top: 0; }
      input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #c9cadf;
        border-radius: 8px;
        font-size: 15px;
      }
      input:focus { outline: 2px solid #402fff; outline-offset: 1px; border-color: #402fff; }
      button {
        margin-top: 20px;
        width: 100%;
        padding: 11px;
        border: 0;
        border-radius: 8px;
        background: #402fff;
        color: #fff;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
      }
      button:hover { background: #3424d4; }
      .hint { margin: 12px 0 0; font-size: 12px; color: #8a8aa3; }
      .foot { margin: 8px 0 0; font-size: 12px; color: #8a8aa3; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Вход в ФСП</h1>
      <p class="sub">
        Рабочая эмуляция Keycloak: войдите на почту, на которую вы
        зарегистрированы в реестре Федерации спортивного программирования.
      </p>
      ${errorBlock}
      <form method="post" action="/authorize">
        <input type="hidden" name="redirect_uri" value="${escapeHtml(options.redirectUri)}" />
        <input type="hidden" name="state" value="${escapeHtml(options.state)}" />
        <input type="hidden" name="client_id" value="${escapeHtml(options.clientId)}" />
        <label for="email">Почта в ФСП</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autocomplete="email"
          autofocus
          placeholder="seed.b101@candidates.hh.test"
          value="${escapeHtml(options.email)}"
        />
        <label for="password">Пароль</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autocomplete="current-password"
          placeholder="Любой"
        />
        <button type="submit">Войти</button>
      </form>
      <p class="hint">
        Это эмуляция: пароль любой, проверяется только почта. Демо-участники —
        seed.b101@candidates.hh.test, seed.test@candidates.hh.test.
      </p>
      <p class="foot">Мок реестра ФСП · эмуляция OIDC-входа</p>
    </main>
  </body>
</html>`;
};
