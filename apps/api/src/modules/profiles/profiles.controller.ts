import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOkResponse } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";

import { Role } from "@hh/types";

import { Auth } from "../../common/auth/auth.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import {
  ApiErrors,
  invalidBody,
} from "../../common/openapi/api-errors.decorator";
import { User } from "../users/user.entity";
import { CandidateProfileDto, ResumeDraftDto, SaveProfileDto } from "./dto";
import { PdfUploadFilter } from "./pdf-upload.filter";
import { ProfilePdfService } from "./profile-pdf";
import { ProfilesService } from "./profiles.service";
import { ResumeDraftService } from "./resume-draft.service";
import { maxPdfBytes } from "./resume-text";

@Controller("profile")
@Auth(Role.Candidate)
export class ProfilesController {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly resumes: ResumeDraftService,
    private readonly pdf: ProfilePdfService,
  ) {}

  @Get()
  @ZodResponse({ status: 200, type: CandidateProfileDto })
  get(@CurrentUser() user: User) {
    return this.profiles.get(user.id);
  }

  @Post("resume-draft")
  @UseFilters(PdfUploadFilter)
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: maxPdfBytes } }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @ZodResponse({ status: 200, type: ResumeDraftDto })
  @ApiErrors({
    400: "Файл не передан, не является PDF, больше 5 МБ или 10 страниц либо не читается",
    422: "В PDF нет текста для заполнения анкеты",
  })
  resumeDraft(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ResumeDraftDto> {
    return this.resumes.draftFrom(file);
  }

  @Get("export.pdf")
  @ApiOkResponse({
    content: {
      "application/pdf": { schema: { type: "string", format: "binary" } },
    },
  })
  @ApiErrors({ 404: "Анкета ещё не сохранена" })
  async exportPdf(@CurrentUser() user: User): Promise<StreamableFile> {
    const bytes = await this.pdf.render(user.id);
    return new StreamableFile(bytes, {
      type: "application/pdf",
      disposition: 'attachment; filename="profile.pdf"',
    });
  }

  @Put()
  @ZodResponse({ status: 200, type: CandidateProfileDto })
  @ApiErrors({
    400: `${invalidBody}. Также: пустое название навыка, неизвестный skillId или превышен лимит собственных навыков`,
  })
  save(@CurrentUser() user: User, @Body() body: SaveProfileDto) {
    return this.profiles.save(user.id, body);
  }
}
