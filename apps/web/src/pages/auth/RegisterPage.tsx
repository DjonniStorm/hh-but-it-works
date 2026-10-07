import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { focusFirstError } from "@/shared/lib/focus-first-error";
import { ROUTES } from "@/shared/router/routes";
import { pageTitle, usePageTitle } from "@/shared/router/use-page-title";
import {
  Anchor,
  Button,
  Center,
  Checkbox,
  Paper,
  PasswordInput,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { observer } from "mobx-react-lite";
import { Link, Navigate, useNavigate } from "react-router";

import { registerSchema } from "@hh/contracts";
import { Role } from "@hh/types";

export const RegisterPage = observer(() => {
  usePageTitle(pageTitle.register);
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      role: "",
      consent: false,
    },
    validate: schemaResolver(registerSchema, { sync: true }),
  });

  if (auth.accessToken) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const onSubmit = form.onSubmit(
    (values) => {
      // Резолвер уже проверил роль и согласие. В типе формы они шире, чем ждёт register.
      void auth.register(
        {
          email: values.email,
          password: values.password,
          role: values.role as Role,
          consent: true,
        },
        {
          onSuccess: () => {
            notifier.showSuccess("Ссылка подтверждения отправлена");
            navigate(ROUTES.AUTH.LOGIN);
          },
        },
      );
    },
    (errors) => {
      focusFirstError(form, errors);
    },
  );

  return (
    <Center mih="100vh" p="md">
      {/* noValidate: ошибки показывает форма, а не всплывашка браузера на type="email". */}
      <Paper
        component="form"
        onSubmit={onSubmit}
        noValidate
        withBorder
        p="xl"
        w={420}
      >
        <Stack>
          <Title order={2}>Регистрация</Title>
          <TextInput
            label="Почта"
            type="email"
            autoComplete="email"
            withAsterisk
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Пароль"
            autoComplete="new-password"
            withAsterisk
            {...form.getInputProps("password")}
          />
          <Select
            label="Роль"
            withAsterisk
            data={[
              { value: Role.Candidate, label: "Кандидат" },
              { value: Role.Employer, label: "Работодатель" },
            ]}
            {...form.getInputProps("role")}
          />
          <Checkbox
            label="Согласен на обработку и публикацию данных профиля (152-ФЗ)"
            {...form.getInputProps("consent", { type: "checkbox" })}
          />
          <Button type="submit">Создать аккаунт</Button>
          <Anchor component={Link} to={ROUTES.AUTH.LOGIN}>
            Уже есть аккаунт
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
});
