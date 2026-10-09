import { useState } from "react";

import { notifier } from "@/app/store/notifier";
import { RequestFailed } from "@/app/store/request";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { useSettledValue } from "@/shared/decor/model/use-settled-value";
import { ArtBackdrop } from "@/shared/decor/ui/ArtBackdrop";
import { focusFirstError } from "@/shared/lib/focus-first-error";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES } from "@/shared/router/routes";
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
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { Link, Navigate, useNavigate } from "react-router";

import { loginSchema } from "@hh/contracts";

export const LoginPage = observer(() => {
  useHead({ title: pageTitle.login });
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();
  const returnPath = useReturnPath();
  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: schemaResolver(loginSchema, { sync: true }),
  });
  // Почта, на которой вход упал с «Почта не подтверждена»: для неё предлагаем письмо ещё раз.
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  // Фон собирается по хешу почты: у каждого человека своя раскладка картинок.
  // Ждём, пока ввод успокоится, иначе фон дёргался бы за каждую букву.
  // Хук возвращает значение, без деструктуризации — иначе это разбор строки.
  const settledEmail = useSettledValue(form.values.email);
  const backdropSeed = settledEmail.includes("@") ? settledEmail : "guest";

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
        onError: (error) => {
          // 403 — пароль верный, но почта не подтверждена.
          if (error instanceof RequestFailed && error.status === 403) {
            setUnconfirmedEmail(values.email);
          }
        },
      });
    },
    (errors) => {
      focusFirstError(form, errors);
    },
  );

  const resendConfirmation = (email: string) => {
    void auth.resendConfirmation(
      { email },
      {
        onSuccess: () => {
          notifier.showSuccess("Письмо отправлено, проверьте почту");
        },
      },
    );
  };

  return (
    <Center mih="100vh" p="md">
      <ArtBackdrop seed={backdropSeed} />
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
          {unconfirmedEmail ? (
            <Button
              variant="light"
              onClick={() => {
                resendConfirmation(unconfirmedEmail);
              }}
            >
              Отправить письмо ещё раз
            </Button>
          ) : null}
          <Anchor component={Link} to={ROUTES.AUTH.REGISTER}>
            Регистрация
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
});
