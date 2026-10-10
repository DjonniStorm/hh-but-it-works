import type { SkillMaterials } from "@/pages/home/model/materials";
import { SplitHoverCard } from "@/pages/home/ui/SplitHoverCard";
import { verificationColor } from "@/shared/theme";
import { Badge, Stack, Text, Title } from "@mantine/core";

// Одна карточка материалов: слева навык, справа ссылки по наведению —
// та же механика, что у PrepCard.
export const MaterialCard = ({ skill }: { skill: SkillMaterials }) => {
  return (
    <SplitHoverCard
      left={
        <Stack gap="sm">
          <Title order={4}>{skill.title}</Title>
          <Badge color={verificationColor[skill.verification]} variant="light">
            подтверждён
          </Badge>
          <Text size="sm" c="dimmed">
            Документация и гайды по теме.
          </Text>
        </Stack>
      }
      links={skill.links.map((link) => {
        return { label: link.label, to: link.url, external: true };
      })}
    />
  );
};
