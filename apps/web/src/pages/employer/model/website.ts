const scheme = /^[a-z][a-z0-9+.-]*:\/\//i;
const defaultScheme = "https://";

// Пустое поле при фокусе сразу получает схему, чтобы не набирать её руками.
export function websiteOnFocus(value: string): string {
  return value === "" ? defaultScheme : value;
}

// Голая схема без адреса — это пусто, а адрес без схемы получает https://.
export function websiteOnBlur(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "https://" || trimmed === "http://") {
    return "";
  }
  return scheme.test(trimmed) ? trimmed : `${defaultScheme}${trimmed}`;
}
