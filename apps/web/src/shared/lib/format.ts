const dates = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const years = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

export function formatYears(value: number): string {
  // Для дробного числа русский берёт форму «года»: «2,5 года».
  if (!Number.isInteger(value)) {
    return `${years.format(value)} года`;
  }
  const lastTwo = value % 100;
  const last = value % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${value} лет`;
  }
  if (last === 1) {
    return `${value} год`;
  }
  if (last >= 2 && last <= 4) {
    return `${value} года`;
  }
  return `${value} лет`;
}

export function formatDate(iso: string): string {
  return dates.format(new Date(iso));
}
