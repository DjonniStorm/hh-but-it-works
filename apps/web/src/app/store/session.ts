// Раньше сессия целиком, с refresh-токеном, лежала в localStorage (#25).
// Теперь refresh в HttpOnly-cookie, а остаток прежней записи стираем при загрузке.
const legacySessionKey = "hh.session";

export function forgetStoredSession(): void {
  try {
    // У тех, кто входил до перехода на cookie, здесь остался refresh-токен.
    // Новая версия его не читает, а стираем, чтобы он не лежал доступным из JS.
    localStorage.removeItem(legacySessionKey);
  } catch {
    // Хранилище закрыто (приватный режим, запрет cookie): стирать нечего.
  }
}
