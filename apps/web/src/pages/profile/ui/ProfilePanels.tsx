import type { ResumeDraftHit } from "@/pages/profile/model/types";
import { ContactsPanel } from "@/pages/profile/ui/ContactsPanel";
import { SkillsPanel } from "@/pages/profile/ui/SkillsPanel";
import { SimpleGrid } from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

export const ProfilePanels = ({
  profile,
  email,
  draft,
}: {
  profile: CandidateProfile;
  email: string;
  draft: ResumeDraftHit | null;
}) => {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <ContactsPanel profile={profile} email={email} draft={draft} />
      <SkillsPanel profile={profile} draft={draft} />
    </SimpleGrid>
  );
};
