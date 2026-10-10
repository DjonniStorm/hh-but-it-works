import { useState } from "react";
import type { ReactNode } from "react";

import { fieldBorderColor, surfaceColor } from "@/shared/theme";
import { Anchor, Box, Paper, Stack, Text, useMatches } from "@mantine/core";
import { Link } from "react-router";

export type SplitLink = {
  label: string;
  to: string;
  // Внешние ссылки (материалы) открываются в новой вкладке.
  external?: boolean;
};

// Общая механика «слайда»: карточка поделена вертикально пополам, справа ссылки
// проявляются по наведению и по фокусу с клавиатуры. На тач-устройствах hover
// нет — там ссылки видны сразу.
export const SplitHoverCard = ({
  left,
  links,
}: {
  left: ReactNode;
  links: SplitLink[];
}) => {
  const [hovered, setHovered] = useState(false);
  const narrow = useMatches(
    { base: true, sm: false },
    { getInitialValueInEffect: false },
  );
  const revealed = hovered || narrow;

  return (
    <Paper
      withBorder
      radius="md"
      style={{ background: surfaceColor, overflow: "hidden" }}
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      onFocus={() => {
        setHovered(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHovered(false);
        }
      }}
    >
      <Box
        style={{ display: "flex", flexDirection: narrow ? "column" : "row" }}
      >
        <Box style={{ flexBasis: narrow ? "auto" : "50%", padding: "1.5rem" }}>
          {left}
        </Box>
        <Box
          style={{
            flexBasis: narrow ? "auto" : "50%",
            padding: "1.5rem",
            display: "grid",
            alignItems: "center",
            borderLeft: narrow ? undefined : `1px solid ${fieldBorderColor}`,
            borderTop: narrow ? `1px solid ${fieldBorderColor}` : undefined,
            // #F2F3FF — светлый fsp: правая половина подсвечивается по наведению.
            background: revealed ? "#F2F3FF" : "transparent",
            transition: "background 0.2s ease",
          }}
        >
          {/* Стрелка занимает половину до наведения и исчезает вместе с ней,
              когда проявляются ссылки. */}
          <Text
            size="xl"
            c="dimmed"
            style={{
              gridArea: "1 / 1",
              justifySelf: "center",
              opacity: revealed ? 0 : 1,
              transition: "opacity 0.2s ease",
              pointerEvents: "none",
            }}
          >
            {links[0]?.external ? "↗" : "→"}
          </Text>
          <Stack
            gap="sm"
            style={{
              gridArea: "1 / 1",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "none" : "translateX(8px)",
              pointerEvents: revealed ? "auto" : "none",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          >
            {links.map((link) => {
              return link.external ? (
                <Anchor
                  key={link.to}
                  href={link.to}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                >
                  {link.label} ↗
                </Anchor>
              ) : (
                <Anchor key={link.to} component={Link} to={link.to} size="sm">
                  {link.label} →
                </Anchor>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
};
