import { useState } from "react";

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
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { observer } from "mobx-react-lite";
import { Link } from "react-router";

import { forgotPasswordSchema } from "@hh/contracts";

export const ForgotPasswordPage = observer(() => {
  usePageSeo(pageSeo.forgotPassword);
  const auth = useStore(StoreKey.Auth);
  const form = useForm({
    initialValues: { email: "" },
    validate: schemaResolver(forgotPasswordSchema, { sync: true }),
  });
  // Почта, на которую ушёл запрос. После ответа вместо формы — текст про письмо.
  const [sentTo, setSentTo] = useState<string | null>(null);
  // Фон по хешу почты, как на входе.
  // Хук возвращает значение, без деструктуризации — иначе это разбор строки.
  const settledEmail = useSettledValue(form.values.email);
  const backdropSeed = settledEmail.includes("@") ? settledEmail : "guest";

  const onSubmit = form.onSubmit(
    (values) => {
      void auth.forgotPassword(values, {
        onSuccess: () => {
          setSentTo(values.email);
        },
      });
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
          <Title order={2}>Восстановление пароля</Title>
          {/* Ответ API одинаковый для любой почты, поэтому и текст не говорит, есть ли аккаунт. */}
          {sentTo ? (
            <Text>
              Если аккаунт с почтой {sentTo} есть, мы отправили на неё ссылку
              для смены пароля. Ссылка действует час.
            </Text>
          ) : (
            <>
              <Text>
                Укажите почту, с которой регистрировались. Пришлём ссылку, по
                которой можно задать новый пароль.
              </Text>
              <TextInput
                label="Почта"
                type="email"
                autoComplete="email"
                withAsterisk
                {...form.getInputProps("email")}
              />
              <Button type="submit">Отправить ссылку</Button>
            </>
          )}
          <Anchor component={Link} to={ROUTES.AUTH.LOGIN}>
            Вернуться ко входу
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
});
