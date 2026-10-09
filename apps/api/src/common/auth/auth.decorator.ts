import { UseGuards, applyDecorators } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

import { Role } from "@hh/types";

import { ApiErrors } from "../openapi/api-errors.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

const noToken = "Access-токен отсутствует, истёк или пользователь удалён";

// Guard'ы и их ошибки в Swagger одним декоратором: 401 и 403 в описании
// появляются ровно там, где их может вернуть guard.
// Без ролей — любой вошедший пользователь.
export function Auth(...roles: Role[]) {
  if (!roles.length) {
    return applyDecorators(
      ApiBearerAuth(),
      UseGuards(JwtAuthGuard),
      ApiErrors({ 401: noToken }),
    );
  }
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...roles),
    ApiErrors({
      401: noToken,
      403: `Доступ только для роли ${roles.join(", ")}`,
    }),
  );
}
