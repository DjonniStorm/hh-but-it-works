import { BadRequestException } from "@nestjs/common";
import { extractText, getDocumentProxy } from "unpdf";

export const maxPdfBytes = 5 * 1024 * 1024;
const maxPdfPages = 10;

export function assertPdf(file: Express.Multer.File | undefined): Buffer {
  if (!file || file.size === 0) {
    throw new BadRequestException("Нужен PDF");
  }
  if (file.size > maxPdfBytes) {
    throw new BadRequestException("PDF больше 5 МБ");
  }
  const header = file.buffer.subarray(0, 5).toString("latin1");
  if (header !== "%PDF-") {
    throw new BadRequestException("Нужен PDF");
  }
  return file.buffer;
}

export async function textOfPdf(buffer: Buffer): Promise<string> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    try {
      if (pdf.numPages > maxPdfPages) {
        throw new BadRequestException("В PDF больше 10 страниц");
      }
      const extracted = await extractText(pdf, { mergePages: true });
      return extracted.text;
    } finally {
      await closePdf(pdf);
    }
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException("PDF не читается");
  }
}

async function closePdf(
  pdf: Awaited<ReturnType<typeof getDocumentProxy>>,
): Promise<void> {
  try {
    await pdf.cleanup();
    await pdf.loadingTask.destroy();
  } catch {
    // Воркер PDF.js уже мог завершиться вместе с разбором.
  }
}
