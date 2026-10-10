import { profileToInput } from "@/pages/profile/model/save-contacts";
import type {
  ContactValues,
  ResumeDraftHit,
  SkillRow,
} from "@/pages/profile/model/types";
import {
  profilesControllerExportPdf,
  profilesControllerFspHistory,
  profilesControllerFspLinkPreview,
  profilesControllerGet,
  profilesControllerResumeDraft,
  profilesControllerSave,
} from "@/shared/api/generated/sdk.gen";
import { mapFspHistory, mapFspLinkPreview } from "@/shared/api/map-fsp";
import { mapCandidateProfile, mapResumeDraft } from "@/shared/api/map-profile";
import { saveFile } from "@/shared/lib/save-file";
import { makeAutoObservable, runInAction } from "mobx";

import type {
  CandidateProfile,
  FspHistory,
  FspLinkPreview,
  ResumeDraft,
  SaveProfileInput,
} from "@hh/contracts";
import type { ResumeTemplate } from "@hh/types";

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
  // Импорт ФСП: что реестр знает по почте кандидата и что знает по привязанному fspId.
  fspPreview: FspLinkPreview | null = null;
  fspHistory: FspHistory | null = null;
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

  // Превью привязки ФСП. Тихая загрузка: баннер на главной ждёт её без лоадера.
  loadFspPreview(options?: CallOptions<FspLinkPreview>) {
    return request(
      this.root,
      async () => {
        const result = await profilesControllerFspLinkPreview();
        const preview = mapFspLinkPreview(readData(result));
        runInAction(() => {
          this.fspPreview = preview;
        });
        return preview;
      },
      { loader: false, ...options },
    );
  }

  // Своя история по привязанному fspId. Тихая: панель в анкете показывает её сама.
  loadFspHistory(options?: CallOptions<FspHistory>) {
    return request(
      this.root,
      async () => {
        const result = await profilesControllerFspHistory();
        const history = mapFspHistory(readData(result));
        runInAction(() => {
          this.fspHistory = history;
        });
        return history;
      },
      { loader: false, ...options },
    );
  }

  // Привязка из баннера или модалки: форма анкеты не открыта, поэтому
  // ввод собираем из сохранённого профиля и меняем только fspId и showFsp.
  // Превью не чистим: баннер и так прячется по новому profile.fspId,
  // а модалка успевает закрыться с содержимым.
  linkFsp(
    input: { fspId: string; showFsp: boolean },
    options?: CallOptions<CandidateProfile>,
  ) {
    const profile = this.profile;
    if (!profile) {
      // Анкеты ещё нет — привязывать нечего, тишина вместо пустого тоста.
      return Promise.resolve<CandidateProfile | null>(null);
    }
    return this.save(profileToInput(profile, input), options);
  }

  parseResume(file: File, options?: CallOptions<ResumeDraft>) {
    return request(
      this.root,
      async () => {
        const result = await profilesControllerResumeDraft({ body: { file } });
        const draft = mapResumeDraft(readData(result));
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

  downloadPdf(template: ResumeTemplate, options?: CallOptions<void>) {
    return request(
      this.root,
      async () => {
        const result = await profilesControllerExportPdf({
          query: { template },
          parseAs: "blob",
        });
        saveFile(readData(result), "profile.pdf");
      },
      { loader: true, ...options },
    );
  }
}
