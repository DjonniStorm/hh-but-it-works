import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ROUTES } from "@/shared/router/routes";
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
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();
  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: schemaResolver(loginSchema, { sync: true }),
  });

  if (auth.accessToken) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const onSubmit = form.onSubmit((values) => {
    void auth.login(values, {
      onSuccess: () => {
        notifier.showSuccess("Вход выполнен");
        navigate(ROUTES.HOME);
      },
    });
  });

  return (
    <Center mih="100vh" p="md">
      <Paper component="form" onSubmit={onSubmit} withBorder p="xl" w={420}>
        <Stack>
          <Title order={2}>Вход</Title>
          <TextInput label="Почта" {...form.getInputProps("email")} />
          <PasswordInput label="Пароль" {...form.getInputProps("password")} />
          <Button type="submit">Войти</Button>
          <Anchor component={Link} to={ROUTES.AUTH.REGISTER}>
            Регистрация
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
});
