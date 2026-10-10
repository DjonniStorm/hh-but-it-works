// Раньше сессия целиком, с refresh-токеном, лежала в localStorage (#25).
// Теперь refresh в HttpOnly-cookie, а остаток прежней записи стираем при загрузке.
const legacySessionKey = "hh.session";

export function forgetStoredSession(): void {
  try {
    localStorage.removeItem(legacySessionKey);
  } catch {
    // Хранилище закрыто (приватный режим, запрет cookie): стирать нечего.
  }
}
