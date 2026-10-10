import { client } from "@/shared/api/generated/client.gen";
import {
  authControllerConfirm,
  authControllerForgotPassword,
  authControllerLogin,
  authControllerLogout,
  authControllerMe,
  authControllerRefresh,
  authControllerRegister,
  authControllerResendConfirmation,
  authControllerResetPassword,
} from "@/shared/api/generated/sdk.gen";
import { mapPublicUser, mapSession } from "@/shared/api/map-session";
import { makeAutoObservable } from "mobx";

import type {
  ConfirmEmailInput,
  ForgotPasswordInput,
  LoginInput,
  PublicUser,
  RegisterInput,
  ResendConfirmationInput,
  ResetPasswordInput,
  Session,
} from "@hh/contracts";

import { type RequestOptions, readData, request } from "./request";
import type { RootStore } from "./root-store";
import { clearStoredSession, readSession, writeSession } from "./session";
import { StoreKey } from "./store-key";

type CallOptions<T> = Pick<RequestOptions<T>, "onError" | "onSuccess">;

export class AuthStore {
  readonly key = StoreKey.Auth;
  user: PublicUser | null = null;
  accessToken: string | null = null;
  refreshToken: string | null = null;
  // Сервер выдаёт refresh-токен на один раз. Параллельные 401 ждут одно обновление.
  private renewing: Promise<boolean> | null = null;

  constructor(private readonly root: RootStore) {
    makeAutoObservable<this, "root" | "key" | "renewing">(
      this,
      { key: false, root: false, renewing: false },
      { autoBind: true },
    );
    const saved = readSession();
    if (saved) {
      this.applySession(saved);
    }
  }

  register(input: RegisterInput, options?: CallOptions<PublicUser>) {
    return request(
      this.root,
      async () => {
        const result = await authControllerRegister({ body: input });
        return mapPublicUser(readData(result));
      },
      { loader: true, ...options },
    );
  }

  confirm(input: ConfirmEmailInput, options?: CallOptions<PublicUser>) {
    return request(
      this.root,
      async () => {
        const result = await authControllerConfirm({ body: input });
        return mapPublicUser(readData(result));
      },
      { loader: true, ...options },
    );
  }

  resendConfirmation(
    input: ResendConfirmationInput,
    options?: CallOptions<void>,
  ) {
    return request(
      this.root,
      async () => {
        const result = await authControllerResendConfirmation({ body: input });
        readData(result);
        return undefined;
      },
      { loader: true, ...options },
    );
  }

  forgotPassword(input: ForgotPasswordInput, options?: CallOptions<void>) {
    return request(
      this.root,
      async () => {
        const result = await authControllerForgotPassword({ body: input });
        readData(result);
        return undefined;
      },
      { loader: true, ...options },
    );
  }

  // Сервер отзывает все refresh-токены пользователя. Если сброс шёл из
  // открытой сессии, она тоже больше не обновится: выходим локально.
  resetPassword(input: ResetPasswordInput, options?: CallOptions<void>) {
    return request(
      this.root,
      async () => {
        const result = await authControllerResetPassword({ body: input });
        readData(result);
        this.clearSession();
        return undefined;
      },
      { loader: true, ...options },
    );
  }

  login(input: LoginInput, options?: CallOptions<Session>) {
    return request(
      this.root,
      async () => {
        const result = await authControllerLogin({ body: input });
        const session = mapSession(readData(result));
        this.applySession(session);
        return session;
      },
      { loader: true, ...options },
    );
  }

  refresh(options?: CallOptions<Session>) {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      const error = new Error("Сессия недействительна");
      this.root.errors.report(error, options?.onError);
      return Promise.reject(error);
    }

    return request(
      this.root,
      async () => {
        const result = await authControllerRefresh({ body: { refreshToken } });
        const session = mapSession(readData(result));
        this.applySession(session);
        return session;
      },
      { loader: false, ...options },
    );
  }

  // Тихое обновление для request: без тоста и лоадера. false — сессию не вернуть.
  renewSession(): Promise<boolean> {
    if (!this.renewing) {
      this.renewing = this.exchangeRefresh().finally(() => {
        this.renewing = null;
      });
    }
    return this.renewing;
  }

  private async exchangeRefresh(): Promise<boolean> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      return false;
    }
    try {
      const result = await authControllerRefresh({ body: { refreshToken } });
      this.applySession(mapSession(readData(result)));
      return true;
    } catch {
      return false;
    }
  }

  logout(options?: CallOptions<void>) {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      this.clearSession();
      options?.onSuccess?.();
      return Promise.resolve();
    }

    return request(
      this.root,
      async () => {
        const result = await authControllerLogout({ body: { refreshToken } });
        readData(result);
        this.clearSession();
        return undefined;
      },
      { loader: true, ...options },
    );
  }

  me(options?: CallOptions<PublicUser>) {
    return request(
      this.root,
      async () => {
        const result = await authControllerMe();
        const user = mapPublicUser(readData(result));
        this.user = user;
        return user;
      },
      { loader: false, ...options },
    );
  }

  private applySession(session: Session): void {
    this.user = session.user;
    this.accessToken = session.accessToken;
    this.refreshToken = session.refreshToken;
    writeSession(session);
    client.setConfig({
      auth: () => this.accessToken ?? undefined,
    });
  }

  // Сервер отверг токен. Локальный выход, без запроса /auth/logout.
  dropSession(): void {
    this.clearSession();
  }

  private clearSession(): void {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    clearStoredSession();
    client.setConfig({
      auth: () => undefined,
    });
  }
}
