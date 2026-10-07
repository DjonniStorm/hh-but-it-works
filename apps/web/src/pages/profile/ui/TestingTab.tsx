import { useEffect, useState } from "react";

import { useRootStore, useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import {
  type ActiveAttempt,
  type AttemptHistory,
  type AttemptResult,
  isFinished,
} from "@/pages/profile/model/attempt";
import {
  finishAttempt,
  loadCurrent,
  loadHistory,
} from "@/pages/profile/model/run-attempt";
import { useIntegrityWatch } from "@/pages/profile/model/use-integrity-watch";
import { TestingHistory } from "@/pages/profile/ui/TestingHistory";
import { TestingLobby } from "@/pages/profile/ui/TestingLobby";
import { TestingPlan } from "@/pages/profile/ui/TestingPlan";
import { TestingResult } from "@/pages/profile/ui/TestingResult";
import { TestingRun } from "@/pages/profile/ui/TestingRun";
import { ScrollArea, Stack } from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

type Phase = "lobby" | "plan" | "run" | "result";

export const TestingTab = ({ profile }: { profile: CandidateProfile }) => {
  const root = useRootStore();
  const profiles = useStore(StoreKey.Profile);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [history, setHistory] = useState<AttemptHistory["items"]>([]);
  const watch = useIntegrityWatch(
    phase === "plan" || phase === "run" ? (attempt?.attemptId ?? null) : null,
    phase === "run",
  );

  const refreshHistory = () => {
    void loadHistory(root, {
      onSuccess: (next) => {
        setHistory(next.items);
      },
    }).catch(() => {
      return undefined;
    });
  };

  const finish = (attemptId: string) => {
    void finishAttempt(root, attemptId, {
      onSuccess: (next) => {
        setAttempt(null);
        setResult(next);
        setPhase("result");
        refreshHistory();
        void profiles.load({ loader: false });
      },
      onError: () => {
        setAttempt(null);
        setPhase("lobby");
      },
    }).catch(() => {
      return undefined;
    });
  };

  const advance = (next: ActiveAttempt) => {
    setAttempt(next);
    if (isFinished(next)) {
      finish(next.attemptId);
      return;
    }
    setPhase("run");
  };

  // Незавершённая попытка переживает перезагрузку: продолжаем с того же вопроса.
  useEffect(() => {
    void loadCurrent(root, {
      onSuccess: (current) => {
        if (current) {
          advance(current);
        }
      },
    }).catch(() => {
      return undefined;
    });
    refreshHistory();
    // Только при открытии вкладки: дальше фазы двигают обработчики.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollArea
      h="100%"
      type="auto"
      offsetScrollbars
      scrollbars="y"
      style={{ minHeight: 0 }}
    >
      <Stack>
        {phase === "lobby" ? (
          <Stack maw={640} gap="lg">
            <TestingLobby
              profile={profile}
              onStarted={(next) => {
                setAttempt(next);
                setPhase("plan");
              }}
            />
            <TestingHistory items={history} />
          </Stack>
        ) : null}
        {phase === "plan" && attempt ? (
          <TestingPlan
            attempt={attempt}
            onBegin={() => {
              watch.enterFullscreen();
              void loadCurrent(root, {
                onSuccess: (current) => {
                  if (current) {
                    advance(current);
                  }
                },
              }).catch(() => {
                return undefined;
              });
            }}
          />
        ) : null}
        {phase === "run" && attempt ? (
          <TestingRun
            attempt={attempt}
            fullscreenLost={watch.fullscreenLost}
            onFullscreen={watch.enterFullscreen}
            onAnswered={advance}
            onStale={() => {
              void loadCurrent(root, {
                onSuccess: (current) => {
                  if (current) {
                    advance(current);
                  } else {
                    setAttempt(null);
                    setPhase("lobby");
                  }
                },
              }).catch(() => {
                return undefined;
              });
            }}
          />
        ) : null}
        {phase === "result" && result ? (
          <TestingResult
            result={result}
            onBack={() => {
              setResult(null);
              setPhase("lobby");
            }}
          />
        ) : null}
      </Stack>
    </ScrollArea>
  );
};
