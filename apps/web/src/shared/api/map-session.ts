import type { PublicUser, Session } from "@hh/contracts";
import type { Role } from "@hh/types";

export function mapSession(session: {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    emailVerifiedAt: string | null;
    consentAt?: string | null;
  };
}): Session {
  return {
    accessToken: session.accessToken,
    user: mapPublicUser(session.user),
  };
}

export function mapPublicUser(user: {
  id: string;
  email: string;
  role: string;
  emailVerifiedAt: string | null;
  consentAt?: string | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: mapRole(user.role),
    emailVerifiedAt: user.emailVerifiedAt,
    consentAt: typeof user.consentAt === "string" ? user.consentAt : null,
  };
}

function mapRole(role: string): Role {
  if (role === "candidate" || role === "employer") {
    return role as Role;
  }
  throw new Error("Неизвестная роль");
}
