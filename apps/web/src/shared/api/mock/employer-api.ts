// Мок того, что ещё не переехало в Nest: подборка, «не подходит» и приглашения.
// Профиль компании и потребности уже в API (employersController* в sdk.gen).
// Отвечает в форме сгенерированного клиента: { data } или { error }.
import { randomId } from "@/shared/lib/random-id";
import type { ZodType } from "zod";

import {
  type HiringNeed,
  type HiringNeedRecord,
  type Invitation,
  type InvitationInput,
  type Match,
  type Shortlist,
  invitationInputSchema,
} from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

import { candidateContacts, candidates } from "./fixtures";
import { modelVersion, rankCandidates } from "./rank";

type MockResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: { message: string } };

type StoredInvitation = Omit<Invitation, "candidateContact">;

type MockState = {
  dismissed: Record<string, string[]>;
  invitations: StoredInvitation[];
};

// Что нужно приглашению от остального кабинета. В API это возьмёт сервер сам.
type InvitationContext = {
  companyName: string | null;
  needTitle: string | null;
};

const storageKey = "hh.mock.employer.v2";
const latencyMs = 250;

// У каждого аккаунта свои данные. Настоящий бэк узнаёт пользователя по токену,
// мок узнаёт его от стора через bindMockUser.
let userId = "anonymous";
const states = new Map<string, MockState>();

export function bindMockUser(id: string): void {
  userId = id;
}

type ParseResult<T> = { data: T; error?: undefined } | { error: string };

// Как ZodValidationPipe в Nest: тело проходит через схему, поэтому trim и проверки применяются.
function parse<T>(schema: ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Некорректные данные" };
  }
  return { data: result.data };
}

export async function getShortlist(
  need: HiringNeedRecord,
): Promise<MockResult<Shortlist>> {
  await delay();
  return ok({ needId: need.id, modelVersion, items: rank(need, read()) });
}

export async function setDismissed(
  need: HiringNeedRecord,
  candidateId: string,
  dismissed: boolean,
): Promise<MockResult<Shortlist>> {
  await delay();
  const current = read();
  const ids = new Set(current.dismissed[need.id] ?? []);
  if (dismissed) {
    ids.add(candidateId);
  } else {
    ids.delete(candidateId);
  }
  current.dismissed[need.id] = [...ids];
  write(current);
  return ok({ needId: need.id, modelVersion, items: rank(need, current) });
}

// Потребность из API + число кандидатов в подборке без отклонённых.
// Пока подборка в моке, число считает её же правило; потом его отдаст ручка подборки.
export function withCandidateCount(need: HiringNeedRecord): HiringNeed {
  const candidateCount = rank(need, read()).filter((match) => {
    return !match.dismissed;
  }).length;
  return { ...need, candidateCount };
}

export async function listInvitations(): Promise<MockResult<Invitation[]>> {
  await delay();
  return ok(read().invitations.map(present));
}

export async function createInvitation(
  input: InvitationInput,
  context: InvitationContext,
): Promise<MockResult<Invitation>> {
  await delay();
  const parsed = parse(invitationInputSchema, input);
  if (parsed.error !== undefined) {
    return fail(parsed.error);
  }
  const body = parsed.data;
  if (!context.companyName) {
    return fail("Сначала заполните профиль компании");
  }
  const candidate = candidates.find((item) => {
    return item.id === body.candidateId;
  });
  if (!candidate) {
    return fail("Кандидат не найден");
  }
  const current = read();
  // Одно активное предложение кандидату от компании, в какой бы потребности оно ни было.
  // После отказа можно пригласить снова. Это же правило в InvitationStore.hasActive.
  const duplicate = current.invitations.some((item) => {
    return (
      item.candidateId === body.candidateId &&
      item.status !== InvitationStatus.Declined
    );
  });
  if (duplicate) {
    return fail("Этому кандидату уже отправлено приглашение");
  }
  const now = new Date().toISOString();
  const invitation: StoredInvitation = {
    ...body,
    id: randomId(),
    status: InvitationStatus.Sent,
    createdAt: now,
    updatedAt: now,
    companyName: context.companyName,
    candidateAlias: candidate.alias,
    needTitle: context.needTitle,
  };
  current.invitations.unshift(invitation);
  write(current);
  return ok(present(invitation));
}

function rank(need: HiringNeedRecord, current: MockState): Match[] {
  return rankCandidates(
    need,
    candidates,
    new Set(current.dismissed[need.id] ?? []),
  );
}

// Правило видимости из ТЗ 2.2.2: контакт кандидата открывается только после принятия.
function present(invitation: StoredInvitation): Invitation {
  const accepted = invitation.status === InvitationStatus.Accepted;
  return {
    ...invitation,
    candidateContact: accepted
      ? (candidateContacts[invitation.candidateId] ?? null)
      : null,
  };
}

function read(): MockState {
  const cached = states.get(userId);
  if (cached) {
    return cached;
  }
  let loaded: MockState;
  try {
    const raw = localStorage.getItem(`${storageKey}:${userId}`);
    loaded = raw ? (JSON.parse(raw) as MockState) : seedState();
  } catch {
    loaded = seedState();
  }
  states.set(userId, loaded);
  return loaded;
}

function write(next: MockState): void {
  states.set(userId, next);
  try {
    localStorage.setItem(`${storageKey}:${userId}`, JSON.stringify(next));
  } catch {
    // Без хранилища мок продолжает работать в памяти до перезагрузки.
  }
}

// Демо-приглашения во всех статусах, чтобы экран статусов не был пустым с первого входа.
function seedState(): MockState {
  const day = 24 * 60 * 60 * 1000;
  const at = (daysAgo: number) => {
    return new Date(Date.now() - daysAgo * day).toISOString();
  };
  const demo = (
    candidateId: string,
    status: InvitationStatus,
    daysAgo: number,
    salaryFrom: number,
    salaryTo: number,
  ): StoredInvitation => {
    return {
      id: `demo-${candidateId}`,
      candidateId,
      needId: null,
      message:
        "Ищем инженера в продуктовую команду. Расскажем о задачах на коротком созвоне.",
      contact: "hr@example.com",
      salaryFrom,
      salaryTo,
      status,
      createdAt: at(daysAgo),
      updatedAt: at(Math.max(0, daysAgo - 1)),
      companyName: "Демо-компания",
      candidateAlias: `Кандидат #${candidateId}`,
      needTitle: null,
    };
  };
  return {
    dismissed: {},
    invitations: [
      demo("B102", InvitationStatus.Accepted, 6, 350000, 420000),
      demo("F201", InvitationStatus.Viewed, 3, 220000, 260000),
      demo("D301", InvitationStatus.Declined, 5, 180000, 210000),
      demo("S401", InvitationStatus.Sent, 1, 250000, 300000),
    ],
  };
}

function ok<T>(data: T): MockResult<T> {
  return { data };
}

function fail<T>(message: string): MockResult<T> {
  return { error: { message } };
}

function delay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, latencyMs);
  });
}
