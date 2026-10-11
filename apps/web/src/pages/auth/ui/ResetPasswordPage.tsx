import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
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
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { observer } from "mobx-react-lite";
import { Link, useNavigate, useSearchParams } from "react-router";

import { resetPasswordFormSchema } from "../model/reset-password-form";

export const ResetPasswordPage = observer(() => {
  usePageSeo(pageSeo.resetPassword);
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const form = useForm({
    initialValues: { password: "", passwordRepeat: "" },
    validate: schemaResolver(resetPasswordFormSchema, { sync: true }),
  });

  const onSubmit = form.onSubmit(
    (values) => {
      void auth.resetPassword(
        { token, password: values.password },
        {
          onSuccess: () => {
            notifier.showSuccess("Пароль изменён, войдите с новым паролем");
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
      {/* Токен свой у каждого письма, как на подтверждении почты: и фон свой. */}
      <ArtBackdrop seed={token || "guest"} />
      <Paper
        component="form"
        onSubmit={onSubmit}
        noValidate
        withBorder
        p="xl"
        w={420}
      >
        <Stack>
          <Title order={2}>Новый пароль</Title>
          {token ? (
            <>
              <Text>
                После смены пароля мы выйдем из аккаунта на всех устройствах.
              </Text>
              <PasswordInput
                label="Новый пароль"
                autoComplete="new-password"
                withAsterisk
                {...form.getInputProps("password")}
              />
              <PasswordInput
                label="Повторите пароль"
                autoComplete="new-password"
                withAsterisk
                {...form.getInputProps("passwordRepeat")}
              />
              <Button type="submit">Сменить пароль</Button>
            </>
          ) : (
            <Text>Откройте ссылку из письма о сбросе пароля.</Text>
          )}
          {/* Ссылка истекла или уже использована — отсюда можно запросить новую. */}
          <Anchor component={Link} to={ROUTES.AUTH.FORGOT}>
            Запросить новую ссылку
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
});
