export const ROUTES = {
  HOME: "/",
  PROFILE: "/profile",
  // Колбэк OIDC-входа через реестр ФСП: ловит code и возвращает в анкету.
  FSP_CALLBACK: "/profile/fsp-callback",
  INVITATIONS: "/invitations",
  ABOUT: "/about",
  SETTINGS: "/settings",
  LEGAL: {
    CONSENT: "/legal/consent",
  },
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    CONFIRM: "/auth/confirm",
    FORGOT: "/auth/forgot",
    RESET: "/auth/reset",
  },
  EMPLOYER: {
    ROOT: "/employer",
    NEEDS: "/employer/needs",
    NEED_NEW: "/employer/needs/new",
    NEED: "/employer/needs/:needId",
    NEED_EDIT: "/employer/needs/:needId/edit",
    SEARCH: "/employer/search",
    INVITATIONS: "/employer/invitations",
    COMPANY: "/employer/company",
  },
  // Не идет в реальное приложение
  TEST: "/test",
};

export function needPath(needId: string): string {
  return ROUTES.EMPLOYER.NEED.replace(":needId", encodeURIComponent(needId));
}

export function needEditPath(needId: string): string {
  return ROUTES.EMPLOYER.NEED_EDIT.replace(
    ":needId",
    encodeURIComponent(needId),
  );
}
