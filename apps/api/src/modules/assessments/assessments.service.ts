import { randomInt, randomUUID } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  EmptyAttemptError,
  buildAttempt,
  countFlags,
  fastAnswerMs,
  gradeAttempt,
  integrityScore,
  isAnnulled,
} from "@hh/assessment-engine";
import type {
  ActiveAttempt,
  AnswerAssessmentInput,
  AssessmentEventsInput,
  AssessmentHistory,
  AssessmentResult,
  CurrentAttempt,
} from "@hh/contracts";
import { AttemptStatus, Grade, IntegrityFlag } from "@hh/types";

import { ProfilesService } from "../profiles/profiles.service";
import { AttemptRecord } from "./attempt-record.entity";
import { AttemptStore, type StoredAttempt } from "./attempt.store";

// Запас на сеть: ответ, отправленный в последнюю секунду, ещё засчитывается.
const answerGraceMs = 5000;
// Короткое переключение фокуса (клик по системной панели) не считаем уходом.
const minBlurMs = 1000;
const attemptGone = "Попытка не найдена или уже завершена";

export type ClientMeta = {
  ip: string;
  agent: string;
};

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly attempts: AttemptStore,
    @InjectRepository(AttemptRecord)
    private readonly records: Repository<AttemptRecord>,
  ) {}

  async start(
    userId: string,
    grade: Grade,
    meta: ClientMeta,
  ): Promise<ActiveAttempt> {
    // Новая попытка поверх старой дала бы перебирать вопросы до удобных.
    if (await this.attempts.get(userId)) {
      throw new ConflictException("Сначала завершите текущую попытку");
    }
    await this.profiles.assertGradeChangeAllowed(userId, grade);
    const { specialization, skills } =
      await this.profiles.assessmentSkills(userId);

    let built: ReturnType<typeof buildAttempt>;
    try {
      built = buildAttempt({ grade, skills, seed: randomInt(1, 2 ** 31) });
    } catch (error) {
      if (error instanceof EmptyAttemptError) {
        throw new BadRequestException("Для этих навыков теста нет");
      }
      throw error;
    }

    const titles = new Map(
      skills.map((skill) => {
        return [skill.skillId, skill.title] as const;
      }),
    );
    const attempt: StoredAttempt = {
      id: randomUUID(),
      grade,
      specialization,
      sections: built.sections.map((section) => {
        return {
          skillId: section.skillId,
          title: titles.get(section.skillId) ?? section.slug,
          count: section.count,
        };
      }),
      items: built.items,
      secret: built.secret.items,
      answers: [],
      cursor: 0,
      servedAt: null,
      startedAt: Date.now(),
      ip: meta.ip,
      agent: meta.agent,
      flags: [],
    };
    await this.attempts.create(userId, attempt);
    return view(attempt, Date.now());
  }

  // Отдаёт текущий вопрос. Первый запрос по вопросу запускает его таймер.
  async current(userId: string): Promise<CurrentAttempt> {
    const attempt = await this.attempts.get(userId);
    if (!attempt) {
      return { attempt: null };
    }
    const now = Date.now();
    if (attempt.cursor < attempt.items.length && attempt.servedAt === null) {
      attempt.servedAt = now;
      if (!(await this.attempts.update(userId, attempt))) {
        return { attempt: null };
      }
    }
    return { attempt: view(attempt, now) };
  }

  async answer(
    userId: string,
    input: AnswerAssessmentInput,
    meta: ClientMeta,
  ): Promise<ActiveAttempt> {
    const attempt = await this.requireAttempt(userId, input.attemptId);
    const item = attempt.items[attempt.cursor];
    if (!item) {
      throw new ConflictException("Все вопросы уже отвечены");
    }
    if (item.itemId !== input.itemId) {
      throw new ConflictException("Этот вопрос уже закрыт");
    }

    const now = Date.now();
    const elapsed = now - (attempt.servedAt ?? now);
    const late = elapsed > item.seconds * 1000 + answerGraceMs;
    // Просроченный ответ сохраняем пустым: он засчитается как неверный.
    attempt.answers.push({
      itemId: item.itemId,
      choices: late ? [] : input.choices,
      value: late ? null : (input.value ?? null),
    });
    if (!late && elapsed < fastAnswerMs) {
      attempt.flags.push(IntegrityFlag.FastAnswer);
    }
    // Сравниваем с прошлым запросом, чтобы одна смена сети стоила одного флага.
    if (meta.ip !== attempt.ip) {
      attempt.flags.push(IntegrityFlag.IpChange);
      attempt.ip = meta.ip;
    }
    if (meta.agent !== attempt.agent) {
      attempt.flags.push(IntegrityFlag.AgentChange);
      attempt.agent = meta.agent;
    }

    attempt.cursor += 1;
    attempt.servedAt = attempt.cursor < attempt.items.length ? now : null;
    if (!(await this.attempts.update(userId, attempt))) {
      throw new BadRequestException(attemptGone);
    }
    return view(attempt, now);
  }

  async events(
    userId: string,
    input: AssessmentEventsInput,
  ): Promise<{ accepted: number }> {
    await this.requireAttempt(userId, input.attemptId);
    const flags = input.events.flatMap((event) => {
      if (
        event.type === IntegrityFlag.WindowBlur &&
        (event.durationMs ?? 0) < minBlurMs
      ) {
        return [];
      }
      return [event.type];
    });
    const accepted = await this.attempts.pushEvents(
      userId,
      input.attemptId,
      flags,
    );
    return { accepted };
  }

  async finish(userId: string, attemptId: string): Promise<AssessmentResult> {
    // Берём и удаляем одним шагом: второй параллельный finish получит 400, а не вторую оценку.
    const taken = await this.attempts.take(userId, attemptId);
    if (!taken) {
      throw new BadRequestException(attemptGone);
    }
    const { attempt, events: clientFlags } = taken;

    // Неотвеченные вопросы засчитываются как неверные.
    const graded = gradeAttempt(
      { grade: attempt.grade, items: attempt.secret },
      attempt.answers,
    );
    const flags = [...attempt.flags, ...clientFlags];
    const integrity = integrityScore(flags);
    const status = isAnnulled(integrity)
      ? AttemptStatus.Annulled
      : graded.passed
        ? AttemptStatus.Passed
        : AttemptStatus.Failed;
    const { gradeChanged } = await this.profiles.applyAssessment(userId, {
      grade: attempt.grade,
      specialization: attempt.specialization,
      status,
      score: graded.score,
      sections: graded.sections,
    });

    const titles = new Map(
      attempt.sections.map((section) => {
        return [section.skillId, section.title] as const;
      }),
    );
    const record = await this.records.save(
      this.records.create({
        id: attempt.id,
        userId,
        grade: attempt.grade,
        status,
        score: graded.score,
        integrity,
        sections: graded.sections.map((section) => {
          return { ...section, title: titles.get(section.skillId) ?? "Навык" };
        }),
        flags: countFlags(flags),
        gradeChanged,
        startedAt: new Date(attempt.startedAt),
        finishedAt: new Date(),
      }),
    );
    return toResult(record);
  }

  async history(userId: string): Promise<AssessmentHistory> {
    const records = await this.records.find({
      where: { userId },
      order: { finishedAt: "DESC" },
      take: 20,
    });
    return { items: records.map(toResult) };
  }

  private async requireAttempt(
    userId: string,
    attemptId: string,
  ): Promise<StoredAttempt> {
    const attempt = await this.attempts.get(userId);
    if (!attempt || attempt.id !== attemptId) {
      throw new BadRequestException(attemptGone);
    }
    return attempt;
  }
}

function view(attempt: StoredAttempt, now: number): ActiveAttempt {
  const item =
    attempt.servedAt === null ? null : (attempt.items[attempt.cursor] ?? null);
  const secondsLeft =
    item && attempt.servedAt !== null
      ? Math.max(
          0,
          Math.ceil((attempt.servedAt + item.seconds * 1000 - now) / 1000),
        )
      : null;
  return {
    attemptId: attempt.id,
    grade: attempt.grade,
    sections: attempt.sections,
    index: attempt.cursor,
    total: attempt.items.length,
    item,
    secondsLeft,
  };
}

function toResult(record: AttemptRecord): AssessmentResult {
  return {
    attemptId: record.id,
    status: record.status,
    score: record.score,
    grade: record.grade,
    integrity: record.integrity,
    flags: record.flags,
    sections: record.sections,
    gradeChanged: record.gradeChanged,
    startedAt: record.startedAt.toISOString(),
    finishedAt: record.finishedAt.toISOString(),
  };
}
