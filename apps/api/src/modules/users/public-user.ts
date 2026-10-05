import { Role } from "@hh/types";

import { User } from "./user.entity";

export type PublicUser = {
  id: string;
  email: string;
  role: Role;
  emailVerifiedAt: string | null;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  };
}
