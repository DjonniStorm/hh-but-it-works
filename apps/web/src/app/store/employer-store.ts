import {
  employersControllerCreateNeed,
  employersControllerDeleteNeed,
  employersControllerDismiss,
  employersControllerFavorite,
  employersControllerGetCompany,
  employersControllerListNeeds,
  employersControllerRestore,
  employersControllerSaveCompany,
  employersControllerSearchCandidates,
  employersControllerShortlist,
  employersControllerUnfavorite,
  employersControllerUpdateNeed,
} from "@/shared/api/generated/sdk.gen";
import {
  mapCandidateSearch,
  mapCompany,
  mapNeed,
  mapShortlist,
} from "@/shared/api/map-employer";
import { makeAutoObservable, observable, runInAction } from "mobx";

import type {
  CandidateSearch,
  CandidateSearchResult,
  CompanyProfile,
  HiringNeed,
  HiringNeedInput,
  Shortlist,
} from "@hh/contracts";

import { type RequestOptions, loadRetry, readData, request } from "./request";
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
          this.needs = items.map(mapNeed);
        });
      },
      // Кабинет ждёт профиль и потребности: id попадает в лоадер оболочки.
      { loader: true, retry: loadRetry, ...options },
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
        const need = mapNeed(readData(result));
        runInAction(() => {
          this.needs.unshift(need);
        });
        return need;
      },
      { loader: true, ...options },
    );
  }

  updateNeed(
    needId: string,
    input: HiringNeedInput,
    options?: CallOptions<HiringNeed>,
  ) {
    return request(
      this.root,
      async () => {
        const result = await employersControllerUpdateNeed({
          path: { id: needId },
          body: input,
        });
        const need = mapNeed(readData(result));
        runInAction(() => {
          this.needs = this.needs.map((item) => {
            return item.id === need.id ? need : item;
          });
          // Состав подборки зависит от требований: старую не показываем, экран загрузит новую.
          this.shortlists.delete(need.id);
          this.root.invitations.renameNeed(need.id, need.title);
        });
        return need;
      },
      { loader: true, ...options },
    );
  }

  deleteNeed(needId: string, options?: CallOptions<void>) {
    return request(
      this.root,
      async () => {
        const result = await employersControllerDeleteNeed({
          path: { id: needId },
        });
        readData(result);
        runInAction(() => {
          this.needs = this.needs.filter((need) => {
            return need.id !== needId;
          });
          this.shortlists.delete(needId);
        });
      },
      { loader: true, ...options },
    );
  }

  loadShortlist(needId: string, options?: CallOptions<Shortlist>) {
    return request(
      this.root,
      async () => {
        const result = await employersControllerShortlist({
          path: { id: needId },
        });
        const shortlist = mapShortlist(readData(result));
        runInAction(() => {
          this.shortlists.set(needId, shortlist);
        });
        return shortlist;
      },
      // Экран подборки пуст, пока она не пришла.
      { loader: true, retry: loadRetry, ...options },
    );
  }

  // Выдачу держит экран поиска: она зависит от фильтров в адресе, а не от кабинета.
  searchCandidates(
    filter: CandidateSearch,
    options?: CallOptions<CandidateSearchResult>,
  ) {
    return request(
      this.root,
      async () => {
        const result = await employersControllerSearchCandidates({
          body: filter,
        });
        return mapCandidateSearch(readData(result));
      },
      { loader: true, retry: loadRetry, ...options },
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
        const path = { id: needId, candidateId };
        const result = dismissed
          ? await employersControllerDismiss({ path })
          : await employersControllerRestore({ path });
        const shortlist = mapShortlist(readData(result));
        const active = shortlist.items.filter((match) => {
          return !match.dismissed;
        }).length;
        runInAction(() => {
          this.shortlists.set(needId, shortlist);
          // Число в карточке потребности — то, что вернул сервер в подборке.
          const need = this.needById(needId);
          if (need) {
            need.candidateCount = active;
          }
        });
      },
      { loader: true, ...options },
    );
  }

  setFavorite(
    needId: string,
    candidateId: string,
    favorite: boolean,
    options?: CallOptions<void>,
  ) {
    return request(
      this.root,
      async () => {
        const path = { id: needId, candidateId };
        const result = favorite
          ? await employersControllerFavorite({ path })
          : await employersControllerUnfavorite({ path });
        const shortlist = mapShortlist(readData(result));
        runInAction(() => {
          this.shortlists.set(needId, shortlist);
        });
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
    this.company = null;
    this.needs = [];
    this.shortlists.clear();
  }
}
