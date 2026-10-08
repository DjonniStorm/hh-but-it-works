import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";
import { MulterError } from "multer";

@Catch(MulterError)
export class PdfUploadFilter implements ExceptionFilter {
  catch(error: MulterError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const message =
      error.code === "LIMIT_FILE_SIZE" ? "PDF больше 5 МБ" : "Нужен PDF";
    response.status(400).json({ statusCode: 400, message });
  }
}
