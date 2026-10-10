// Шаблон заголовка вкладки: страница задаёт только свою часть через useHead({ title }).
export const titleTemplate = "%s · ЛЦТ";

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
  needEdit: "Изменить потребность",
  search: "Поиск кандидатов",
  employerInvitations: "Приглашения",
  company: "Компания",
  settings: "Настройки",
  consent: "Согласие на обработку данных",
  error: "Ошибка",
} as const;
