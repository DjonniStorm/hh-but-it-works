type Letter = {
  subject: string;
  text: string;
  html: string;
};

// Ссылка живёт сутки: emailConfirmTtlSeconds в modules/auth/session.store.ts.
export function confirmationLetter(link: string): Letter {
  return {
    subject: "Подтвердите почту — ЛЦТ",
    text: [
      "Здравствуйте!",
      "",
      "Чтобы закончить регистрацию, откройте ссылку:",
      link,
      "",
      "Ссылка действует сутки. Если вы не регистрировались, просто удалите это письмо.",
    ].join("\n"),
    html: `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,sans-serif;color:#1b1c21">
    <div style="max-width:480px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px">
      <h1 style="margin:0 0 16px;font-size:20px">Подтвердите почту</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5">
        Чтобы закончить регистрацию, нажмите на кнопку.
      </p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#1b1c21;color:#ffffff;border-radius:8px;text-decoration:none;font-size:15px">
        Подтвердить почту
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#55565c">
        Кнопка не работает? Скопируйте ссылку в браузер:<br />
        <a href="${link}" style="color:#55565c;word-break:break-all">${link}</a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#55565c">
        Ссылка действует сутки. Если вы не регистрировались, просто удалите это письмо.
      </p>
    </div>
  </body>
</html>`,
  };
}
