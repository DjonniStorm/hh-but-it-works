import type { Template } from "../types";
import {
  Junior,
  Middle,
  Senior,
  multi,
  numeric,
  order,
  single,
} from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

export const sql: Template[] = [
  single(
    { id: "sql-select", topic: "select", grades: J, difficulty: 1 },
    "Что делает SELECT?",
    "Возвращает строки и столбцы и не меняет таблицу",
    [
      "Удаляет выбранные строки",
      "Создаёт индекс",
      "Переписывает таблицу на диске",
    ],
  ),
  single(
    { id: "sql-where", topic: "where", grades: J, difficulty: 1 },
    "Что делает WHERE?",
    "Оставляет строки, для которых условие истинно",
    ["Сортирует результат", "Удаляет таблицу", "Считает число столбцов"],
  ),
  single(
    { id: "sql-null", topic: "null", grades: J, difficulty: 1 },
    "Как отобрать строки, где в столбце нет значения?",
    "col IS NULL",
    ["col = NULL", "col = 0", "col = ''"],
  ),
  single(
    { id: "sql-pk", topic: "primary-key", grades: J, difficulty: 1 },
    "Что гарантирует первичный ключ?",
    "Значение одно на строку и не бывает NULL",
    [
      "Значение может повторяться",
      "В столбце разрешено несколько NULL",
      "Ключ нужен только в SELECT и на запись не влияет",
    ],
  ),
  numeric(
    { id: "sql-count-star", topic: "count-star", grades: J, difficulty: 1 },
    "Сколько вернёт запрос?",
    2,
    {
      lang: "sql",
      code: "SELECT COUNT(*) FROM (VALUES (1), (NULL)) AS t(n);",
    },
  ),
  numeric(
    { id: "sql-count-col", topic: "count-column", grades: J, difficulty: 1 },
    "Сколько вернёт запрос?",
    1,
    {
      lang: "sql",
      code: "SELECT COUNT(n) FROM (VALUES (1), (NULL)) AS t(n);",
    },
  ),
  single(
    { id: "sql-distinct", topic: "distinct", grades: J, difficulty: 1 },
    "Что делает DISTINCT?",
    "Убирает из результата одинаковые строки",
    ["Сортирует строки", "Удаляет строки из таблицы", "Оставляет только NULL"],
  ),
  single(
    { id: "sql-like", topic: "like", grades: J, difficulty: 1 },
    "Какие строки подходят под LIKE 'a%'?",
    "Те, что начинаются с a. % — последовательность любой длины",
    [
      "Только строка ровно из двух символов",
      "% здесь — один символ, _ — любая длина",
      "Только строки, где нет буквы a",
    ],
  ),
  single(
    { id: "sql-inner", topic: "inner-join", grades: JM, difficulty: 2 },
    "Какие строки оставляет INNER JOIN?",
    "Только те, для которых условие соединения выполнилось",
    [
      "Все строки обеих таблиц, даже без пары",
      "Все строки левой таблицы, даже без пары",
      "Декартово произведение, условие ON при этом не смотрит",
    ],
  ),
  single(
    { id: "sql-left", topic: "left-join", grades: JM, difficulty: 2 },
    "Что остаётся после LEFT JOIN?",
    "Все строки левой таблицы. У правой без пары — пустые значения",
    [
      "Только совпавшие строки",
      "Все строки правой таблицы, левая может исчезнуть",
      "Строки без пары удаляются из левой таблицы навсегда",
    ],
  ),
  single(
    { id: "sql-group", topic: "group-by", grades: JM, difficulty: 2 },
    "Что делает GROUP BY?",
    "Сворачивает строки с одинаковым ключом, агрегат считается по группе",
    [
      "Только сортирует и ничего не сворачивает",
      "Удаляет из таблицы повторяющиеся ключи",
      "Соединяет две таблицы по ключу",
    ],
  ),
  multi(
    { id: "sql-null-facts", topic: "null-facts", grades: JM, difficulty: 2 },
    "Что верно про NULL?",
    ["IS NULL проверяет пропуск", "COUNT(столбец) не считает NULL"],
    ["col = NULL находит пропуски", "NULL в числе равен нулю"],
  ),
  single(
    { id: "sql-having", topic: "having", grades: M, difficulty: 2 },
    "Чем HAVING отличается от WHERE?",
    "WHERE отбирает строки до группировки, HAVING — группы после неё",
    [
      "Это синонимы",
      "HAVING фильтрует исходные строки и не смотрит на группы",
      "WHERE принимает условия по агрегатам, HAVING — нет",
    ],
  ),
  single(
    { id: "sql-fk", topic: "foreign-key", grades: M, difficulty: 2 },
    "Что требует внешний ключ?",
    "Значение есть в указанном ключе другой таблицы, либо NULL, если столбец это разрешает",
    [
      "Столбец сам становится первичным ключом",
      "База копирует строку во вторую таблицу",
      "Таблицу нельзя читать без JOIN",
    ],
  ),
  single(
    { id: "sql-union", topic: "union", grades: M, difficulty: 2 },
    "Чем UNION отличается от UNION ALL?",
    "UNION убирает повторы, UNION ALL оставляет их",
    [
      "UNION ALL убирает повторы, UNION оставляет",
      "Оба всегда сортируют результат по первому столбцу",
      "UNION соединяет таблицы по ключу, как JOIN",
    ],
  ),
  single(
    { id: "sql-update", topic: "update", grades: M, difficulty: 2 },
    "Что сделает UPDATE без WHERE?",
    "Изменит все строки таблицы",
    [
      "Не выполнится: WHERE обязателен",
      "Изменит только первую строку",
      "Изменит только строки, где столбец NULL",
    ],
  ),
  numeric(
    { id: "sql-inner-count", topic: "inner-count", grades: MS, difficulty: 2 },
    "Сколько строк вернёт запрос?",
    1,
    {
      lang: "sql",
      code: "SELECT COUNT(*) FROM (VALUES (1), (2)) AS a(id)\nINNER JOIN (VALUES (1)) AS b(id) ON a.id = b.id;",
    },
  ),
  numeric(
    { id: "sql-left-count", topic: "left-count", grades: MS, difficulty: 2 },
    "Сколько строк вернёт запрос?",
    2,
    {
      lang: "sql",
      code: "SELECT COUNT(*) FROM (VALUES (1), (2)) AS a(id)\nLEFT JOIN (VALUES (1)) AS b(id) ON a.id = b.id;",
    },
  ),
  single(
    { id: "sql-index", topic: "index", grades: MS, difficulty: 3 },
    "Зачем индекс по столбцу и чем он платит?",
    "Ускоряет поиск по этим столбцам и добавляет работу при записи в них",
    [
      "Ускоряет любую запись и ничего не замедляет",
      "Всегда запрещает дубликаты, даже без UNIQUE",
      "Нужен только чтобы объявить внешний ключ",
    ],
  ),
  single(
    { id: "sql-txn", topic: "transaction", grades: MS, difficulty: 3 },
    "Что значит зафиксировать или откатить транзакцию?",
    "Либо сохраняются все её изменения, либо не сохраняется ни одно",
    [
      "Каждый оператор сразу нельзя отменить и он уже виден всем",
      "Откат убирает только последнюю строку",
      "Транзакция бывает только у SELECT",
    ],
  ),
  single(
    { id: "sql-dirty", topic: "dirty-read", grades: S, difficulty: 3 },
    "Что такое грязное чтение?",
    "Чтение чужих изменений, которые ещё не зафиксированы",
    [
      "Повторное чтение уже зафиксированной строки с новым значением",
      "Новая строка, появившаяся в повторном запросе",
      "Чтение только из индекса, минуя таблицу",
    ],
  ),
  single(
    { id: "sql-phantom", topic: "phantom", grades: S, difficulty: 3 },
    "Чем фантом отличается от неповторяющегося чтения?",
    "Фантом — новая строка в повторном запросе. Неповторяющееся чтение — другая версия уже виденной строки",
    [
      "Это два названия одного явления",
      "Фантом — чтение ещё не зафиксированных данных",
      "Неповторяющееся чтение бывает только вне транзакции",
    ],
  ),
  single(
    { id: "sql-window", topic: "window", grades: S, difficulty: 3 },
    "Чем оконная функция отличается от GROUP BY?",
    "Считает значение по окну и оставляет каждую исходную строку",
    [
      "На группу остаётся одна строка, как у GROUP BY",
      "Убирает дубликаты, как DISTINCT",
      "Работает только в запросе без FROM",
    ],
  ),
  order(
    {
      id: "sql-logical-order",
      topic: "logical-order",
      grades: S,
      difficulty: 3,
    },
    "В каком логическом порядке SQL обрабатывает эти части запроса?",
    ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY"],
  ),
];
