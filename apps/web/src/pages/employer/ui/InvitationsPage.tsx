import { useEffect } from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { contactHint } from "@/pages/employer/model/invitation-contact";
import {
  invitationStatusFilter,
  invitationStatuses,
} from "@/pages/employer/model/invitation-filter";
import { InvitationActions } from "@/pages/employer/ui/InvitationActions";
import { InvitationCard } from "@/pages/employer/ui/InvitationCard";
import { formatDate } from "@/shared/lib/format";
import { invitationStatusLabel } from "@/shared/lib/labels";
import { pollIntervalMs, usePolling } from "@/shared/lib/use-polling";
import { ROUTES } from "@/shared/router/routes";
import { pageSeo } from "@/shared/seo/pages";
import { usePageSeo } from "@/shared/seo/use-page-seo";
import { invitationStatusColor } from "@/shared/theme";
import {
  Badge,
  Button,
  EmptyState,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  useMatches,
} from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useQueryState } from "nuqs";
import { Link } from "react-router";

import { formatSalary } from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

export const InvitationsPage = observer(() => {
  usePageSeo(pageSeo.employerInvitations);
  const invitations = useStore(StoreKey.Invitations);
  const [filter, setFilter] = useQueryState("status", invitationStatusFilter);
  // Уже md таблица из семи колонок не влезает: там карточки и фильтр списком.
  // Ширину читаем сразу, а не после первого кадра: иначе на десктопе мелькают карточки.
  const compact = useMatches(
    { base: true, md: false },
    { getInitialValueInEffect: false },
  );

  // Кабинет грузит приглашения один раз при входе. Здесь освежаем тихо, чтобы увидеть
  // ответы кандидатов без F5. Ошибка уже ушла тостом, а на экране остаётся прошлый список.
  useEffect(() => {
    invitations.load().catch(() => {
      return undefined;
    });
  }, [invitations]);
  // Ответы кандидатов появляются сами, без F5.
  usePolling(() => {
    void invitations.refresh();
  }, pollIntervalMs);

  const count = (status: InvitationStatus) => {
    return invitations.items.filter((item) => {
      return item.status === status;
    }).length;
  };
  const rows = invitations.items.filter((item) => {
    return filter === "all" || item.status === filter;
  });
  const filters = [
    { value: "all", label: `Все · ${invitations.items.length}` },
    ...invitationStatuses.map((status) => {
      return {
        value: status,
        label: `${invitationStatusLabel[status]} · ${count(status)}`,
      };
    }),
  ];

  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <Stack gap={4}>
        <Title order={2}>Приглашения</Title>
        <Text c="dimmed" size="sm">
          Статусы обновляются, когда кандидат открывает и отвечает на
          приглашение. Контакт появится после принятия.
        </Text>
      </Stack>

      {compact ? (
        <Select
          label="Статус"
          data={filters}
          value={filter}
          allowDeselect={false}
          onChange={(value) => {
            void setFilter((value ?? "all") as typeof filter);
          }}
        />
      ) : (
        <SegmentedControl
          value={filter}
          onChange={(value) => {
            void setFilter(value as typeof filter);
          }}
          data={filters}
          style={{ alignSelf: "flex-start" }}
        />
      )}

      {rows.length === 0 ? (
        <Paper withBorder radius="md" p="xl">
          <EmptyState
            title="Здесь пока пусто"
            description="Пригласите кандидата из подборки: укажите предложение и вилку, он увидит условия сразу."
          >
            <EmptyState.Actions>
              <Button component={Link} to={ROUTES.EMPLOYER.NEEDS}>
                К подборкам
              </Button>
            </EmptyState.Actions>
          </EmptyState>
        </Paper>
      ) : compact ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {rows.map((item) => {
            return <InvitationCard key={item.id} item={item} />;
          })}
        </SimpleGrid>
      ) : (
        <Paper withBorder radius="md">
          <Table.ScrollContainer minWidth={900}>
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Кандидат</Table.Th>
                  <Table.Th>Потребность</Table.Th>
                  <Table.Th>Вилка</Table.Th>
                  <Table.Th>Отправлено</Table.Th>
                  <Table.Th miw={150}>Статус</Table.Th>
                  <Table.Th>Контакт</Table.Th>
                  <Table.Th>Действие</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((item) => {
                  return (
                    <Table.Tr key={item.id}>
                      <Table.Td fw={600}>{item.candidateAlias}</Table.Td>
                      <Table.Td>
                        {item.needTitle ?? (
                          <Text span c="dimmed" size="sm">
                            без привязки
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td style={{ whiteSpace: "nowrap" }}>
                        {formatSalary(item.salaryFrom, item.salaryTo)}
                      </Table.Td>
                      <Table.Td style={{ whiteSpace: "nowrap" }}>
                        {formatDate(item.createdAt)}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={invitationStatusColor[item.status]}
                          tt="none"
                        >
                          {invitationStatusLabel[item.status]}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {item.candidateContact ?? (
                          <Text span c="dimmed" size="xs">
                            {contactHint(item.status)}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <InvitationActions item={item} />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}
    </Stack>
  );
});
