import { ROUTES } from "@/shared/router/routes";
import { Anchor } from "@mantine/core";
import { Link } from "react-router";

export const BackToNeeds = () => {
  return (
    <Anchor component={Link} to={ROUTES.EMPLOYER.NEEDS} size="sm">
      {/* Раздел в меню называется «Подборки»: одно имя, чтобы не искать два разных места. */}
      <span aria-hidden>←</span> Подборки
    </Anchor>
  );
};
