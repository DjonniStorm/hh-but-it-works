import type { ErrorStore } from "./error-store";
import type { LoadingStore } from "./loading-store";

export type RetryOptions = {
  attempts: number;
  delayMs: number;
};

// Повтор для экранных загрузок: три попытки, между ними пауза, чтобы сеть успела вернуться.
export const loadRetry: RetryOptions = { attempts: 3, delayMs: 800 };

export type RequestOptions<T> = {
  loader?: boolean;
  onError?: (error: unknown) => void;
  onSuccess?: (result: T) => void;
  // Только для загрузок: повтор при обрыве сети и 5xx. Запись (POST/PUT) не повторяем — выполнится дважды.
  retry?: RetryOptions;
};

type RequestHost = {
  loading: LoadingStore;
  errors: ErrorStore;
  auth: {
    renewSession: () => Promise<boolean>;
    dropSession: () => void;
  };
};

type ClientResult<T> = {
  data?: T;
  error?: unknown;
  response?: Response;
  request?: Request;
};

export class RequestFailed extends Error {
  readonly status: number | null;
  readonly url: string;
  // Сеть оборвалась или сервер упал: такой запрос имеет смысл повторить.
  readonly transient: boolean;

  constructor(
    error: unknown,
    status: number | null,
    url: string,
    transient: boolean,
  ) {
    super(messageOf(error));
    this.name = "RequestFailed";
    this.status = status;
    this.url = url;
    this.transient = transient;
  }
}

export function readData<T>(result: ClientResult<T>): T {
  if (result.error !== undefined || result.data === undefined) {
    throw failed(result);
  }
  return result.data;
}

export async function request<T>(
  root: RequestHost,
  run: () => Promise<T>,
  options?: RequestOptions<T>,
): Promise<T> {
  const id = options?.loader ? root.loading.start() : null;

  try {
    const result = await runWithRenew(root, () => {
      return runWithRetry(run, options?.retry);
    });
    options?.onSuccess?.(result);
    return result;
  } catch (error) {
    const reported = expireIfRejected(root, error);
    root.errors.report(reported, options?.onError);
    throw reported;
  } finally {
    if (id) {
      root.loading.stop(id);
    }
  }
}

// Access-токен живёт 15 минут. На 401 один раз обновляем сессию и повторяем запрос.
// Повтор безопасен и для записи: на 401 guard отклонил запрос до обработчика.
async function runWithRenew<T>(
  root: RequestHost,
  attempt: () => Promise<T>,
): Promise<T> {
  try {
    return await attempt();
  } catch (error) {
    if (!isExpiredAccess(error)) {
      throw error;
    }
    const renewed = await root.auth.renewSession();
    if (!renewed) {
      throw error;
    }
    return attempt();
  }
}

function isExpiredAccess(error: unknown): boolean {
  return (
    error instanceof RequestFailed &&
    error.status === 401 &&
    !isCredentialRequest(error.url) &&
    !isSessionRequest(error.url)
  );
}

// Тост и onError — только после последней попытки, лоадер висит все попытки.
async function runWithRetry<T>(
  run: () => Promise<T>,
  retry: RetryOptions | undefined,
): Promise<T> {
  const attempts = Math.max(1, retry?.attempts ?? 1);
  for (let attempt = 1; ; attempt += 1) {
    try {
      const result = await run();
      if (isClientFailure(result)) {
        throw failed(result);
      }
      return result;
    } catch (error) {
      const canRetry =
        attempt < attempts && error instanceof RequestFailed && error.transient;
      if (!canRetry) {
        throw error;
      }
      await wait(retry?.delayMs ?? 0);
    }
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function expireIfRejected(root: RequestHost, error: unknown): Error {
  if (!(error instanceof RequestFailed)) {
    return error instanceof Error ? error : new Error("Запрос не выполнен");
  }
  // 401 на входе — неверный пароль. На остальных ручках токен уже недействителен.
  if (error.status === 401 && !isCredentialRequest(error.url)) {
    root.auth.dropSession();
    return new Error("Сессия закончилась");
  }
  return error;
}

function failed(result: ClientResult<unknown>): RequestFailed {
  const status =
    result.response instanceof Response
      ? result.response.status
      : statusCodeOf(result.error);
  const url = result.response?.url ?? result.request?.url ?? "";
  // Ответа нет и fetch бросил TypeError — сеть. 5xx — сервер. Мок отвечает без response, но не TypeError.
  const network =
    result.response === undefined && result.error instanceof TypeError;
  const transient = network || (status !== null && status >= 500);
  // У fetch текст ошибки браузерный и английский («Failed to fetch»): в тост — понятный.
  const error = network ? { message: "Нет связи с сервером" } : result.error;
  return new RequestFailed(error, status, url, transient);
}

function isClientFailure(value: unknown): value is ClientResult<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    value.error !== undefined
  );
}

function statusCodeOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return null;
  }
  const statusCode = error.statusCode;
  if (typeof statusCode !== "number") {
    return null;
  }
  return statusCode;
}

function isCredentialRequest(url: string): boolean {
  return hasPath(url, ["/auth/login", "/auth/register", "/auth/confirm"]);
}

// Эти ручки сами работают с refresh-токеном: обновлять сессию ради них бессмысленно.
function isSessionRequest(url: string): boolean {
  return hasPath(url, ["/auth/refresh", "/auth/logout"]);
}

function hasPath(url: string, paths: string[]): boolean {
  try {
    return paths.includes(new URL(url).pathname);
  } catch {
    return false;
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message) {
      return message;
    }
    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0];
    }
  }

  return "Запрос не выполнен";
}
