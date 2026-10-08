import { ContactsPanel } from "@/pages/profile/ui/ContactsPanel";
import { SkillsPanel } from "@/pages/profile/ui/SkillsPanel";
import { SimpleGrid } from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

export const ProfilePanels = ({
  profile,
  email,
}: {
  profile: CandidateProfile;
  email: string;
}) => {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <ContactsPanel profile={profile} email={email} />
      <SkillsPanel profile={profile} />
    </SimpleGrid>
  );
};
