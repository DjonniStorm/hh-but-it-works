export type Letter = {
  subject: string;
  text: string;
  html: string;
};

// Содержимое письма — обычный текст. Экранирует его layout: в письмо попадают
// название компании и текст приглашения, которые пишет пользователь.
export type LetterContent = {
  subject: string;
  heading: string;
  paragraphs: string[];
  action: { label: string; url: string };
  footnote: string;
};

export const automaticFootnote =
  "Письмо отправлено автоматически, отвечать на него не нужно.";

export function renderLetter(content: LetterContent): Letter {
  const { subject, heading, paragraphs, action, footnote } = content;
  return {
    subject,
    text: [
      heading,
      "",
      ...paragraphs.flatMap((paragraph) => {
        return [paragraph, ""];
      }),
      `${action.label}: ${action.url}`,
      "",
      footnote,
    ].join("\n"),
    html: `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,sans-serif;color:#1b1c21">
    <div style="max-width:480px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px">
      <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(heading)}</h1>
      ${paragraphs.map(paragraphHtml).join("\n      ")}
      <a href="${escapeHtml(action.url)}" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#1b1c21;color:#ffffff;border-radius:8px;text-decoration:none;font-size:15px">
        ${escapeHtml(action.label)}
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#55565c">
        Кнопка не работает? Скопируйте ссылку в браузер:<br />
        <a href="${escapeHtml(action.url)}" style="color:#55565c;word-break:break-all">${escapeHtml(action.url)}</a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#55565c">
        ${escapeHtml(footnote)}
      </p>
    </div>
  </body>
</html>`,
  };
}

const rubles = new Intl.NumberFormat("ru-RU");

// Как formatSalary в apps/web/src/shared/lib/format.ts.
export function formatSalary(from: number, to: number): string {
  return `${rubles.format(from)} – ${rubles.format(to)} ₽`;
}

// pre-line сохраняет переносы строк из текста приглашения.
function paragraphHtml(paragraph: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.5;white-space:pre-line">${escapeHtml(paragraph)}</p>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
