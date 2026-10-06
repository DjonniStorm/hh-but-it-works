// Мок ручек работодателя до появления модуля в Nest. Отвечает в форме сгенерированного клиента:
// { data } или { error }. Когда ручки появятся, сторы переключаются на sdk.gen без правок UI.
import { randomId } from "@/shared/lib/random-id";
import type { ZodType } from "zod";

import {
  type CompanyProfile,
  type HiringNeed,
  type HiringNeedInput,
  type Invitation,
  type InvitationInput,
  type Match,
  type Shortlist,
  companyProfileSchema,
  hiringNeedInputSchema,
  invitationInputSchema,
} from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

import { candidateContacts, candidates } from "./fixtures";
import { modelVersion, rankCandidates } from "./rank";

type MockResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: { message: string } };

type StoredInvitation = Omit<Invitation, "candidateContact" | "companyName"> & {
  // Пусто у демо-приглашений: название берём из текущего профиля компании.
  companyName: string;
};

type MockState = {
  company: CompanyProfile | null;
  needs: Omit<HiringNeed, "candidateCount">[];
  dismissed: Record<string, string[]>;
  invitations: StoredInvitation[];
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

export async function getCompany(): Promise<MockResult<CompanyProfile | null>> {
  await delay();
  return ok(read().company);
}

export async function saveCompany(
  input: CompanyProfile,
): Promise<MockResult<CompanyProfile>> {
  await delay();
  const parsed = parse(companyProfileSchema, input);
  if (parsed.error !== undefined) {
    return fail(parsed.error);
  }
  const current = read();
  current.company = parsed.data;
  write(current);
  return ok(current.company);
}

export async function listNeeds(): Promise<MockResult<HiringNeed[]>> {
  await delay();
  const current = read();
  return ok(
    current.needs.map((need) => {
      return withCount(need, current);
    }),
  );
}

export async function createNeed(
  input: HiringNeedInput,
): Promise<MockResult<HiringNeed>> {
  await delay();
  const parsed = parse(hiringNeedInputSchema, input);
  if (parsed.error !== undefined) {
    return fail(parsed.error);
  }
  const current = read();
  const need = {
    ...parsed.data,
    id: randomId(),
    createdAt: new Date().toISOString(),
  };
  current.needs.unshift(need);
  write(current);
  return ok(withCount(need, current));
}

export async function getShortlist(
  needId: string,
): Promise<MockResult<Shortlist>> {
  await delay();
  const current = read();
  const need = current.needs.find((item) => {
    return item.id === needId;
  });
  if (!need) {
    return fail("Потребность не найдена");
  }
  return ok({ needId, modelVersion, items: rank(need, current) });
}

export async function setDismissed(
  needId: string,
  candidateId: string,
  dismissed: boolean,
): Promise<MockResult<Shortlist>> {
  await delay();
  const current = read();
  const need = current.needs.find((item) => {
    return item.id === needId;
  });
  if (!need) {
    return fail("Потребность не найдена");
  }
  const ids = new Set(current.dismissed[needId] ?? []);
  if (dismissed) {
    ids.add(candidateId);
  } else {
    ids.delete(candidateId);
  }
  current.dismissed[needId] = [...ids];
  write(current);
  return ok({ needId, modelVersion, items: rank(need, current) });
}

export async function listInvitations(): Promise<MockResult<Invitation[]>> {
  await delay();
  const current = read();
  return ok(
    current.invitations.map((invitation) => {
      return present(invitation, current);
    }),
  );
}

export async function createInvitation(
  input: InvitationInput,
): Promise<MockResult<Invitation>> {
  await delay();
  const parsed = parse(invitationInputSchema, input);
  if (parsed.error !== undefined) {
    return fail(parsed.error);
  }
  const body = parsed.data;
  const current = read();
  if (!current.company) {
    return fail("Сначала заполните профиль компании");
  }
  const candidate = candidates.find((item) => {
    return item.id === body.candidateId;
  });
  if (!candidate) {
    return fail("Кандидат не найден");
  }
  // Одно активное предложение кандидату от компании, в какой бы потребности оно ни было.
  // После отказа можно пригласить снова. Это же правило в InvitationStore.activeFor.
  const duplicate = current.invitations.some((item) => {
    return (
      item.candidateId === body.candidateId &&
      item.status !== InvitationStatus.Declined
    );
  });
  if (duplicate) {
    return fail("Этому кандидату уже отправлено приглашение");
  }
  const need = current.needs.find((item) => {
    return item.id === body.needId;
  });
  const now = new Date().toISOString();
  const invitation: StoredInvitation = {
    ...body,
    id: randomId(),
    status: InvitationStatus.Sent,
    createdAt: now,
    updatedAt: now,
    companyName: current.company.name,
    candidateAlias: candidate.alias,
    needTitle: need?.title ?? null,
  };
  current.invitations.unshift(invitation);
  write(current);
  return ok(present(invitation, current));
}

function rank(need: MockState["needs"][number], current: MockState): Match[] {
  return rankCandidates(
    need,
    candidates,
    new Set(current.dismissed[need.id] ?? []),
  );
}

function withCount(
  need: MockState["needs"][number],
  current: MockState,
): HiringNeed {
  const active = rank(need, current).filter((match) => {
    return !match.dismissed;
  });
  return { ...need, candidateCount: active.length };
}

// Правило видимости из ТЗ 2.2.2: контакт кандидата открывается только после принятия.
function present(invitation: StoredInvitation, current: MockState): Invitation {
  const accepted = invitation.status === InvitationStatus.Accepted;
  return {
    ...invitation,
    companyName:
      invitation.companyName || current.company?.name || "Ваша компания",
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
      companyName: "",
      candidateAlias: `Кандидат #${candidateId}`,
      needTitle: null,
    };
  };
  return {
    company: null,
    needs: [],
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
