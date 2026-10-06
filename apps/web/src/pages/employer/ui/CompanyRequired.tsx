import { ROUTES } from "@/shared/router/routes";
import { Alert, Button, Group, Stack } from "@mantine/core";
import { Link } from "react-router";

// В приглашении нужно название компании (ТЗ 2.2.2), без профиля его не собрать.
export const CompanyRequired = () => {
  return (
    <Stack>
      <Alert variant="light" title="Сначала профиль компании">
        В приглашении кандидат увидит название компании и способ связи.
        Заполните профиль, это займёт минуту.
      </Alert>
      <Group justify="flex-end">
        <Button component={Link} to={ROUTES.EMPLOYER.COMPANY}>
          Заполнить профиль
        </Button>
      </Group>
    </Stack>
  );
};
