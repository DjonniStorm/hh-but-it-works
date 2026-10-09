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

// exited — вышли на экране теста, off — вернулись к попытке уже без полноэкранного режима.
export type FullscreenPause = "exited" | "off";

// requesting — ждём ответа браузера, unavailable — браузер режим не дал.
type ScreenMode = FullscreenPause | "on" | "requesting" | "unavailable";

export type IntegrityWatch = {
  // Вопрос прячем, пока страница не в полноэкранном режиме.
  pause: FullscreenPause | null;
  enterFullscreen: () => void;
};

function currentMode(): ScreenMode {
  if (typeof document.documentElement.requestFullscreen !== "function") {
    return "unavailable";
  }
  return document.fullscreenElement ? "on" : "off";
}

// attemptId есть, пока попытка открыта. Слушаем уходы только во время вопросов.
export function useIntegrityWatch(
  attemptId: string | null,
  watching: boolean,
): IntegrityWatch {
  const root = useRootStore();
  // Вкладку открыли заново посреди попытки: берём режим у документа, а не считаем, что его не было.
  const [mode, setMode] = useState<ScreenMode>(currentMode);
  const deniedSent = useRef(false);
  const openAttempt = useRef<string | null>(null);

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
    if (typeof target.requestFullscreen !== "function") {
      setMode("unavailable");
      return;
    }
    setMode("requesting");
    target
      .requestFullscreen()
      .then(() => {
        setMode("on");
      })
      .catch(() => {
        setMode("unavailable");
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
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("contextmenu", onCopy);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", comeBack);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("contextmenu", onCopy);
    };
  }, [attemptId, watching, report]);

  // За режимом следим и вне вопросов, иначе выход на плане попытки останется незамеченным.
  useEffect(() => {
    // Событие без fullscreenElement — выход, в том числе по Esc: страница его не запрещает, только видит.
    const onFullscreen = () => {
      if (document.fullscreenElement) {
        setMode("on");
        return;
      }
      if (attemptId && watching) {
        setMode("exited");
        report(IntegrityFlag.FullscreenExit);
        return;
      }
      setMode("off");
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [attemptId, watching, report]);

  // Попытка закончилась — выходим из полноэкранного режима сами, без флага.
  // При открытии вкладки attemptId пуст, пока грузится текущая попытка: тогда режим не трогаем.
  useEffect(() => {
    if (attemptId) {
      openAttempt.current = attemptId;
      return;
    }
    if (openAttempt.current === null) {
      return;
    }
    openAttempt.current = null;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        return undefined;
      });
    }
  }, [attemptId]);

  const paused = mode === "exited" || mode === "off";
  return {
    pause: attemptId !== null && watching && paused ? mode : null,
    enterFullscreen,
  };
}
