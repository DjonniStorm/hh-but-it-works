import { useState } from "react";

import {
  filterMaterials,
  isConfirmedSkill,
  materialsFor,
} from "@/pages/home/model/materials";
import { MaterialCard } from "@/pages/home/ui/MaterialCard";
import { surfaceColor } from "@/shared/theme";
import {
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

// Материалы для подготовки — в самый конец страницы, по подтверждённым навыкам.
export const MaterialsSection = ({
  profile,
}: {
  profile: CandidateProfile | null;
}) => {
  const [query, setQuery] = useState("");
  const cards = materialsFor(profile);
  const visible = filterMaterials(cards, query);
  const confirmed = (profile?.skills ?? []).filter((skill) => {
    return isConfirmedSkill(skill);
  }).length;

  const emptyText =
    cards.length === 0
      ? confirmed === 0
        ? "Подтвердите навыки — по ним соберём материалы для подготовки."
        : "По этим навыкам материалы пока не подобрали."
      : `Ничего не нашли по запросу «${query.trim()}».`;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" gap="md">
        <Stack gap={4}>
          <Title order={3}>Материалы для подготовки</Title>
          <Text size="sm" c="dimmed">
            По вашим подтверждённым навыкам — документация и гайды, чтобы
            освежить тему перед собеседованием.
          </Text>
        </Stack>
        {cards.length > 0 ? (
          <TextInput
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            placeholder="Поиск по навыкам и материалам"
            aria-label="Поиск по материалам"
            maw={280}
            style={{ flex: "1 1 16rem" }}
          />
        ) : null}
      </Group>
      {visible.length > 0 ? (
        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
          {visible.map((card) => {
            return <MaterialCard key={card.skillId} skill={card} />;
          })}
        </SimpleGrid>
      ) : (
        <Paper
          withBorder
          p="lg"
          radius="md"
          style={{ background: surfaceColor }}
        >
          <Text size="sm" c="dimmed">
            {emptyText}
          </Text>
        </Paper>
      )}
    </Stack>
  );
};
