// Адрес реестра для OIDC-входа. Локально мок на 3001, как и у API.
const fspUrl = import.meta.env.VITE_FSP_URL ?? "http://localhost:3001";

// Браузерный «ящик» под state: защита от того, что колбэк откроют напрямую.
const stateKey = "fsp-oidc-state";

// Старт входа: сохраняем state и собираем адрес страницы входа ФСП.
export function fspLoginUrl(): string {
  const state = crypto.randomUUID();
  sessionStorage.setItem(stateKey, state);
  const params = new URLSearchParams({
    client_id: "hh",
    response_type: "code",
    redirect_uri: `${window.location.origin}/profile/fsp-callback`,
    state,
  });
  return `${fspUrl}/authorize?${params.toString()}`;
}

// Колбэк: сверяем state и достаём code. Любая нестыковка — текст для кандидата.
export function fspCallbackCode(
  search: string,
): { code: string } | { error: string } {
  const params = new URLSearchParams(search);
  const state = sessionStorage.getItem(stateKey);
  sessionStorage.removeItem(stateKey);
  if (params.get("error")) {
    return { error: "Реестр ФСП не разрешил вход. Попробуйте ещё раз." };
  }
  if (!state || params.get("state") !== state) {
    return {
      error: "Ссылка входа устарела или её открыли напрямую. Начните заново.",
    };
  }
  const code = params.get("code");
  if (!code) {
    return { error: "Реестр ФСП не вернул код входа. Начните заново." };
  }
  return { code };
}
