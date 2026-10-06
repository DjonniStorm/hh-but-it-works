import { useCallback, useEffect, useRef, useState } from "react";

import { useRootStore } from "@/app/store/store-context";

import { IntegrityFlag } from "@hh/types";

import { sendEvents } from "./run-attempt";

type ClientFlag =
  | IntegrityFlag.TabHidden
  | IntegrityFlag.WindowBlur
  | IntegrityFlag.FullscreenExit
  | IntegrityFlag.FullscreenDenied
  | IntegrityFlag.Copy;

// Повторное копирование в пределах паузы — одно событие, не десять.
const copyPauseMs = 2000;

export type IntegrityWatch = {
  // Был полноэкранный режим и кандидат из него вышел: вопрос прячем до возврата.
  fullscreenLost: boolean;
  enterFullscreen: () => void;
};

// attemptId есть, пока попытка открыта. Слушаем уходы только во время вопросов.
export function useIntegrityWatch(
  attemptId: string | null,
  watching: boolean,
): IntegrityWatch {
  const root = useRootStore();
  const [fullscreenLost, setFullscreenLost] = useState(false);
  const wasFullscreen = useRef(false);
  const deniedSent = useRef(false);

  const report = useCallback(
    (type: ClientFlag, durationMs?: number) => {
      if (!attemptId) {
        return;
      }
      void sendEvents(root, {
        attemptId,
        events: [{ type, durationMs }],
      }).catch(() => {
        return undefined;
      });
    },
    [attemptId, root],
  );

  const enterFullscreen = useCallback(() => {
    const target = document.documentElement;
    if (!target.requestFullscreen) {
      return;
    }
    target
      .requestFullscreen()
      .then(() => {
        wasFullscreen.current = true;
        setFullscreenLost(false);
      })
      .catch(() => {
        setFullscreenLost(false);
        if (!deniedSent.current) {
          deniedSent.current = true;
          report(IntegrityFlag.FullscreenDenied);
        }
      });
  }, [report]);

  useEffect(() => {
    if (!attemptId || !watching) {
      return;
    }
    let awaySince: number | null = null;
    let hidden = false;
    let lastCopy = 0;

    const comeBack = () => {
      if (awaySince === null) {
        return;
      }
      const duration = Date.now() - awaySince;
      report(
        hidden ? IntegrityFlag.TabHidden : IntegrityFlag.WindowBlur,
        duration,
      );
      awaySince = null;
      hidden = false;
    };
    const onBlur = () => {
      awaySince = awaySince ?? Date.now();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hidden = true;
        awaySince = awaySince ?? Date.now();
      } else {
        comeBack();
      }
    };
    const onFullscreen = () => {
      if (document.fullscreenElement) {
        wasFullscreen.current = true;
        setFullscreenLost(false);
        return;
      }
      if (wasFullscreen.current) {
        setFullscreenLost(true);
        report(IntegrityFlag.FullscreenExit);
      }
    };
    const onCopy = (event: Event) => {
      event.preventDefault();
      if (Date.now() - lastCopy > copyPauseMs) {
        lastCopy = Date.now();
        report(IntegrityFlag.Copy);
      }
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", comeBack);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("contextmenu", onCopy);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", comeBack);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("contextmenu", onCopy);
    };
  }, [attemptId, watching, report]);

  // Попытка закончилась — выходим из полноэкранного режима сами, без флага.
  useEffect(() => {
    if (attemptId) {
      return;
    }
    wasFullscreen.current = false;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        return undefined;
      });
    }
  }, [attemptId]);

  return {
    fullscreenLost: fullscreenLost && attemptId !== null,
    enterFullscreen,
  };
}
