import { z } from "zod";

import { passwordSchema } from "@hh/contracts";

// Повтор пароля нужен только форме: в API уходит один пароль и токен из ссылки.
export const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    passwordRepeat: z.string(),
  })
  .refine(
    (values) => {
      return values.password === values.passwordRepeat;
    },
    { path: ["passwordRepeat"], message: "Пароли не совпадают" },
  );
