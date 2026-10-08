import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
} from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";

import { Role } from "@hh/types";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { RolesGuard } from "../../common/auth/roles.guard";
import { User } from "../users/user.entity";
import { CandidateProfileDto, ResumeDraftDto, SaveProfileDto } from "./dto";
import { PdfUploadFilter } from "./pdf-upload.filter";
import { ProfilePdfService } from "./profile-pdf";
import { ProfilesService } from "./profiles.service";
import { ResumeDraftService } from "./resume-draft.service";
import { maxPdfBytes } from "./resume-text";

@Controller("profile")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
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
  async exportPdf(@CurrentUser() user: User): Promise<StreamableFile> {
    const bytes = await this.pdf.render(user.id);
    return new StreamableFile(bytes, {
      type: "application/pdf",
      disposition: 'attachment; filename="profile.pdf"',
    });
  }

  @Put()
  @ZodResponse({ status: 200, type: CandidateProfileDto })
  save(@CurrentUser() user: User, @Body() body: SaveProfileDto) {
    return this.profiles.save(user.id, body);
  }
}
