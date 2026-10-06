export const ROUTES = {
  HOME: "/",
  PROFILE: "/profile",
  ABOUT: "/about",
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    CONFIRM: "/auth/confirm",
  },
  EMPLOYER: {
    ROOT: "/employer",
    NEEDS: "/employer/needs",
    NEED_NEW: "/employer/needs/new",
    NEED: "/employer/needs/:needId",
    INVITATIONS: "/employer/invitations",
    COMPANY: "/employer/company",
  },
  // Не идет в реальное приложение
  TEST: "/test",
};

export function needPath(needId: string): string {
  return ROUTES.EMPLOYER.NEED.replace(":needId", encodeURIComponent(needId));
}
