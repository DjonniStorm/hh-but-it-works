import { useEffect, useRef, useState } from "react";

// Остаток пересчитывается от момента монтирования: часы клиента не участвуют в лимите.
export function useCountdown(seconds: number, onExpire: () => void): number {
  const [left, setLeft] = useState(seconds);
  const expire = useRef(onExpire);

  useEffect(() => {
    expire.current = onExpire;
  });

  useEffect(() => {
    const deadline = Date.now() + seconds * 1000;
    let fired = false;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(next);
      if (next === 0 && !fired) {
        fired = true;
        expire.current();
      }
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => {
      window.clearInterval(timer);
    };
  }, [seconds]);

  return left;
}
