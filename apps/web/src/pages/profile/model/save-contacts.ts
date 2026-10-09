import {
  educationFromProfile,
  experienceFromProfile,
} from "@/pages/profile/model/resume-history";
import type { ContactValues } from "@/pages/profile/model/types";

import type { CandidateProfile, SaveProfileInput } from "@hh/contracts";
import { Grade, SearchStatus, Specialization, WorkFormat } from "@hh/types";

export function contactsFromProfile(profile: CandidateProfile): ContactValues {
  return {
    displayName: profile.displayName,
    specialization: profile.specialization ?? "",
    claimedGrade: profile.claimedGrade ?? "",
    fspId: profile.fspId ?? "",
    phone: profile.phone ?? "",
    telegram: profile.telegram ?? "",
    github: profile.github ?? "",
    linkedin: profile.linkedin ?? "",
    website: profile.website ?? "",
    // Обычные массивы: у observable klona уходит в символ MobX и зацикливается.
    softSkills: profile.softSkills.slice(),
    desiredSalaryFrom: profile.desiredSalaryFrom ?? "",
    experienceYears: profile.experienceYears ?? "",
    education: educationFromProfile(profile.education),
    experience: experienceFromProfile(profile.experience),
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
    phone: values.phone,
    telegram: values.telegram,
    github: values.github,
    linkedin: values.linkedin,
    website: values.website,
    softSkills: values.softSkills,
    desiredSalaryFrom:
      values.desiredSalaryFrom === "" ? null : values.desiredSalaryFrom,
    experienceYears:
      values.experienceYears === "" ? null : values.experienceYears,
    education: values.education.map((item) => {
      return {
        school: item.school,
        program: item.program,
        fromYear: item.fromYear,
        toYear: item.toYear === "" ? null : item.toYear,
      };
    }),
    experience: values.experience.map((item) => {
      return {
        company: item.company,
        role: item.role,
        fromYear: item.fromYear,
        toYear: item.toYear === "" ? null : item.toYear,
        summary: item.summary,
      };
    }),
    workFormats: values.workFormats as WorkFormat[],
    searchStatus: values.searchStatus as SearchStatus,
    showExperience: values.showExperience,
    showSalary: values.showSalary,
    showFsp: values.showFsp,
    showUnverifiedSkills: values.showUnverifiedSkills,
  };
}
