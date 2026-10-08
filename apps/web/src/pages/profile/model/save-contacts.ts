import type { ContactValues } from "@/pages/profile/model/types";

import type { CandidateProfile, SaveProfileInput } from "@hh/contracts";
import { Grade, SearchStatus, Specialization, WorkFormat } from "@hh/types";

export function contactsFromProfile(profile: CandidateProfile): ContactValues {
  return {
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
    workFormats: profile.workFormats.slice(),
    searchStatus: profile.searchStatus,
    showExperience: profile.showExperience,
    showSalary: profile.showSalary,
    showFsp: profile.showFsp,
    showUnverifiedSkills: profile.showUnverifiedSkills,
  };
}

export function contactInput(
  values: ContactValues,
): Omit<SaveProfileInput, "skills"> {
  return {
    displayName: values.displayName,
    specialization: values.specialization as Specialization,
    claimedGrade: values.claimedGrade as Grade,
    fspId: values.fspId,
    telegram: values.telegram,
    github: values.github,
    linkedin: values.linkedin,
    website: values.website,
    desiredSalaryFrom:
      values.desiredSalaryFrom === "" ? null : values.desiredSalaryFrom,
    experienceYears:
      values.experienceYears === "" ? null : values.experienceYears,
    workFormats: values.workFormats as WorkFormat[],
    searchStatus: values.searchStatus as SearchStatus,
    showExperience: values.showExperience,
    showSalary: values.showSalary,
    showFsp: values.showFsp,
    showUnverifiedSkills: values.showUnverifiedSkills,
  };
}
