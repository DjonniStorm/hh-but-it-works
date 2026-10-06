import { client } from "@/shared/api/generated/client.gen";
import {
  authControllerConfirm,
  authControllerLogin,
  authControllerLogout,
  authControllerMe,
  authControllerRefresh,
  authControllerRegister,
} from "@/shared/api/generated/sdk.gen";
import { mapPublicUser, mapSession } from "@/shared/api/map-session";
import { makeAutoObservable } from "mobx";

import type {
  ConfirmEmailInput,
  LoginInput,
  PublicUser,
  RegisterInput,
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

  constructor(private readonly root: RootStore) {
    makeAutoObservable<this, "root" | "key">(
      this,
      { key: false, root: false },
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
