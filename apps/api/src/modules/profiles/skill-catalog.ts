/** Наш каталог. Федерация такие технологии не отдаёт. */
export const skillCatalog = [
  { slug: "postgresql", title: "PostgreSQL" },
  { slug: "http-api", title: "HTTP и API" },
  { slug: "typescript", title: "TypeScript" },
  { slug: "docker", title: "Docker" },
  { slug: "testing", title: "Тестирование" },
] as const;

export function slugFromTitle(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      // Символы, которые различают навыки: без них C, C++ и C# дали бы один slug «c».
      .replace(/\+/g, "plus")
      .replace(/#/g, "sharp")
      .replace(/^\./, "dot")
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}-]+/gu, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64)
  );
}
