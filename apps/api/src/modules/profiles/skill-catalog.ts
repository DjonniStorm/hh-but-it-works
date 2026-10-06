/** Наш каталог. Федерация такие технологии не отдаёт. */
export const skillCatalog = [
  { slug: "postgresql", title: "PostgreSQL" },
  { slug: "http-api", title: "HTTP и API" },
  { slug: "typescript", title: "TypeScript" },
  { slug: "docker", title: "Docker" },
  { slug: "testing", title: "Тестирование" },
] as const;

export function slugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
