import { type MantineColorsTuple, createTheme } from "@mantine/core";

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
