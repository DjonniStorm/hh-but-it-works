import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  PayloadTooLargeException,
} from "@nestjs/common";
import type { Response } from "express";
import { MulterError } from "multer";

// Nest 11 превращает LIMIT_FILE_SIZE в PayloadTooLargeException до фильтра MulterError.
@Catch(MulterError, PayloadTooLargeException)
export class PdfUploadFilter implements ExceptionFilter {
  catch(
    error: MulterError | PayloadTooLargeException,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();
    const tooBig =
      error instanceof PayloadTooLargeException ||
      error.code === "LIMIT_FILE_SIZE";
    response.status(400).json({
      statusCode: 400,
      message: tooBig ? "PDF больше 5 МБ" : "Нужен PDF",
    });
  }
}
