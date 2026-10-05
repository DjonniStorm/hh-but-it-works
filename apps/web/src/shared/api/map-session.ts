import type { PublicUser, Session } from "@hh/contracts";
import type { Role } from "@hh/types";

export function mapSession(session: {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    emailVerifiedAt: string | null;
  };
}): Session {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: mapPublicUser(session.user),
  };
}

export function mapPublicUser(user: {
  id: string;
  email: string;
  role: string;
  emailVerifiedAt: string | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: mapRole(user.role),
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

function mapRole(role: string): Role {
  if (role === "candidate" || role === "employer") {
    return role as Role;
  }
  throw new Error("Неизвестная роль");
}
