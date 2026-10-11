import { useEffect, useRef } from "react";

// 10 секунд: на демо ответ виден почти сразу, а нагрузка на API ещё мала.
export const pollIntervalMs = 10_000;

// Общий опрос: тик каждые intervalMs, пока вкладка видна. Скрытая вкладка не опрашивает,
// при возврате на неё или в окно обновляем сразу.
export function usePolling(
  tick: () => void,
  intervalMs: number,
  enabled = true,
): void {
  const latest = useRef(tick);
  useEffect(() => {
    latest.current = tick;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let timer: number | null = null;

    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const start = () => {
      stop();
      timer = window.setInterval(() => {
        latest.current();
      }, intervalMs);
    };
    const resume = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      latest.current();
      start();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        resume();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") {
      start();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", resume);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", resume);
    };
  }, [enabled, intervalMs]);
}
