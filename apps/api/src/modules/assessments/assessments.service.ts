import { randomInt, randomUUID } from "node:crypto";

import { BadRequestException, Injectable } from "@nestjs/common";

import {
  EmptyAttemptError,
  buildAttempt,
  gradeAttempt,
} from "@hh/assessment-engine";
import type {
  AssessmentAttempt,
  AssessmentResult,
  SubmitAssessmentInput,
} from "@hh/contracts";
import { Grade } from "@hh/types";

import { ProfilesService } from "../profiles/profiles.service";
import { AttemptStore } from "./attempt.store";

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly attempts: AttemptStore,
  ) {}

  async start(userId: string, grade: Grade): Promise<AssessmentAttempt> {
    const skills = await this.profiles.assessmentSkills(userId);
    let built: ReturnType<typeof buildAttempt>;
    try {
      built = buildAttempt({
        grade,
        skills,
        seed: randomInt(1, 2 ** 31),
      });
    } catch (error) {
      if (error instanceof EmptyAttemptError) {
        throw new BadRequestException("Для этих навыков теста нет");
      }
      throw error;
    }

    const attemptId = randomUUID();
    await this.attempts.save(userId, {
      id: attemptId,
      grade: built.secret.grade,
      items: built.secret.items,
    });
    return {
      attemptId,
      grade,
      items: built.items,
    };
  }

  async submit(
    userId: string,
    input: SubmitAssessmentInput,
  ): Promise<AssessmentResult> {
    // Ключ снимаем сразу: повторно сдать попытку нельзя, даже если грейд менять рано.
    const stored = await this.attempts.take(userId);
    if (!stored || stored.id !== input.attemptId) {
      throw new BadRequestException("Попытка не найдена");
    }
    const result = gradeAttempt(
      { grade: stored.grade, items: stored.items },
      input.answers,
    );
    await this.profiles.applyAssessment(userId, result);
    return result;
  }
}
