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
};

export async function request<T>(
  root: RequestHost,
  run: () => Promise<T>,
  options?: RequestOptions<T>,
): Promise<T> {
  const id = options?.loader ? root.loading.start() : null;

  try {
    const result = await run();
    if (isClientFailure(result)) {
      throw toRequestError(result.error);
    }
    options?.onSuccess?.(result);
    return result;
  } catch (error) {
    root.errors.report(error, options?.onError);
    throw error;
  } finally {
    if (id) {
      root.loading.stop(id);
    }
  }
}

function isClientFailure(value: unknown): value is { error: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    value.error !== undefined
  );
}

function toRequestError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message) {
      return new Error(message);
    }
    if (Array.isArray(message) && typeof message[0] === "string") {
      return new Error(message[0]);
    }
  }

  return new Error("Запрос не выполнен");
}
