import { useLocation } from "react-router";

import { ROUTES } from "./routes";

type ReturnLocation = {
  from?: unknown;
};

export function returnTo(path: string): { from: string } {
  return { from: path };
}

export function currentPath(location: {
  pathname: string;
  search: string;
}): string {
  return `${location.pathname}${location.search}`;
}

export function useReturnPath(): string {
  const location = useLocation();
  const from = (location.state as ReturnLocation | null)?.from;
  if (typeof from !== "string" || !isAppPath(from)) {
    return ROUTES.HOME;
  }
  return from;
}

function isAppPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }
  if (path.startsWith("/auth/")) {
    return false;
  }
  return true;
}
