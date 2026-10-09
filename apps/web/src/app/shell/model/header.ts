import { ROUTES } from "@/shared/router/routes";

import { Role } from "@hh/types";

export const headerHeight = 64;

export type ShellLinkItem = {
  to: string;
  label: string;
  // exact — только сама страница, prefix — и всё, что внутри раздела.
  match: "exact" | "prefix";
};

const homeLink: ShellLinkItem = {
  to: ROUTES.HOME,
  label: "Главная",
  match: "exact",
};

// Шапка и мобильное меню берут ссылки отсюда, чтобы списки не разошлись.
export const shellLinks: Record<Role, ShellLinkItem[]> = {
  [Role.Candidate]: [
    homeLink,
    { to: ROUTES.PROFILE, label: "Профиль", match: "exact" },
    { to: ROUTES.INVITATIONS, label: "Приглашения", match: "exact" },
  ],
  // У работодателя главная — это подборки (HomePage уводит туда), отдельный пункт дублировал бы их.
  [Role.Employer]: [
    { to: ROUTES.EMPLOYER.NEEDS, label: "Подборки", match: "prefix" },
    { to: ROUTES.EMPLOYER.SEARCH, label: "Поиск", match: "prefix" },
    { to: ROUTES.EMPLOYER.INVITATIONS, label: "Приглашения", match: "prefix" },
    { to: ROUTES.EMPLOYER.COMPANY, label: "Компания", match: "prefix" },
  ],
};

export function isLinkActive(link: ShellLinkItem, pathname: string): boolean {
  if (link.match === "exact") {
    return pathname === link.to;
  }
  return pathname.startsWith(link.to);
}
