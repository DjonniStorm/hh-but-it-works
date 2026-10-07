import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { focusFirstError } from "@/shared/lib/focus-first-error";
import { ROUTES } from "@/shared/router/routes";
import { pageTitle, usePageTitle } from "@/shared/router/use-page-title";
import { useReturnPath } from "@/shared/router/use-return-path";
import {
  Anchor,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { observer } from "mobx-react-lite";
import { Link, Navigate, useNavigate } from "react-router";

import { loginSchema } from "@hh/contracts";

export const LoginPage = observer(() => {
  usePageTitle(pageTitle.login);
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();
  const returnPath = useReturnPath();
  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: schemaResolver(loginSchema, { sync: true }),
  });

  if (auth.accessToken) {
    return <Navigate to={returnPath} replace />;
  }

  const onSubmit = form.onSubmit(
    (values) => {
      void auth.login(values, {
        onSuccess: () => {
          notifier.showSuccess("Вход выполнен");
          navigate(returnPath);
        },
      });
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
          <Title order={2}>Вход</Title>
          <TextInput
            label="Почта"
            type="email"
            autoComplete="email"
            withAsterisk
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Пароль"
            autoComplete="current-password"
            withAsterisk
            {...form.getInputProps("password")}
          />
          <Button type="submit">Войти</Button>
          <Anchor component={Link} to={ROUTES.AUTH.REGISTER}>
            Регистрация
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
});
