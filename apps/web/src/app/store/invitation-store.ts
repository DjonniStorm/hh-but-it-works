import {
  employersControllerCreateInvitation,
  employersControllerInvitationResume,
  employersControllerListInvitations,
  employersControllerWithdraw,
} from "@/shared/api/generated/sdk.gen";
import { mapInvitation } from "@/shared/api/map-employer";
import { saveFile } from "@/shared/lib/save-file";
import { makeAutoObservable, runInAction } from "mobx";

import type { Invitation, InvitationInput } from "@hh/contracts";
import { InvitationStatus, type ResumeTemplate } from "@hh/types";

import { type RequestOptions, loadRetry, readData, request } from "./request";
import type { RootStore } from "./root-store";
import { StoreKey } from "./store-key";

type CallOptions<T> = Pick<RequestOptions<T>, "onError" | "onSuccess">;

function sameItems(a: Invitation[], b: Invitation[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
        (invitation.status === InvitationStatus.Sent ||
          invitation.status === InvitationStatus.Viewed ||
          invitation.status === InvitationStatus.Accepted)
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

  // Тихое обновление по таймеру: без лоадера и тоста. Пока идёт действие человека, пропускаем.
  async refresh(): Promise<void> {
    if (this.root.loading.visible) {
      return;
    }
    this.syncOwner();
    try {
      const items = await request(
        this.root,
        async () => {
          const result = await employersControllerListInvitations();
          return readData(result).items.map(mapInvitation);
        },
        { loader: false, silent: true },
      );
      // Действие могло начаться во время запроса: его ответ новее, чем этот список.
      if (!this.root.loading.visible && !sameItems(this.items, items)) {
        runInAction(() => {
          this.items = items;
        });
      }
    } catch {
      // Сбой фонового запроса не мешает: показан прошлый список, следующий тик повторит.
    }
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

  withdraw(id: string, options?: CallOptions<Invitation>) {
    return request(
      this.root,
      async () => {
        const result = await employersControllerWithdraw({ path: { id } });
        const invitation = mapInvitation(readData(result));
        runInAction(() => {
          this.items = this.items.map((item) => {
            return item.id === invitation.id ? invitation : item;
          });
        });
        return invitation;
      },
      { loader: true, ...options },
    );
  }

  // PDF-резюме кандидата. Сервер отдаёт его только по принятому приглашению.
  downloadResume(
    id: string,
    template: ResumeTemplate,
    options?: CallOptions<void>,
  ) {
    return request(
      this.root,
      async () => {
        const result = await employersControllerInvitationResume({
          path: { id },
          query: { template },
          parseAs: "blob",
        });
        saveFile(readData(result), "resume.pdf");
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
