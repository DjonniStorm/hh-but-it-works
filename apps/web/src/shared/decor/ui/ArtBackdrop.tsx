import { useMemo } from "react";

import { appSlots, artLayouts } from "@/shared/decor/model/art-layout";
import { BoxArt } from "@/shared/decor/ui/BoxArt";
import { BugArt } from "@/shared/decor/ui/BugArt";
import { CatArt } from "@/shared/decor/ui/CatArt";
import { DuckArt } from "@/shared/decor/ui/DuckArt";
import { GhostArt } from "@/shared/decor/ui/GhostArt";
import { MugArt } from "@/shared/decor/ui/MugArt";
import { PrinterArt } from "@/shared/decor/ui/PrinterArt";
import { TerminalArt } from "@/shared/decor/ui/TerminalArt";
import { Box } from "@mantine/core";

// Пул контурных артов: из него по seed собирается набор для конкретного человека.
const arts = [
  CatArt,
  DuckArt,
  MugArt,
  BoxArt,
  TerminalArt,
  BugArt,
  GhostArt,
  PrinterArt,
];

type ArtBackdropProps = {
  seed: string;
  // auth — плотно вокруг формы; app — реже и прозрачнее, чтобы не спорить с контентом.
  variant?: "auth" | "app";
};

// Фон за контентом: фиксированный слой не участвует в потоке документа, не ловит клики
// и лежит под уведомлениями, модалками и лоадерами (у них zIndex выше).
export const ArtBackdrop = ({ seed, variant = "auth" }: ArtBackdropProps) => {
  const pieces = useMemo(() => {
    if (variant === "app") {
      return artLayouts(seed, arts, {
        slots: appSlots,
        opacity: [0.15, 0.25],
      });
    }
    return artLayouts(seed, arts);
  }, [seed, variant]);

  return (
    <Box
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      {pieces.map(({ art: Art, style, cornerOnly }, index) => {
        return (
          <Box
            key={index}
            aria-hidden
            hiddenFrom={cornerOnly ? "sm" : undefined}
            style={{ position: "absolute", ...style }}
          >
            <Art />
          </Box>
        );
      })}
    </Box>
  );
};
