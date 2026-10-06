import { ROUTES } from "@/shared/router/routes";
import { Anchor } from "@mantine/core";
import { Link } from "react-router";

export const BackHome = () => {
  return (
    <Anchor component={Link} to={ROUTES.HOME}>
      На главную
    </Anchor>
  );
};
