import { parseAsStringLiteral } from "nuqs";

export const profileTabs = ["form", "testing"] as const;

export const profileTabParser =
  parseAsStringLiteral(profileTabs).withDefault("form");
