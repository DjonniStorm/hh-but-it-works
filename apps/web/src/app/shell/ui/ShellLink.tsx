import { Anchor } from "@mantine/core";
import { Link } from "react-router";

export const ShellLink = ({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active: boolean;
}) => {
  return (
    <Anchor
      component={Link}
      to={to}
      underline="never"
      c={active ? "fsp.6" : "black"}
      fw={active ? 700 : 400}
      style={{ whiteSpace: "nowrap" }}
    >
      {label}
    </Anchor>
  );
};
