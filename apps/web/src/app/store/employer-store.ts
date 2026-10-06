import {
  employersControllerCreateNeed,
  employersControllerGetCompany,
  employersControllerListNeeds,
  employersControllerSaveCompany,
} from "@/shared/api/generated/sdk.gen";
import { mapCompany, mapNeed } from "@/shared/api/map-employer";
import * as shortlistMock from "@/shared/api/mock/employer-api";
import { makeAutoObservable, observable, runInAction } from "mobx";

import type {
  CompanyProfile,
  HiringNeed,
  HiringNeedInput,
  Shortlist,
} from "@hh/contracts";

import { type RequestOptions, readData, request } from "./request";
import type { RootStore } from "./root-store";
import { StoreKey } from "./store-key";

type CallOptions<T> = Pick<RequestOptions<T>, "onError" | "onSuccess">;

export class EmployerStore {
  readonly key = StoreKey.Employer;
  company: CompanyProfile | null = null;
  needs: HiringNeed[] = [];
  readonly shortlists = observable.map<string, Shortlist>();
  // Чьи данные лежат в сторе. При входе другим аккаунтом стор очищается.
  private ownerId: string | null = null;

  constructor(private readonly root: RootStore) {
    makeAutoObservable<this, "root" | "key">(
      this,
      { key: false, root: false },
      { autoBind: true },
    );
  }

  get hasCompany(): boolean {
    return this.company !== null;
  }

  needById(id: string): HiringNeed | null {
    return (
      this.needs.find((need) => {
        return need.id === id;
      }) ?? null
    );
  }

  // Профиль и потребности нужны всем экранам кабинета. Загружено или упало — решает EmployerLayout.
  load(options?: CallOptions<void>) {
    this.syncOwner();
    return request(
      this.root,
      async () => {
        const [companyResult, needsResult] = await Promise.all([
          employersControllerGetCompany(),
          employersControllerListNeeds(),
        ]);
        const { company } = readData(companyResult);
        const { items } = readData(needsResult);
        runInAction(() => {
          this.company = company ? mapCompany(company) : null;
          this.needs = items.map((item) => {
            return shortlistMock.withCandidateCount(mapNeed(item));
          });
        });
      },
      // Кабинет ждёт профиль и потребности: id попадает в лоадер оболочки.
      { loader: true, ...options },
    );
  }

  saveCompany(input: CompanyProfile, options?: CallOptions<CompanyProfile>) {
    return request(
      this.root,
      async () => {
        const result = await employersControllerSaveCompany({ body: input });
        const company = mapCompany(readData(result));
        runInAction(() => {
          this.company = company;
        });
        return company;
      },
      { loader: true, ...options },
    );
  }

  createNeed(input: HiringNeedInput, options?: CallOptions<HiringNeed>) {
    return request(
      this.root,
      async () => {
        const result = await employersControllerCreateNeed({ body: input });
        const need = shortlistMock.withCandidateCount(
          mapNeed(readData(result)),
        );
        runInAction(() => {
          this.needs.unshift(need);
        });
        return need;
      },
      { loader: true, ...options },
    );
  }

  loadShortlist(needId: string, options?: CallOptions<Shortlist>) {
    return request(
      this.root,
      async () => {
        const shortlist = readData(
          await shortlistMock.getShortlist(this.requireNeed(needId)),
        );
        runInAction(() => {
          this.shortlists.set(needId, shortlist);
        });
        return shortlist;
      },
      // Экран подборки пуст, пока она не пришла.
      { loader: true, ...options },
    );
  }

  setDismissed(
    needId: string,
    candidateId: string,
    dismissed: boolean,
    options?: CallOptions<void>,
  ) {
    return request(
      this.root,
      async () => {
        const need = this.requireNeed(needId);
        const shortlist = readData(
          await shortlistMock.setDismissed(need, candidateId, dismissed),
        );
        runInAction(() => {
          this.shortlists.set(needId, shortlist);
          // Число в карточке берём у подборки, а не считаем в сторе.
          this.needs = this.needs.map((item) => {
            return item.id === needId
              ? shortlistMock.withCandidateCount(item)
              : item;
          });
        });
      },
      { loader: true, ...options },
    );
  }

  private requireNeed(needId: string): HiringNeed {
    const need = this.needById(needId);
    if (!need) {
      throw new Error("Потребность не найдена");
    }
    return need;
  }

  private syncOwner(): void {
    const userId = this.root.auth.user?.id ?? null;
    if (userId === this.ownerId) {
      return;
    }
    this.ownerId = userId;
    this.company = null;
    this.needs = [];
    this.shortlists.clear();
    if (userId) {
      shortlistMock.bindMockUser(userId);
    }
  }
}
