import { notifier } from "./notifier";
import { StoreKey } from "./store-key";

export class ErrorStore {
  readonly key = StoreKey.Errors;

  report(error: unknown, onError?: (error: unknown) => void): void {
    notifier.showError(errorMessage(error));
    onError?.(error);
  }
}

function errorMessage(error: unknown): string {
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
