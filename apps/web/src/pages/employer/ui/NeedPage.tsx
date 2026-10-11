import { useCallback, useEffect, useState } from "react";

import { useRootStore } from "@/app/store/store-context";
import { inCategories } from "@/pages/employer/model/categories";
import { needFilterParsers } from "@/pages/employer/model/need-filters";
import { applyRefinements } from "@/pages/employer/model/refinements";
import { BackToNeeds } from "@/pages/employer/ui/BackToNeeds";
import { CategoryBar } from "@/pages/employer/ui/CategoryBar";
import { DeleteNeedModal } from "@/pages/employer/ui/DeleteNeedModal";
import { DismissedList } from "@/pages/employer/ui/DismissedList";
import { InviteModal } from "@/pages/employer/ui/InviteModal";
import { MatchCard } from "@/pages/employer/ui/MatchCard";
import { NeedSummary } from "@/pages/employer/ui/NeedSummary";
import { RefinementBar } from "@/pages/employer/ui/RefinementBar";
import { ErrorScreen } from "@/shared/error/ui/ErrorScreen";
import { ROUTES, needEditPath } from "@/shared/router/routes";
import { pageSeo } from "@/shared/seo/pages";
import { usePageSeo } from "@/shared/seo/use-page-seo";
import {
  Button,
  EmptyState,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useQueryStates } from "nuqs";
import { Link, Navigate, useParams } from "react-router";

import type { CandidateSnapshot } from "@hh/contracts";

export const NeedPage = observer(() => {
  const { needId = "" } = useParams();
  const { employer, invitations } = useRootStore();
  const [{ refinements, grades }, setFilters] = useQueryStates(
    needFilterParsers,
    { history: "replace" },
  );
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [inviting, setInviting] = useState<CandidateSnapshot | null>(null);
  const [inviteOpened, setInviteOpened] = useState(false);
  // id потребности, чья подборка не загрузилась. Ставится только из onError.
  const [failedId, setFailedId] = useState<string | null>(null);

  const need = employer.needById(needId);
  const needExists = need !== null;
  usePageSeo(pageSeo.need(need?.title));
  const shortlist = employer.shortlists.get(needId);

  const loadShortlist = useCallback(() => {
    void employer.loadShortlist(needId, {
      onError: () => {
        setFailedId(needId);
      },
    });
  }, [employer, needId]);

  // Зависим от id, а не от объекта: после перезапроса списка объект новый, подборка та же.
  useEffect(() => {
    if (needExists) {
      loadShortlist();
    }
  }, [needExists, loadShortlist]);

  if (!need) {
    return <Navigate to={ROUTES.EMPLOYER.NEEDS} replace />;
  }

  const items = shortlist?.items ?? [];
  const active = items.filter((match) => {
    return !match.dismissed;
  });
  const dismissed = items.filter((match) => {
    return match.dismissed;
  });
  // Выбор категорий живёт дольше подборки: после правки потребности грейд мог выпасть.
  const categories = shortlist?.categories ?? [];
  const pickedGrades = grades.filter((grade) => {
    return categories.some((category) => {
      return category.grade === grade && category.candidateCount > 0;
    });
  });
  const inPicked = inCategories(active, pickedGrades);
  const visible = applyRefinements(inPicked, refinements);

  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <Stack gap={4}>
        <BackToNeeds />
        <Group justify="space-between" align="flex-start" gap="sm">
          <Title order={2}>{need.title}</Title>
          <Group gap="xs">
            <Button
              variant="default"
              size="xs"
              component={Link}
              to={needEditPath(need.id)}
            >
              Изменить
            </Button>
            <Button
              variant="default"
              size="xs"
              onClick={() => {
                setDeleteOpened(true);
              }}
            >
              Удалить
            </Button>
          </Group>
        </Group>
      </Stack>

      <NeedSummary need={need} />

      {failedId === needId && !shortlist ? (
        <ErrorScreen
          title="Подборка не загрузилась"
          onReload={() => {
            setFailedId(null);
            loadShortlist();
          }}
        />
      ) : null}

      {shortlist ? (
        <>
          <CategoryBar
            specialization={need.specialization}
            categories={categories}
            value={pickedGrades}
            onChange={(value) => {
              void setFilters({ grades: value });
            }}
          />

          <RefinementBar
            value={refinements}
            onChange={(value) => {
              void setFilters({ refinements: value });
            }}
            shown={visible.length}
            total={active.length}
          />

          {visible.length === 0 ? (
            <Paper withBorder radius="md" p="xl">
              <EmptyState
                title={
                  active.length === 0
                    ? "Под эти требования пока никого нет"
                    : "Уточнения скрыли всех кандидатов"
                }
                description={
                  active.length === 0
                    ? "Попробуйте расширить диапазон грейдов или убрать часть обязательных навыков."
                    : "Снимите часть фильтров — подборка никуда не делась."
                }
              />
            </Paper>
          ) : (
            <Stack gap="md">
              {visible.map((match) => {
                return (
                  <MatchCard
                    key={match.candidate.id}
                    match={match}
                    rank={active.indexOf(match) + 1}
                    invitation={invitations.latestFor(match.candidate.id)}
                    canInvite={!invitations.hasActive(match.candidate.id)}
                    onInvite={() => {
                      setInviting(match.candidate);
                      setInviteOpened(true);
                    }}
                    onDismiss={() => {
                      void employer.setDismissed(
                        need.id,
                        match.candidate.id,
                        true,
                      );
                    }}
                    onFavorite={() => {
                      void employer.setFavorite(
                        need.id,
                        match.candidate.id,
                        !match.favorite,
                      );
                    }}
                  />
                );
              })}
            </Stack>
          )}

          <DismissedList
            matches={dismissed}
            onRestore={(candidateId) => {
              void employer.setDismissed(need.id, candidateId, false);
            }}
          />

          <Text size="xs" c="dimmed">
            Модель ранжирования: {shortlist.modelVersion}
          </Text>
        </>
      ) : null}

      <DeleteNeedModal
        need={need}
        opened={deleteOpened}
        onClose={() => {
          setDeleteOpened(false);
        }}
      />

      <InviteModal
        candidate={inviting}
        opened={inviteOpened}
        need={need}
        onClose={() => {
          setInviteOpened(false);
        }}
      />
    </Stack>
  );
});
