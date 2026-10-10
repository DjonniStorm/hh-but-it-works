import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRootStore } from "@/app/store/store-context";
import {
  searchParsers,
  toSearchFilter,
} from "@/pages/employer/model/search-params";
import { CandidateCard } from "@/pages/employer/ui/CandidateCard";
import { InviteModal } from "@/pages/employer/ui/InviteModal";
import { SearchFilters } from "@/pages/employer/ui/SearchFilters";
import { ErrorScreen } from "@/shared/error/ui/ErrorScreen";
import { pageTitle } from "@/shared/router/page-title";
import { EmptyState, Paper, Stack, Text, Title } from "@mantine/core";
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { useQueryStates } from "nuqs";

import {
  type CandidateSearchResult,
  type CandidateSnapshot,
  candidateSearchLimit,
} from "@hh/contracts";

export const SearchPage = observer(() => {
  useHead({ title: pageTitle.search });
  const { employer, invitations } = useRootStore();
  const [params, setParams] = useQueryStates(searchParsers);
  const filter = useMemo(() => {
    return toSearchFilter(params);
  }, [params]);
  // Выдача и её статус — состояние экрана: зависят только от фильтров в адресе.
  const [result, setResult] = useState<CandidateSearchResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [inviting, setInviting] = useState<CandidateSnapshot | null>(null);
  const [inviteOpened, setInviteOpened] = useState(false);

  // Номер последнего запроса: ответ на старые фильтры, пришедший позже нового, не перетрёт выдачу.
  const latest = useRef(0);

  const search = useCallback(() => {
    const id = ++latest.current;
    void employer.searchCandidates(filter, {
      onSuccess: (found) => {
        if (id === latest.current) {
          setResult(found);
        }
      },
      onError: () => {
        if (id === latest.current) {
          setFailed(true);
        }
      },
    });
  }, [employer, filter]);

  // Фильтры в адресе поменялись — ищем заново.
  useEffect(() => {
    search();
  }, [search]);

  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <Stack gap={4}>
        <Title order={2}>Поиск по банку кандидатов</Title>
        <Text c="dimmed" size="sm">
          Все кандидаты биржи с подтверждённым грейдом. Имя и контакты
          откроются, когда кандидат примет приглашение.
        </Text>
      </Stack>

      <SearchFilters
        value={params}
        onChange={(patch) => {
          void setParams(patch);
        }}
        onReset={() => {
          void setParams(null);
        }}
      />

      {failed && !result ? (
        <ErrorScreen
          title="Поиск не ответил"
          onReload={() => {
            setFailed(false);
            search();
          }}
        />
      ) : null}

      {result ? (
        <>
          <Text size="sm" c="dimmed">
            {result.total > result.items.length
              ? `Найдено ${result.total}, показаны первые ${candidateSearchLimit}: уточните фильтры`
              : `Найдено ${result.total}`}
          </Text>

          {result.items.length === 0 ? (
            <Paper withBorder radius="md" p="xl">
              <EmptyState
                title="Под эти фильтры никого нет"
                description="Уберите часть навыков или добавьте соседний грейд."
              />
            </Paper>
          ) : (
            <Stack gap="md">
              {result.items.map((candidate) => {
                return (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    invitation={invitations.latestFor(candidate.id)}
                    canInvite={!invitations.hasActive(candidate.id)}
                    onInvite={() => {
                      setInviting(candidate);
                      setInviteOpened(true);
                    }}
                  />
                );
              })}
            </Stack>
          )}
        </>
      ) : null}

      <InviteModal
        candidate={inviting}
        opened={inviteOpened}
        need={null}
        onClose={() => {
          setInviteOpened(false);
        }}
      />
    </Stack>
  );
});
