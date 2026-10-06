import * as employerApi from "@/shared/api/mock/employer-api";
import { makeAutoObservable, runInAction } from "mobx";

import type { Invitation, InvitationInput } from "@hh/contracts";

import { type RequestOptions, readData, request } from "./request";
import type { RootStore } from "./root-store";
import { StoreKey } from "./store-key";

type CallOptions<T> = Pick<RequestOptions<T>, "onError" | "onSuccess">;

// Отдельно от EmployerStore: те же приглашения позже покажет кабинет кандидата.
export class InvitationStore {
  readonly key = StoreKey.Invitations;
  items: Invitation[] = [];
  loaded = false;

  constructor(private readonly root: RootStore) {
    makeAutoObservable<this, "root" | "key">(
      this,
      { key: false, root: false },
      { autoBind: true },
    );
  }

  byCandidate(candidateId: string): Invitation | null {
    return (
      this.items.find((invitation) => {
        return invitation.candidateId === candidateId;
      }) ?? null
    );
  }

  load(options?: CallOptions<Invitation[]>) {
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
      { loader: false, ...options },
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
}
