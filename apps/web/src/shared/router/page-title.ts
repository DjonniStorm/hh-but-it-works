// Шаблон заголовка вкладки: страница задаёт только свою часть через useHead({ title }).
export const titleTemplate = "%s — ЛЦТ";

// Заголовки вкладок. Без них все вкладки называются «ЛЦТ» и их не отличить.
export const pageTitle = {
  login: "Вход",
  register: "Регистрация",
  confirm: "Подтверждение почты",
  home: "Главная",
  profile: "Профиль",
  candidateInvitations: "Приглашения",
  needs: "Подборки",
  needNew: "Новая подборка",
  employerInvitations: "Приглашения",
  company: "Компания",
  error: "Ошибка",
} as const;
