import type {
  ContactValues,
  ResumeDraftHit,
  SkillRow,
} from "@/pages/profile/model/types";
import {
  profilesControllerExportPdf,
  profilesControllerGet,
  profilesControllerResumeDraft,
  profilesControllerSave,
} from "@/shared/api/generated/sdk.gen";
import { mapCandidateProfile } from "@/shared/api/map-profile";
import { makeAutoObservable, runInAction } from "mobx";

import type {
  CandidateProfile,
  ResumeDraft,
  SaveProfileInput,
} from "@hh/contracts";

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
  resumeDraft: ResumeDraftHit | null = null;
  // Текущие значения соседней формы. Не observable: запись не должна перерисовывать анкету.
  readContacts: (() => ContactValues) | null = null;
  readSkills: (() => SkillRow[]) | null = null;

  constructor(private readonly root: RootStore) {
    makeAutoObservable<this, "root" | "key" | "readContacts" | "readSkills">(
      this,
      { key: false, root: false, readContacts: false, readSkills: false },
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

  parseResume(file: File, options?: CallOptions<ResumeDraft>) {
    return request(
      this.root,
      async () => {
        const result = await profilesControllerResumeDraft({ body: { file } });
        const draft = readData(result);
        runInAction(() => {
          this.resumeDraft = { at: Date.now(), draft };
        });
        return draft;
      },
      { loader: true, ...options },
    );
  }

  clearResumeDraft(): void {
    this.resumeDraft = null;
  }

  bindContacts(read: (() => ContactValues) | null): void {
    this.readContacts = read;
  }

  bindSkills(read: (() => SkillRow[]) | null): void {
    this.readSkills = read;
  }

  downloadPdf(options?: CallOptions<void>) {
    return request(
      this.root,
      async () => {
        const result = await profilesControllerExportPdf({ parseAs: "blob" });
        const blob = readData(result);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "profile.pdf";
        document.body.append(link);
        link.click();
        // Сразу revoke обрывает загрузку в Firefox и Safari.
        window.setTimeout(() => {
          link.remove();
          URL.revokeObjectURL(url);
        }, 1000);
      },
      { loader: true, ...options },
    );
  }
}
