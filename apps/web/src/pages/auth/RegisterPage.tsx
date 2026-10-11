import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { useSettledValue } from "@/shared/decor/model/use-settled-value";
import { ArtBackdrop } from "@/shared/decor/ui/ArtBackdrop";
import { focusFirstError } from "@/shared/lib/focus-first-error";
import { ROUTES } from "@/shared/router/routes";
import { pageSeo } from "@/shared/seo/pages";
import { usePageSeo } from "@/shared/seo/use-page-seo";
import {
  Anchor,
  Button,
  Center,
  Checkbox,
  Group,
  Paper,
  PasswordInput,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { observer } from "mobx-react-lite";
import { Link, Navigate, useNavigate } from "react-router";

import { registerSchema } from "@hh/contracts";
import { Role } from "@hh/types";

export const RegisterPage = observer(() => {
  usePageSeo(pageSeo.register);
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
          {/* Роль — карточки-радиокнопки: выбор сразу виден, не нужно открывать список. */}
          <Radio.Group
            label="Кто вы"
            withAsterisk
            {...form.getInputProps("role")}
          >
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt="xs">
              <Radio.Card radius="md" value={Role.Candidate}>
                <Group wrap="nowrap" align="flex-start" gap="xs">
                  <Radio.Indicator />
                  <div>
                    <Text size="sm" fw={500}>
                      Я ищу работу
                    </Text>
                    <Text size="xs" c="dimmed">
                      Отклики и приглашения от компаний
                    </Text>
                  </div>
                </Group>
              </Radio.Card>
              <Radio.Card radius="md" value={Role.Employer}>
                <Group wrap="nowrap" align="flex-start" gap="xs">
                  <Radio.Indicator />
                  <div>
                    <Text size="sm" fw={500}>
                      Я ищу сотрудников
                    </Text>
                    <Text size="xs" c="dimmed">
                      Вакансии и поиск кандидатов
                    </Text>
                  </div>
                </Group>
              </Radio.Card>
            </SimpleGrid>
          </Radio.Group>
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
