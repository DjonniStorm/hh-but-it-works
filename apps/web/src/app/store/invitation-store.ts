import * as employerApi from "@/shared/api/mock/employer-api";
import { makeAutoObservable, runInAction } from "mobx";

import type { Invitation, InvitationInput } from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

import { type RequestOptions, readData, request } from "./request";
import type { RootStore } from "./root-store";
import { StoreKey } from "./store-key";

type CallOptions<T> = Pick<RequestOptions<T>, "onError" | "onSuccess">;

// Отдельно от EmployerStore: те же приглашения позже покажет кабинет кандидата.
export class InvitationStore {
  readonly key = StoreKey.Invitations;
  items: Invitation[] = [];
  loaded = false;
  loadFailed = false;
  private ownerId: string | null = null;

  constructor(private readonly root: RootStore) {
    makeAutoObservable<this, "root" | "key">(
      this,
      { key: false, root: false },
      { autoBind: true },
    );
  }

  // Последнее приглашение кандидату. Список отсортирован от новых к старым.
  latestFor(candidateId: string): Invitation | null {
    return (
      this.items.find((invitation) => {
        return invitation.candidateId === candidateId;
      }) ?? null
    );
  }

  // Правило то же, что в моке: одно активное предложение кандидату от компании,
  // после отказа можно пригласить снова.
  hasActive(candidateId: string): boolean {
    return this.items.some((invitation) => {
      return (
        invitation.candidateId === candidateId &&
        invitation.status !== InvitationStatus.Declined
      );
    });
  }

  ensureLoaded(): void {
    this.syncOwner();
    if (!this.loaded) {
      void this.load();
    }
  }

  load(options?: CallOptions<Invitation[]>) {
    this.syncOwner();
    this.loadFailed = false;
    return request(
      this.root,
      async () => {
        const items = readData(await employerApi.listInvitations());
        runInAction(() => {
          this.items = items;
          this.loaded = true;
        });
        return items;
      },
      {
        loader: false,
        ...options,
        onError: (error) => {
          runInAction(() => {
            this.loadFailed = true;
          });
          options?.onError?.(error);
        },
      },
    );
  }

  send(input: InvitationInput, options?: CallOptions<Invitation>) {
    return request(
      this.root,
      async () => {
        const invitation = readData(await employerApi.createInvitation(input));
        runInAction(() => {
          this.items.unshift(invitation);
        });
        return invitation;
      },
      { loader: true, ...options },
    );
  }

  private syncOwner(): void {
    const userId = this.root.auth.user?.id ?? null;
    if (userId === this.ownerId) {
      return;
    }
    this.ownerId = userId;
    this.items = [];
    this.loaded = false;
    this.loadFailed = false;
    if (userId) {
      employerApi.bindMockUser(userId);
    }
  }
}
