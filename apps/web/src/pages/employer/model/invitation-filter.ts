import { parseAsStringLiteral } from "nuqs";

import { InvitationStatus } from "@hh/types";

export const invitationStatuses = [
  InvitationStatus.Sent,
  InvitationStatus.Viewed,
  InvitationStatus.Accepted,
  InvitationStatus.Declined,
  InvitationStatus.Withdrawn,
] as const;

export const invitationStatusFilter = parseAsStringLiteral([
  "all",
  ...invitationStatuses,
] as const)
  .withDefault("all")
  .withOptions({ history: "replace" });
