import type { Template } from "../types";
import { Junior, Middle, Senior, numeric, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

export const pandas: Template[] = [
  single(
    { id: "pd-frame", topic: "frame", grades: J, difficulty: 1 },
    "Чем DataFrame отличается от Series?",
    "DataFrame — таблица, Series — один столбец",
    [
      "Series — таблица, DataFrame — одна ячейка",
      "Оба всегда одно число",
      "DataFrame не хранит строки, только имена столбцов",
    ],
  ),
  single(
    { id: "pd-read", topic: "read-csv", grades: J, difficulty: 1 },
    "Чем прочитать CSV в таблицу?",
    "pd.read_csv",
    ["pd.open_csv", "pd.load_table только для JSON", "DataFrame.read"],
  ),
  single(
    { id: "pd-col", topic: "column", grades: J, difficulty: 1 },
    "Как получить столбец city?",
    'df["city"]',
    ["df.column(city)", "df.get_col city", "city(df)"],
  ),
  single(
    { id: "pd-head", topic: "head", grades: J, difficulty: 1 },
    "Сколько строк показывает head() без аргумента?",
    "Первые 5",
    ["Первую", "Все строки", "Последние 5"],
  ),
  numeric(
    { id: "pd-shape", topic: "shape", grades: J, difficulty: 1 },
    "Сколько строк в таблице?",
    3,
    {
      lang: "python",
      code: 'import pandas as pd\ndf = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})',
    },
  ),
  numeric(
    { id: "pd-count", topic: "count", grades: J, difficulty: 1 },
    "Чему равен s.count()?",
    2,
    {
      lang: "python",
      code: "import pandas as pd\ns = pd.Series([1, None, 3])",
    },
  ),
  single(
    { id: "pd-isna", topic: "isna", grades: J, difficulty: 1 },
    "Что отмечает isna()?",
    "Пропуски",
    [
      "Дубликаты строк",
      "Столбцы со строковым типом",
      "Индекс, который идёт не с нуля",
    ],
  ),
  single(
    { id: "pd-dropna", topic: "missing", grades: JM, difficulty: 2 },
    "Чем dropna отличается от fillna?",
    "dropna убирает строки с пропусками, fillna подставляет значение вместо пропуска",
    [
      "fillna удаляет столбцы, dropna ничего не меняет",
      "dropna заменяет пропуск нулём, fillna удаляет таблицу",
      "Оба переводят все столбцы в строки",
    ],
  ),
  numeric(
    { id: "pd-mask", topic: "mask", grades: JM, difficulty: 2 },
    "Сколько строк попадёт в rows?",
    2,
    {
      lang: "python",
      code: 'import pandas as pd\ndf = pd.DataFrame({"age": [10, 20, 30]})\nrows = df[df["age"] > 15]',
    },
  ),
  single(
    { id: "pd-loc", topic: "loc-iloc", grades: JM, difficulty: 2 },
    "Чем loc отличается от iloc?",
    "loc выбирает по меткам, iloc — по позиции",
    [
      "loc — по позиции, iloc — по меткам",
      "Оба всегда берут последнюю строку",
      "iloc умеет только столбцы, loc — только строки",
    ],
  ),
  numeric(
    { id: "pd-iloc", topic: "iloc", grades: M, difficulty: 2 },
    "Чему равен s.iloc[0]?",
    10,
    {
      lang: "python",
      code: "import pandas as pd\ns = pd.Series([10, 20, 30], index=[2, 1, 0])",
    },
  ),
  numeric(
    { id: "pd-loc-label", topic: "loc", grades: M, difficulty: 2 },
    "Чему равен s.loc[0]?",
    30,
    {
      lang: "python",
      code: "import pandas as pd\ns = pd.Series([10, 20, 30], index=[2, 1, 0])",
    },
  ),
  single(
    { id: "pd-groupby", topic: "groupby", grades: M, difficulty: 2 },
    "Что делает groupby перед агрегатом?",
    "Делит строки по ключу, агрегат считается внутри группы",
    [
      "Сортирует таблицу и группы не строит",
      "Удаляет ключ из таблицы",
      "Соединяет таблицу саму с собой",
    ],
  ),
  single(
    { id: "pd-merge", topic: "merge", grades: M, difficulty: 2 },
    "Что оставляет merge(..., how='left')?",
    "Все строки левой таблицы. Где справа нет пары, значения пустые",
    [
      "Только строки, которые нашлись справа",
      "Все строки правой таблицы, левая может потерять строки",
      "Декартово произведение без ключа",
    ],
  ),
  single(
    { id: "pd-copy", topic: "copy", grades: MS, difficulty: 2 },
    "Зачем df.copy() с deep=True, значением по умолчанию?",
    "Правка копии не меняет исходную таблицу",
    [
      "Копия всегда смотрит в те же данные, правка видна в обеих",
      "copy удаляет пропуски",
      "copy переводит таблицу в CSV",
    ],
  ),
  single(
    { id: "pd-apply", topic: "apply", grades: MS, difficulty: 3 },
    "Почему построчный apply обычно хуже операции над столбцом?",
    "Он вызывает Python на каждой строке и проигрывает векторному счёту по столбцу",
    [
      "apply не умеет читать значения строк",
      "Векторная операция по столбцу всегда падает с ошибкой типа",
      "apply обязателен: иначе столбец нельзя сложить с числом",
    ],
  ),
  numeric(
    { id: "pd-align", topic: "align", grades: S, difficulty: 3 },
    "Чему равен (a + b).loc['x']?",
    21,
    {
      lang: "python",
      code: 'import pandas as pd\na = pd.Series([1, 2], index=["x", "y"])\nb = pd.Series([10, 20], index=["y", "x"])',
    },
  ),
  single(
    { id: "pd-chunk", topic: "chunksize", grades: S, difficulty: 3 },
    "Зачем read_csv параметр chunksize?",
    "Читать файл частями, не собирая его целиком в память",
    [
      "Сжать файл на диске",
      "Прочитать только заголовок и пропустить данные",
      "Запретить пропуски в файле",
    ],
  ),
  single(
    { id: "pd-transform", topic: "transform", grades: S, difficulty: 3 },
    "Чем transform после groupby отличается от agg?",
    "transform возвращает результат той же длины, что исходные строки. agg схлопывает группу в одно значение",
    [
      "agg сохраняет каждую строку, transform оставляет одну строку на группу",
      "Оба всегда возвращают одно число на всю таблицу",
      "transform работает только без groupby",
    ],
  ),
  single(
    { id: "pd-chained", topic: "chained-assign", grades: S, difficulty: 3 },
    'Почему df[df["a"] > 0]["b"] = 1 не меняет df надёжно?',
    'Это две индексации подряд: запись уходит во временный объект, а не в df. Надёжно — df.loc[df["a"] > 0, "b"] = 1',
    [
      "Маска по столбцу a запрещает менять столбец b",
      "Присваивание числа меняет только первую строку под маской",
      "pandas копит запись и применяет её только после df.commit()",
    ],
  ),
  single(
    { id: "pd-category", topic: "category", grades: S, difficulty: 3 },
    'В столбце миллион строк и десять разных городов. Что даёт astype("category")?',
    "Каждое название хранится один раз, в строках остаются короткие коды, и памяти уходит заметно меньше",
    [
      "Таблица сортируется по городу, повторы строк удаляются",
      "Названия навсегда заменяются числами, вернуть строки уже нельзя",
      "Память не меняется: это только подпись для графиков",
    ],
  ),
  numeric(
    { id: "pd-merge-many", topic: "merge-many", grades: S, difficulty: 3 },
    "Сколько строк в m?",
    4,
    {
      lang: "python",
      code: 'import pandas as pd\nleft = pd.DataFrame({"id": [1, 1, 2]})\nright = pd.DataFrame({"id": [1, 1, 3], "x": [10, 20, 30]})\nm = left.merge(right, on="id")',
    },
  ),
];
