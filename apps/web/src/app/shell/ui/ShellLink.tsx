import { Anchor, Badge } from "@mantine/core";
import { Link } from "react-router";

export const ShellLink = ({
  to,
  label,
  active,
  count,
}: {
  to: string;
  label: string;
  active: boolean;
  count?: number;
}) => {
  return (
    <Anchor
      component={Link}
      to={to}
      underline="never"
      c={active ? "fsp.6" : "black"}
      fw={active ? 700 : 400}
      aria-label={count ? `${label}, ${count}` : undefined}
      style={{ whiteSpace: "nowrap" }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {label}
        {count ? (
          <Badge color="fsp" variant="filled" circle>
            {count}
          </Badge>
        ) : null}
      </span>
    </Anchor>
  );
};
