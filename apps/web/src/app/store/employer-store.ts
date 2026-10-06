import * as employerApi from "@/shared/api/mock/employer-api";
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
  loaded = false;

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

  // Профиль и потребности нужны всем экранам кабинета, поэтому грузятся один раз при входе.
  load(options?: CallOptions<void>) {
    return request(
      this.root,
      async () => {
        const [company, needs] = await Promise.all([
          employerApi.getCompany(),
          employerApi.listNeeds(),
        ]);
        runInAction(() => {
          this.company = readData(company);
          this.needs = readData(needs);
          this.loaded = true;
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
        const company = readData(await employerApi.saveCompany(input));
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
        const need = readData(await employerApi.createNeed(input));
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
        const shortlist = readData(await employerApi.getShortlist(needId));
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
        const items = readData(
          await employerApi.setDismissed(needId, candidateId, dismissed),
        );
        runInAction(() => {
          const shortlist = this.shortlists.get(needId);
          if (shortlist) {
            this.shortlists.set(needId, { ...shortlist, items });
          }
          const need = this.needById(needId);
          if (need) {
            need.candidateCount = items.filter((match) => {
              return !match.dismissed;
            }).length;
          }
        });
      },
      { loader: true, ...options },
    );
  }
}
