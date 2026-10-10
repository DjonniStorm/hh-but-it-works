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
import { forgetStoredSession } from "./session";
import { StoreKey } from "./store-key";

type CallOptions<T> = Pick<RequestOptions<T>, "onError" | "onSuccess">;

export class AuthStore {
  readonly key = StoreKey.Auth;
  user: PublicUser | null = null;
  // Access-токен только в памяти. Refresh лежит в HttpOnly-cookie, странице он не виден.
  accessToken: string | null = null;
  // Сервер выдаёт refresh-токен на один раз. Параллельные 401 ждут одно обновление.
  private renewing: Promise<boolean> | null = null;
  // Восстановление сессии после загрузки страницы: одно на загрузку, его ждут роуты.
  private restoring: Promise<boolean> | null = null;

  constructor(private readonly root: RootStore) {
    makeAutoObservable<this, "root" | "key" | "renewing" | "restoring">(
      this,
      { key: false, root: false, renewing: false, restoring: false },
      { autoBind: true },
    );
    forgetStoredSession();
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

  // После перезагрузки access-токена нет: берём новый по cookie. Тихо, как
  // renewSession: у гостя 401 значит «не вошёл», а не «сессия закончилась».
  restoreSession(): Promise<boolean> {
    if (!this.restoring) {
      this.restoring = this.renewSession();
    }
    return this.restoring;
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
    try {
      const result = await authControllerRefresh();
      this.applySession(mapSession(readData(result)));
      return true;
    } catch {
      return false;
    }
  }

  // Cookie стирает сервер, поэтому выход всегда через запрос.
  logout(options?: CallOptions<void>) {
    return request(
      this.root,
      async () => {
        const result = await authControllerLogout();
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
    client.setConfig({
      auth: () => undefined,
    });
  }
}
