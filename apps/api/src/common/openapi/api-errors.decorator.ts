import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";

import { apiErrorSchema } from "@hh/contracts";

export class ApiErrorDto extends createZodDto(apiErrorSchema) {}

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 503;

// Тексты для 400, которые повторяются у многих ручек.
export const invalidBody =
  "Тело запроса не прошло валидацию, замечания в поле errors";
export const invalidId = "Параметр id в пути не является UUID";

// Код ошибки → когда ручка его отдаёт. Схема ответа у всех одна: ApiErrorDto.
// Вешается на метод или на весь контроллер.
export function ApiErrors(errors: Partial<Record<ErrorStatus, string>>) {
  return applyDecorators(
    ...Object.entries(errors).map(([status, description]) => {
      return ApiResponse({
        status: Number(status),
        description,
        type: ApiErrorDto,
      });
    }),
  );
}
