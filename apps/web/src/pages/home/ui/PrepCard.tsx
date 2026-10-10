import { prepLinks, prepTopics } from "@/pages/home/model/prep";
import { SplitHoverCard } from "@/pages/home/ui/SplitHoverCard";
import { ROUTES } from "@/shared/router/routes";
import { Anchor, Badge, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

import type { CandidateProfile } from "@hh/contracts";

// Карточка подготовки: темы из навыков слева, ссылки справа по наведению.
export const PrepCard = ({ profile }: { profile: CandidateProfile | null }) => {
  const topics = prepTopics(profile);

  return (
    <SplitHoverCard
      left={
        <Stack gap="sm">
          <Title order={3}>Подготовка к собеседованию</Title>
          <Text size="sm" c="dimmed">
            Темы берём из ваших навыков — подтверждённые идут первыми.
          </Text>
          {topics.length > 0 ? (
            <Group gap="xs">
              {topics.map((topic) => {
                return (
                  <Badge key={topic} color="fsp" variant="light">
                    {topic}
                  </Badge>
                );
              })}
            </Group>
          ) : (
            <Text size="sm" c="dimmed">
              Навыки пока не добавлены —{" "}
              <Anchor component={Link} to={ROUTES.PROFILE}>
                добавьте их в анкете
              </Anchor>
              .
            </Text>
          )}
        </Stack>
      }
      links={prepLinks}
    />
  );
};
