import { useEffect, useState } from "react";

import { useRootStore } from "@/app/store/store-context";
import {
  type Refinement,
  applyRefinements,
} from "@/pages/employer/model/refinements";
import { BackToNeeds } from "@/pages/employer/ui/BackToNeeds";
import { DismissedList } from "@/pages/employer/ui/DismissedList";
import { InviteModal } from "@/pages/employer/ui/InviteModal";
import { MatchCard } from "@/pages/employer/ui/MatchCard";
import { NeedSummary } from "@/pages/employer/ui/NeedSummary";
import { RefinementBar } from "@/pages/employer/ui/RefinementBar";
import { ROUTES } from "@/shared/router/routes";
import { EmptyState, Paper, Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Navigate, useParams } from "react-router";

import type { CandidateSnapshot } from "@hh/contracts";

export const NeedPage = observer(() => {
  const { needId = "" } = useParams();
  const { employer, invitations } = useRootStore();
  const [refinements, setRefinements] = useState<Refinement[]>([]);
  const [inviting, setInviting] = useState<CandidateSnapshot | null>(null);

  const need = employer.needById(needId);
  const shortlist = employer.shortlists.get(needId);

  useEffect(() => {
    if (need) {
      void employer.loadShortlist(need.id);
    }
  }, [employer, need]);

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
  const visible = applyRefinements(active, refinements);

  return (
    <Stack gap="lg" maw={1100}>
      <Stack gap={4}>
        <BackToNeeds />
        <Title order={2}>{need.title}</Title>
      </Stack>

      <NeedSummary need={need} />

      {shortlist ? (
        <>
          <RefinementBar
            value={refinements}
            onChange={setRefinements}
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
                    invitation={invitations.byCandidate(match.candidate.id)}
                    onInvite={() => {
                      setInviting(match.candidate);
                    }}
                    onDismiss={() => {
                      void employer.setDismissed(
                        need.id,
                        match.candidate.id,
                        true,
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

      <InviteModal
        candidate={inviting}
        need={need}
        onClose={() => {
          setInviting(null);
        }}
      />
    </Stack>
  );
});
