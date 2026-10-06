import { ROUTES } from "@/shared/router/routes";
import { currentPath, returnTo } from "@/shared/router/use-return-path";
import { Alert, Button, Group, Stack } from "@mantine/core";
import { Link, useLocation } from "react-router";

// В приглашении нужно название компании (ТЗ 2.2.2), без профиля его не собрать.
export const CompanyRequired = () => {
  const location = useLocation();

  return (
    <Stack>
      <Alert variant="light" title="Сначала профиль компании">
        В приглашении кандидат увидит название компании и способ связи.
        Заполните профиль, это займёт минуту.
      </Alert>
      <Group justify="flex-end">
        {/* После сохранения профиль вернёт обратно к подборке. */}
        <Button
          component={Link}
          to={ROUTES.EMPLOYER.COMPANY}
          state={returnTo(currentPath(location))}
        >
          Заполнить профиль
        </Button>
      </Group>
    </Stack>
  );
};
