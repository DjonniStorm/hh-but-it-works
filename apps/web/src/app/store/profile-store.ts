import {
  profilesControllerGet,
  profilesControllerSave,
} from "@/shared/api/generated/sdk.gen";
import { mapCandidateProfile } from "@/shared/api/map-profile";
import { makeAutoObservable, runInAction } from "mobx";

import type { CandidateProfile, SaveProfileInput } from "@hh/contracts";

import { type RequestOptions, readData, request } from "./request";
import type { RootStore } from "./root-store";
import { StoreKey } from "./store-key";

type CallOptions<T> = Pick<
  RequestOptions<T>,
  "onError" | "onSuccess" | "loader"
>;

export class ProfileStore {
  readonly key = StoreKey.Profile;
  profile: CandidateProfile | null = null;

  constructor(private readonly root: RootStore) {
    makeAutoObservable<this, "root" | "key">(
      this,
      { key: false, root: false },
      { autoBind: true },
    );
  }

  load(options?: CallOptions<CandidateProfile>) {
    return request(
      this.root,
      async () => {
        const result = await profilesControllerGet();
        const profile = mapCandidateProfile(readData(result));
        // После await присваивание уже вне action, а страница наблюдает profile.
        runInAction(() => {
          this.profile = profile;
        });
        return profile;
      },
      // Страница ждёт анкету: id попадает в лоадер оболочки.
      { loader: true, ...options },
    );
  }

  save(input: SaveProfileInput, options?: CallOptions<CandidateProfile>) {
    return request(
      this.root,
      async () => {
        const result = await profilesControllerSave({ body: input });
        const profile = mapCandidateProfile(readData(result));
        runInAction(() => {
          this.profile = profile;
        });
        return profile;
      },
      { loader: true, ...options },
    );
  }
}
