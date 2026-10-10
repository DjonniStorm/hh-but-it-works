import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { useSettledValue } from "@/shared/decor/model/use-settled-value";
import { ArtBackdrop } from "@/shared/decor/ui/ArtBackdrop";
import { focusFirstError } from "@/shared/lib/focus-first-error";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES } from "@/shared/router/routes";
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
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { Link, Navigate, useNavigate } from "react-router";

import { registerSchema } from "@hh/contracts";
import { Role } from "@hh/types";

export const RegisterPage = observer(() => {
  useHead({ title: pageTitle.register });
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
  // Фон собирается по хешу почты, как на входе: раскладка успокаивается вместе с вводом.
  // Хук до раннего return — иначе React увидит разное число хуков между рендерами.
  // Хук возвращает значение, без деструктуризации — иначе это разбор строки.
  const settledEmail = useSettledValue(form.values.email);
  const backdropSeed = settledEmail.includes("@") ? settledEmail : "guest";

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
            label="Согласен на обработку и публикацию данных профиля"
            {...form.getInputProps("consent", { type: "checkbox" })}
          />
          <Anchor
            component={Link}
            to={ROUTES.LEGAL.CONSENT}
            target="_blank"
            rel="noreferrer"
          >
            Текст согласия (152-ФЗ)
          </Anchor>
          <Button type="submit">Создать аккаунт</Button>
          <Anchor component={Link} to={ROUTES.AUTH.LOGIN}>
            Уже есть аккаунт
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
});
