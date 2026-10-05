import { mapSession } from "@/shared/api/map-session";

import type { Session } from "@hh/contracts";

const sessionKey = "hh.session";

export function readSession(): Session | null {
  const raw = localStorage.getItem(sessionKey);
  if (!raw) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (!isStoredSession(value)) {
      return null;
    }
    return mapSession(value);
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(sessionKey);
}

function isStoredSession(value: unknown): value is {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    emailVerifiedAt: string | null;
  };
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const session = value as Record<string, unknown>;
  const user = session.user;
  if (
    typeof session.accessToken !== "string" ||
    typeof session.refreshToken !== "string"
  ) {
    return false;
  }
  if (typeof user !== "object" || user === null) {
    return false;
  }
  const record = user as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.email === "string" &&
    typeof record.role === "string" &&
    (record.emailVerifiedAt === null ||
      typeof record.emailVerifiedAt === "string")
  );
}
