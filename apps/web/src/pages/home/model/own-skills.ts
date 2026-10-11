import type { CandidateProfile } from "@hh/contracts";

// profile.skills — весь видимый каталог; у навыков кандидата level не null (как в assessedFromProfile).
export function ownSkills(
  profile: CandidateProfile | null,
): CandidateProfile["skills"] {
  return (profile?.skills ?? []).filter((skill) => {
    return skill.level !== null;
  });
}
