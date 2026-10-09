import type {
  CandidateInvitation,
  CandidateSearchResult,
  CandidateSnapshot,
  CategoryMatch,
  CompanyProfile,
  HiringNeed,
  Invitation,
  Match,
  MatchGroup,
  Shortlist,
} from "@hh/contracts";
import {
  Grade,
  InvitationStatus,
  SearchStatus,
  SkillLevel,
  SkillVerification,
  Specialization,
  WorkFormat,
} from "@hh/types";

import type {
  CandidateInvitationDtoOutput,
  CandidateSearchResultDtoOutput,
  CompanyProfileDtoOutput,
  HiringNeedDtoOutput,
  InvitationDtoOutput,
  ShortlistDtoOutput,
} from "./generated/types.gen";

const categoryMatches: Record<CategoryMatch, CategoryMatch> = {
  exact: "exact",
  adjacent: "adjacent",
};

const matchGroups: Record<MatchGroup, MatchGroup> = {
  category: "category",
  skills: "skills",
  assessment: "assessment",
  fsp: "fsp",
  preferences: "preferences",
};

export function mapCompany(company: CompanyProfileDtoOutput): CompanyProfile {
  return {
    name: company.name,
    industry: company.industry,
    description: company.description,
    website: company.website,
    contactEmail: company.contactEmail,
    contactTelegram: company.contactTelegram,
  };
}

export function mapNeed(need: HiringNeedDtoOutput): HiringNeed {
  return {
    id: need.id,
    title: need.title,
    specialization: oneOf(Specialization, need.specialization),
    gradeFrom: oneOf(Grade, need.gradeFrom),
    gradeTo: oneOf(Grade, need.gradeTo),
    mustSkills: need.mustSkills,
    niceSkills: need.niceSkills,
    workFormat: oneOf(WorkFormat, need.workFormat),
    salaryFrom: need.salaryFrom,
    salaryTo: need.salaryTo,
    description: need.description,
    createdAt: need.createdAt,
    candidateCount: need.candidateCount,
  };
}

export function mapShortlist(shortlist: ShortlistDtoOutput): Shortlist {
  return {
    needId: shortlist.needId,
    modelVersion: shortlist.modelVersion,
    categories: shortlist.categories.map((category) => {
      return {
        grade: oneOf(Grade, category.grade),
        match: oneOf(categoryMatches, category.match),
        candidateCount: category.candidateCount,
      };
    }),
    items: shortlist.items.map(mapMatch),
  };
}

export function mapCandidateSearch(
  result: CandidateSearchResultDtoOutput,
): CandidateSearchResult {
  return { items: result.items.map(mapCandidate), total: result.total };
}

function mapMatch(match: ShortlistDtoOutput["items"][number]): Match {
  return {
    candidate: mapCandidate(match.candidate),
    matchScore: match.matchScore,
    qualification: match.qualification,
    opportunityFit: match.opportunityFit,
    reasons: match.reasons,
    risks: match.risks,
    breakdown: match.breakdown.map((item) => {
      return { ...item, group: oneOf(matchGroups, item.group) };
    }),
    dismissed: match.dismissed,
    favorite: match.favorite,
  };
}

// Снимок кандидата одинаков в подборке и в поиске.
function mapCandidate(
  candidate: CandidateSearchResultDtoOutput["items"][number],
): CandidateSnapshot {
  return {
    id: candidate.id,
    alias: candidate.alias,
    specialization: oneOf(Specialization, candidate.specialization),
    claimedGrade: oneOf(Grade, candidate.claimedGrade),
    verifiedGrade: candidate.verifiedGrade
      ? oneOf(Grade, candidate.verifiedGrade)
      : null,
    gradeConfidence: candidate.gradeConfidence,
    experienceYears: candidate.experienceYears,
    skills: candidate.skills.map((skill) => {
      return {
        title: skill.title,
        level: skill.level ? oneOf(SkillLevel, skill.level) : null,
        verification: oneOf(SkillVerification, skill.verification),
        score: skill.score,
        verifiedAt: skill.verifiedAt,
      };
    }),
    assessmentScore: candidate.assessmentScore,
    profileFreshness: candidate.profileFreshness,
    fspAchievements: candidate.fspAchievements,
    preferences: {
      desiredSalaryFrom: candidate.preferences.desiredSalaryFrom,
      workFormats: candidate.preferences.workFormats.map((format) => {
        return oneOf(WorkFormat, format);
      }),
      searchStatus: oneOf(SearchStatus, candidate.preferences.searchStatus),
    },
  };
}

export function mapInvitation(invitation: InvitationDtoOutput): Invitation {
  return {
    ...invitation,
    status: oneOf(InvitationStatus, invitation.status),
  };
}

export function mapCandidateInvitation(
  invitation: CandidateInvitationDtoOutput,
): CandidateInvitation {
  return {
    ...invitation,
    status: oneOf(InvitationStatus, invitation.status),
  };
}

// Строка из ответа API → значение enum. Незнакомое значение — ошибка контракта, а не тихий undefined.
function oneOf<T extends string>(values: Record<string, T>, value: string): T {
  const match = Object.values(values).find((item) => {
    return item === value;
  });
  if (match === undefined) {
    throw new Error(`Неизвестное значение в ответе API: ${value}`);
  }
  return match;
}
