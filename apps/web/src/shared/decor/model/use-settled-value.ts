import { useEffect, useState } from "react";

// Ввод меняется каждым символом, а фон пересобирать на каждый символ — дёргано:
// держим «успокоившееся» значение. Возвращает само значение, НЕ массив:
// const settled = useSettledValue(x), без деструктуризации.
export function useSettledValue<T>(value: T, delay = 700): T {
  const [settled, setSettled] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSettled(value);
    }, delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [delay, value]);

  return settled;
}
