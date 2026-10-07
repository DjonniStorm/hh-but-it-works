/**
 * Lua-скрипты стора попыток. Redis выполняет скрипт целиком, без чужих команд посередине:
 * так проверка id попытки и запись идут одним шагом.
 * KEYS[1] — ключ попытки, KEYS[2] — список её событий, ARGV[1] — id попытки.
 */

// Все записи сверяют id: завершённую попытку не воскрешают, новую (того же человека) не трогают.
const sameAttempt = `
local function same(raw, id)
  if not raw then
    return false
  end
  local ok, attempt = pcall(cjson.decode, raw)
  return ok and type(attempt) == "table" and attempt.id == id
end
`;

export const updateScript = `${sameAttempt}
if not same(redis.call("GET", KEYS[1]), ARGV[1]) then
  return 0
end
redis.call("SET", KEYS[1], ARGV[2], "KEEPTTL")
return 1
`;

// Попытку и её события забираем одним шагом: событие не потеряется между чтением и удалением.
export const takeScript = `${sameAttempt}
local raw = redis.call("GET", KEYS[1])
if not same(raw, ARGV[1]) then
  return false
end
local events = redis.call("LRANGE", KEYS[2], 0, -1)
redis.call("DEL", KEYS[1], KEYS[2])
return { raw, events }
`;

// После finish событие не примем: иначе оно легло бы в список, который никто не прочитает.
export const pushEventsScript = `${sameAttempt}
if not same(redis.call("GET", KEYS[1]), ARGV[1]) then
  return 0
end
local room = tonumber(ARGV[2]) - redis.call("LLEN", KEYS[2])
local count = math.min(room, #ARGV - 3)
if count <= 0 then
  return 0
end
for i = 4, count + 3 do
  redis.call("RPUSH", KEYS[2], ARGV[i])
end
redis.call("EXPIRE", KEYS[2], ARGV[3])
return count
`;
