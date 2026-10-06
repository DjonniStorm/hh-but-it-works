import { ROUTES } from "@/shared/router/routes";
import { Anchor } from "@mantine/core";
import { Link } from "react-router";

export const BackToNeeds = () => {
  return (
    <Anchor component={Link} to={ROUTES.EMPLOYER.NEEDS} size="sm">
      ← Потребности
    </Anchor>
  );
};
