// Зарплата в одном виде на сайте и в письмах API.
const rubles = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function formatSalary(from: number, to: number): string {
  return `${rubles.format(from)} – ${rubles.format(to)} ₽`;
}

export function formatSalaryFrom(from: number): string {
  return `от ${rubles.format(from)} ₽`;
}
