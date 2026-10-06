import { type MantineColorsTuple, createTheme } from "@mantine/core";

import { InvitationStatus, SkillVerification } from "@hh/types";

/** #402FFF, оттенок 6 — цвет из брендбука. */
const fsp: MantineColorsTuple = [
  "#F2F3FF",
  "#DEE0FF",
  "#C0C4FF",
  "#9AA0FF",
  "#7478FF",
  "#5648FF",
  "#402FFF",
  "#3424D4",
  "#281CA6",
  "#1C1478",
];

/** #EC1D35, оттенок 6 — цвет из брендбука. */
const fspRed: MantineColorsTuple = [
  "#FFF1F3",
  "#FFD8DD",
  "#FFB3BB",
  "#FF8491",
  "#F85368",
  "#F03349",
  "#EC1D35",
  "#C91228",
  "#A10E20",
  "#6E0916",
];

export const feedbackColor = {
  error: "fspRed",
  success: "fsp",
} as const;

export const invitationStatusColor: Record<InvitationStatus, string> = {
  [InvitationStatus.Sent]: "gray",
  [InvitationStatus.Viewed]: "fsp",
  [InvitationStatus.Accepted]: "teal",
  [InvitationStatus.Declined]: "fspRed",
};

// Те же цвета, что у SkillStatusBadge в профиле кандидата.
export const verificationColor: Record<SkillVerification, string> = {
  [SkillVerification.Unverified]: "gray",
  [SkillVerification.Verified]: "fsp",
  [SkillVerification.VerifiedExternal]: "fspRed",
};

// Фон бренда #EDEDED совпадает с фоном Paper. Карточкам кабинета нужен свой слой, иначе они сливаются.
export const surfaceColor = "#FFFFFF";

export const scoreColor = {
  strong: "fsp",
  medium: "yellow",
  weak: "gray",
} as const;

export const theme = createTheme({
  primaryColor: "fsp",
  primaryShade: 6,
  fontFamily: "JetBrains Mono, monospace",
  black: "#1B1C21",
  white: "#EDEDED",
  colors: {
    fsp,
    fspRed,
  },
});
