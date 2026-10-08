import {
  employersControllerCreateInvitation,
  employersControllerListInvitations,
} from "@/shared/api/generated/sdk.gen";
import { mapInvitation } from "@/shared/api/map-employer";
import { makeAutoObservable, runInAction } from "mobx";

import type { Invitation, InvitationInput } from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

import { type RequestOptions, loadRetry, readData, request } from "./request";
import type { RootStore } from "./root-store";
import { StoreKey } from "./store-key";

type CallOptions<T> = Pick<RequestOptions<T>, "onError" | "onSuccess">;

// Приглашения работодателя. Сторона кандидата — CandidateInvitationStore.
export class InvitationStore {
  readonly key = StoreKey.Invitations;
  items: Invitation[] = [];
  // Чьи приглашения лежат в сторе. При входе другим аккаунтом список очищается.
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

  // Правило то же, что на сервере (InvitationsService.create): одно активное предложение
  // кандидату от компании, после отказа можно пригласить снова.
  hasActive(candidateId: string): boolean {
    return this.items.some((invitation) => {
      return (
        invitation.candidateId === candidateId &&
        invitation.status !== InvitationStatus.Declined
      );
    });
  }

  // Приглашение показывает текущее название потребности: сервер берёт его по needId.
  renameNeed(needId: string, title: string): void {
    for (const invitation of this.items) {
      if (invitation.needId === needId) {
        invitation.needTitle = title;
      }
    }
  }

  load(options?: CallOptions<Invitation[]>) {
    this.syncOwner();
    return request(
      this.root,
      async () => {
        const result = await employersControllerListInvitations();
        const items = readData(result).items.map(mapInvitation);
        runInAction(() => {
          this.items = items;
        });
        return items;
      },
      { loader: false, retry: loadRetry, ...options },
    );
  }

  send(input: InvitationInput, options?: CallOptions<Invitation>) {
    return request(
      this.root,
      async () => {
        const result = await employersControllerCreateInvitation({
          body: input,
        });
        const invitation = mapInvitation(readData(result));
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
  }
}
