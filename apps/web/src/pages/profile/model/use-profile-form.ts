import { useEffect, useRef } from "react";
import type { SyntheticEvent } from "react";

import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { applyContactDraft } from "@/pages/profile/model/apply-resume-draft";
import {
  educationFromProfile,
  experienceFromProfile,
} from "@/pages/profile/model/resume-history";
import { contactInput } from "@/pages/profile/model/save-contacts";
import {
  assessedFromProfile,
  saveSkills,
} from "@/pages/profile/model/save-skills";
import type {
  ContactValues,
  ResumeDraftHit,
} from "@/pages/profile/model/types";
import { focusFirstError } from "@/shared/lib/focus-first-error";
import { schemaResolver, useForm } from "@mantine/form";
import type { UseFormReturnType } from "@mantine/form";

import { type CandidateProfile, saveContactsSchema } from "@hh/contracts";

export type ProfileForm = UseFormReturnType<ContactValues>;

// У каждой плитки своя кнопка и своё сообщение, но значения общие: сохраняется вся анкета.
export type ProfileSubmit = (
  message: string,
) => (event?: SyntheticEvent<HTMLFormElement>) => void;

// Анкета живёт одной формой, а плитки только разбирают её по секциям.
export function useProfileForm({
  profile,
  draft,
}: {
  profile: CandidateProfile;
  draft: ResumeDraftHit | null;
}): {
  form: ProfileForm;
  submit: ProfileSubmit;
} {
  const profiles = useStore(StoreKey.Profile);
  const seenDraft = useRef<number | null>(null);
  const form = useForm<ContactValues>({
    initialValues: {
      displayName: profile.displayName,
      specialization: profile.specialization ?? "",
      claimedGrade: profile.claimedGrade ?? "",
      fspId: profile.fspId ?? "",
      telegram: profile.telegram ?? "",
      github: profile.github ?? "",
      linkedin: profile.linkedin ?? "",
      website: profile.website ?? "",
      desiredSalaryFrom: profile.desiredSalaryFrom ?? "",
      experienceYears: profile.experienceYears ?? "",
      education: educationFromProfile(profile.education),
      experience: experienceFromProfile(profile.experience),
      // Обычный массив: у observable klona уходит в символ MobX и зацикливается.
      workFormats: profile.workFormats.slice(),
      searchStatus: profile.searchStatus,
      showExperience: profile.showExperience,
      showSalary: profile.showSalary,
      showFsp: profile.showFsp,
      showUnverifiedSkills: profile.showUnverifiedSkills,
    },
    validate: schemaResolver(saveContactsSchema, { sync: true }),
  });

  const submit: ProfileSubmit = (message) => {
    return form.onSubmit(
      (values) => {
        // Резолвер уже проверил специализацию и грейд. В типе формы они шире.
        const skills =
          profiles.readSkills?.() ?? assessedFromProfile(profile.skills);
        void profiles.save(
          {
            ...contactInput(values),
            skills: saveSkills(skills),
          },
          {
            onSuccess: () => {
              notifier.showSuccess(message);
            },
          },
        );
      },
      (errors) => {
        focusFirstError(form, errors);
      },
    );
  };

  // Соседние плитки и навыки собирают сохранение из этой формы.
  useEffect(() => {
    profiles.bindContacts(() => {
      return form.getValues();
    });
    return () => {
      profiles.bindContacts(null);
    };
  }, [form, profiles]);

  useEffect(() => {
    if (!draft || seenDraft.current === draft.at) {
      return;
    }
    seenDraft.current = draft.at;
    applyContactDraft(form, draft.draft, profile.verifiedGrade);
  }, [draft, form, profile.verifiedGrade]);

  return { form, submit };
}
