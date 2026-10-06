import { ContactsPanel } from "@/pages/profile/ui/ContactsPanel";
import { SkillsPanel } from "@/pages/profile/ui/SkillsPanel";
import { ScrollArea, SimpleGrid } from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

export const ProfilePanels = ({
  profile,
  email,
}: {
  profile: CandidateProfile;
  email: string;
}) => {
  return (
    <SimpleGrid
      cols={{ base: 1, md: 2 }}
      spacing="lg"
      h="100%"
      style={{ minHeight: 0, gridAutoRows: "minmax(0, 1fr)" }}
    >
      <ScrollArea
        h="100%"
        type="auto"
        offsetScrollbars
        scrollbars="y"
        verticalScrollbarPosition="left"
        style={{ minHeight: 0 }}
      >
        <ContactsPanel profile={profile} email={email} />
      </ScrollArea>
      <ScrollArea
        h="100%"
        type="auto"
        offsetScrollbars
        scrollbars="y"
        style={{ minHeight: 0 }}
      >
        <SkillsPanel profile={profile} />
      </ScrollArea>
    </SimpleGrid>
  );
};
