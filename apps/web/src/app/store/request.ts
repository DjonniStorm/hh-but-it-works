import type { ErrorStore } from "./error-store";
import type { LoadingStore } from "./loading-store";

export type RequestOptions<T> = {
  loader?: boolean;
  onError?: (error: unknown) => void;
  onSuccess?: (result: T) => void;
};

type RequestHost = {
  loading: LoadingStore;
  errors: ErrorStore;
  auth: {
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

  constructor(error: unknown, status: number | null, url: string) {
    super(messageOf(error));
    this.name = "RequestFailed";
    this.status = status;
    this.url = url;
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
    const result = await run();
    if (isClientFailure(result)) {
      throw failed(result);
    }
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
  return new RequestFailed(result.error, status, url);
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
  try {
    const path = new URL(url).pathname;
    return (
      path === "/auth/login" ||
      path === "/auth/register" ||
      path === "/auth/confirm"
    );
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
