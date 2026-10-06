import { type RequestOptions, readData, request } from "@/app/store/request";
import type { RootStore } from "@/app/store/root-store";
import {
  assessmentsControllerAnswer,
  assessmentsControllerCurrent,
  assessmentsControllerEvents,
  assessmentsControllerFinish,
  assessmentsControllerHistory,
  assessmentsControllerStart,
} from "@/shared/api/generated/sdk.gen";
import type {
  AnswerAssessmentDto,
  AssessmentEventsDto,
} from "@/shared/api/generated/types.gen";

import type { Grade } from "@hh/types";

import type { ActiveAttempt, AttemptHistory, AttemptResult } from "./attempt";

type CallOptions<T> = Pick<RequestOptions<T>, "onError" | "onSuccess">;

export function startAttempt(
  root: RootStore,
  grade: Grade,
  options?: CallOptions<ActiveAttempt>,
) {
  return request(
    root,
    async () => {
      const result = await assessmentsControllerStart({ body: { grade } });
      return readData(result);
    },
    { loader: true, ...options },
  );
}

// Запрос запускает таймер текущего вопроса, если его ещё не отдавали.
export function loadCurrent(
  root: RootStore,
  options?: CallOptions<ActiveAttempt | null>,
) {
  return request(
    root,
    async () => {
      const result = await assessmentsControllerCurrent();
      return readData(result).attempt;
    },
    { loader: false, ...options },
  );
}

export function answerItem(
  root: RootStore,
  body: AnswerAssessmentDto,
  options?: CallOptions<ActiveAttempt>,
) {
  return request(
    root,
    async () => {
      const result = await assessmentsControllerAnswer({ body });
      return readData(result);
    },
    { loader: false, ...options },
  );
}

export function sendEvents(root: RootStore, body: AssessmentEventsDto) {
  return request(
    root,
    async () => {
      const result = await assessmentsControllerEvents({ body });
      return readData(result);
    },
    { loader: false },
  );
}

export function finishAttempt(
  root: RootStore,
  attemptId: string,
  options?: CallOptions<AttemptResult>,
) {
  return request(
    root,
    async () => {
      const result = await assessmentsControllerFinish({
        body: { attemptId },
      });
      return readData(result);
    },
    { loader: true, ...options },
  );
}

export function loadHistory(
  root: RootStore,
  options?: CallOptions<AttemptHistory>,
) {
  return request(
    root,
    async () => {
      const result = await assessmentsControllerHistory();
      return readData(result);
    },
    { loader: false, ...options },
  );
}
