import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
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
import {
  CandidateProfileDto,
  FspHistoryDto,
  FspLinkDto,
  FspLinkPreviewDto,
  FspLinkResultDto,
  FspLoginDto,
  ResumeDraftDto,
  ResumePdfQueryDto,
  SaveProfileDto,
} from "./dto";
import { PdfUploadFilter } from "./pdf-upload.filter";
import { ProfilePdfService, pdfFile } from "./profile-pdf";
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

  // Импорт ФСП: что реестр знает о человеке с почтой из токена.
  // Статус found/not-found/unavailable возвращаем как есть, без интерпретации.
  @Get("fsp-link/preview")
  @ZodResponse({ status: 200, type: FspLinkPreviewDto })
  fspLinkPreview(@CurrentUser() user: User) {
    return this.profiles.fspLinkPreview(user.id);
  }

  // Своя история ФСП по привязанному fspId.
  @Get("fsp-history")
  @ZodResponse({ status: 200, type: FspHistoryDto })
  fspHistory(@CurrentUser() user: User) {
    return this.profiles.fspHistory(user.id);
  }

  // Привязка ФСП меняет только ID и показ — без проверки остальной анкеты.
  @Put("fsp")
  @ZodResponse({ status: 200, type: FspLinkResultDto })
  fspLink(@CurrentUser() user: User, @Body() body: FspLinkDto) {
    return this.profiles.fspLink(user.id, body);
  }

  // OIDC-вход через реестр ФСП: code обменивается на сервере, sub становится fspId.
  @Post("fsp-login")
  @ZodResponse({ status: 200, type: FspLinkResultDto })
  @ApiErrors({
    400: "Код входа не подошёл, уже использован или просрочен",
    503: "Реестр ФСП сейчас недоступен",
  })
  fspLogin(@CurrentUser() user: User, @Body() body: FspLoginDto) {
    return this.profiles.fspLogin(user.id, body.code);
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
  @ApiErrors({ 400: "Неизвестный шаблон", 404: "Анкета ещё не сохранена" })
  async exportPdf(
    @CurrentUser() user: User,
    @Query() query: ResumePdfQueryDto,
  ): Promise<StreamableFile> {
    const bytes = await this.pdf.renderOwn(user.id, query.template);
    return pdfFile(bytes);
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
