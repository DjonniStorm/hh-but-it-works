import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { NeedCard } from "@/pages/employer/ui/NeedCard";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES } from "@/shared/router/routes";
import {
  Button,
  EmptyState,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router";

export const NeedsPage = observer(() => {
  useHead({ title: pageTitle.needs });
  const employer = useStore(StoreKey.Employer);

  // Главный вход кабинета: сначала вопрос «кого ищете», а не дашборд.
  if (employer.needs.length === 0) {
    return (
      <Paper withBorder radius="md" p="xl" maw={720} mx="auto" mt="xl">
        <EmptyState
          size="lg"
          title="Кого вы ищете?"
          description="Опишите специализацию, грейд, стек и вилку. Мы соберём подборку кандидатов с подтверждённым профилем и объясним, почему каждый в неё попал."
        >
          <EmptyState.Actions>
            <Button component={Link} to={ROUTES.EMPLOYER.NEED_NEW} size="md">
              Описать потребность
            </Button>
          </EmptyState.Actions>
        </EmptyState>
      </Paper>
    );
  }

  return (
    <Stack gap="lg" maw={1100}>
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Потребности и подборки</Title>
          <Text c="dimmed" size="sm">
            Под каждую потребность система держит свою подборку кандидатов.
          </Text>
        </Stack>
        <Button component={Link} to={ROUTES.EMPLOYER.NEED_NEW}>
          Новая потребность
        </Button>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {employer.needs.map((need) => {
          return <NeedCard key={need.id} need={need} />;
        })}
      </SimpleGrid>
    </Stack>
  );
});
