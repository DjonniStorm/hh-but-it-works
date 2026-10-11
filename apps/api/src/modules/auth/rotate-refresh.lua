-- Забрать refresh-токен и оставить на него короткое окно, либо найти его в окне.
-- Атомарно: отдельные GETDEL и SET дали бы второму из параллельных запросов
-- промежуток, где токена уже нет, а окна ещё нет.
-- KEYS[1] — refresh:<hash>, KEYS[2] — refresh-grace:<hash>, ARGV[1] — окно в секундах.
-- Ответ: {userId, "rotated"} | {userId, "grace"} | nil.
local userId = redis.call("GETDEL", KEYS[1])
if userId then
  redis.call("SET", KEYS[2], userId, "EX", ARGV[1])
  return {userId, "rotated"}
end
local graced = redis.call("GET", KEYS[2])
if graced then
  return {graced, "grace"}
end
return nil
