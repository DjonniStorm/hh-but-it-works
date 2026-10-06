import {
  candidateInvitationsControllerAccept,
  candidateInvitationsControllerDecline,
  candidateInvitationsControllerList,
  candidateInvitationsControllerMarkViewed,
} from "@/shared/api/generated/sdk.gen";
import { mapCandidateInvitation } from "@/shared/api/map-employer";
import { makeAutoObservable, runInAction } from "mobx";

import type { CandidateInvitation } from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

import { type RequestOptions, loadRetry, readData, request } from "./request";
import type { RootStore } from "./root-store";
import { StoreKey } from "./store-key";

type CallOptions<T> = Pick<RequestOptions<T>, "onError" | "onSuccess">;

// Приглашения глазами кандидата: список и ответ. Сторона работодателя — InvitationStore.
export class CandidateInvitationStore {
  readonly key = StoreKey.CandidateInvitations;
  items: CandidateInvitation[] = [];
  // Чьи приглашения лежат в сторе. При входе другим аккаунтом список очищается.
  private ownerId: string | null = null;

  constructor(private readonly root: RootStore) {
    makeAutoObservable<this, "root" | "key">(
      this,
      { key: false, root: false },
      { autoBind: true },
    );
  }

  load(options?: CallOptions<CandidateInvitation[]>) {
    this.syncOwner();
    return request(
      this.root,
      async () => {
        const result = await candidateInvitationsControllerList();
        const items = readData(result).items.map(mapCandidateInvitation);
        runInAction(() => {
          this.items = items;
        });
        // На экране они остаются «Новыми» до следующего захода, а работодатель видит просмотр.
        const unseen = items.some((item) => {
          return item.status === InvitationStatus.Sent;
        });
        if (unseen) {
          void this.markViewed();
        }
        return items;
      },
      { loader: false, retry: loadRetry, ...options },
    );
  }

  // Фоновая отметка без лоадера: человек её не ждёт.
  private markViewed() {
    return request(
      this.root,
      // Ответ 204 без тела: readData тут не подходит, ошибку клиента request распознаёт сам.
      () => {
        return candidateInvitationsControllerMarkViewed();
      },
      { loader: false },
    ).catch(() => {
      // Ошибка уже показана тостом через ErrorStore. Не отмеченный просмотр не ломает экран.
      return undefined;
    });
  }

  accept(id: string, options?: CallOptions<CandidateInvitation>) {
    return request(
      this.root,
      async () => {
        const result = await candidateInvitationsControllerAccept({
          path: { id },
        });
        return this.replace(mapCandidateInvitation(readData(result)));
      },
      { loader: true, ...options },
    );
  }

  decline(id: string, options?: CallOptions<CandidateInvitation>) {
    return request(
      this.root,
      async () => {
        const result = await candidateInvitationsControllerDecline({
          path: { id },
        });
        return this.replace(mapCandidateInvitation(readData(result)));
      },
      { loader: true, ...options },
    );
  }

  private replace(invitation: CandidateInvitation): CandidateInvitation {
    runInAction(() => {
      this.items = this.items.map((item) => {
        return item.id === invitation.id ? invitation : item;
      });
    });
    return invitation;
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
