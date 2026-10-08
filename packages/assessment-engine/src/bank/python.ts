import type { Template } from "../types";
import {
  Junior,
  Middle,
  Senior,
  code,
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

export const python: Template[] = [
  single(
    { id: "py-indent", topic: "indent", grades: J, difficulty: 1 },
    "Чем в Python задают вложенность блока?",
    "Отступом в начале строки",
    ["Фигурными скобками", "Ключевым словом begin", "Точкой с запятой"],
  ),
  code(
    { id: "py-list", topic: "list", grades: J, difficulty: 1 },
    "python",
    "Что напечатает код?",
    "nums = [1, 2]\nnums.append(3)\nprint(len(nums))",
    "3",
    ["2", "1", "Ошибку: список нельзя менять"],
  ),
  single(
    { id: "py-dict", topic: "dict", grades: J, difficulty: 1 },
    "Как достать значение по ключу name, если ключа может не быть?",
    'user.get("name")',
    ['user["name"] всегда вернёт None', "user.name", "user.find(name)"],
  ),
  numeric(
    { id: "py-for", topic: "for", grades: J, difficulty: 1 },
    "Сколько раз выполнится тело цикла for i in range(2, 6)?",
    4,
  ),
  code(
    { id: "py-slice", topic: "slice", grades: J, difficulty: 1 },
    "python",
    "Чему равен результат?",
    "word = 'python'\nprint(word[0:3])",
    "pyt",
    ["pyth", "yth", "python"],
  ),
  single(
    { id: "py-str", topic: "str", grades: J, difficulty: 1 },
    "Что делает метод строки strip()?",
    "Убирает пробельные символы по краям",
    [
      "Удаляет все пробелы внутри строки",
      "Переводит строку в нижний регистр",
      "Делит строку по пробелам",
    ],
  ),
  single(
    { id: "py-types-basic", topic: "types-basic", grades: J, difficulty: 1 },
    "Какой тип у значения 3.5?",
    "float",
    ["int", "decimal", "number"],
  ),
  single(
    { id: "py-none", topic: "none", grades: J, difficulty: 1 },
    "Чему равен результат функции, которая ничего не возвращает?",
    "None",
    ["0", "undefined", "пустой строке"],
  ),
  single(
    { id: "py-bool", topic: "bool", grades: J, difficulty: 1 },
    "Какие значения в условии считаются ложью?",
    "False, None, 0 и пустые коллекции",
    ["Только False", "Любое отрицательное число", "Строка 'false'"],
  ),
  code(
    {
      id: "py-comprehension",
      topic: "comprehension",
      grades: JM,
      difficulty: 2,
    },
    "python",
    "Что получится?",
    "nums = [1, 2, 3]\nprint([n * 2 for n in nums if n > 1])",
    "[4, 6]",
    ["[2, 4, 6]", "[1, 2]", "[2, 3]"],
  ),
  single(
    { id: "py-exceptions", topic: "exceptions", grades: JM, difficulty: 2 },
    "Когда выполняется блок finally?",
    "И если исключение было, и если его не было",
    [
      "Только если исключение поймали",
      "Только если исключения не было",
      "Только при return из try",
    ],
  ),
  single(
    { id: "py-modules", topic: "modules", grades: JM, difficulty: 2 },
    "Чем import math отличается от from math import sqrt?",
    "В первом случае имя sqrt доступно как math.sqrt, во втором — как sqrt",
    [
      "Первый импорт быстрее",
      "Второй копирует весь модуль в память дважды",
      "Разницы нет: оба кладут в область видимости имя math",
    ],
  ),
  single(
    { id: "py-venv", topic: "venv", grades: M, difficulty: 2 },
    "Зачем проекту своё виртуальное окружение?",
    "Зависимости проекта не смешиваются с пакетами системы и других проектов",
    [
      "Код выполняется быстрее",
      "Интерпретатор обновляется сам",
      "Файлы .py компилируются в один бинарник",
    ],
  ),
  single(
    { id: "py-decorator", topic: "decorator", grades: M, difficulty: 2 },
    "Что делает декоратор функции?",
    "Принимает функцию и возвращает новую, обычно оборачивая вызов",
    [
      "Запрещает вызывать функцию повторно",
      "Делает все аргументы именованными",
      "Переводит функцию в другой модуль",
    ],
  ),
  single(
    { id: "py-dataclass", topic: "dataclass", grades: M, difficulty: 2 },
    "Что dataclass генерирует для класса сам?",
    "__init__ и сравнение по полям",
    [
      "Только строковое представление и ничего больше",
      "Схему базы данных",
      "Асинхронный цикл событий",
    ],
  ),
  single(
    {
      id: "py-pytest-assert",
      topic: "pytest-assert",
      grades: M,
      difficulty: 2,
    },
    "Как в pytest проверяют ожидание?",
    "Обычным assert",
    [
      "Только методом self.assertEqual",
      "Только декоратором @expect",
      "Возвратом True из теста",
    ],
  ),
  single(
    { id: "py-pathlib", topic: "pathlib", grades: M, difficulty: 2 },
    "Чем Path из pathlib удобнее склейки строк с os.path?",
    "Путь — объект, части соединяют оператором /",
    [
      "Он работает только в Windows",
      "Он не умеет проверять, что файл есть",
      "Он читает файл целиком при создании Path",
    ],
  ),
  single(
    { id: "py-logging", topic: "logging", grades: M, difficulty: 2 },
    "Почему в библиотеке лучше logging, а не print?",
    "Вызывающий код выбирает уровень и куда писать, не меняя библиотеку",
    [
      "print не виден в отладчике",
      "logging пишет только в файл",
      "print запрещён в Python 3",
    ],
  ),
  single(
    { id: "py-gil", topic: "gil", grades: MS, difficulty: 3 },
    "Что GIL ограничивает в CPython?",
    "Одновременное исполнение байткода Python несколькими потоками",
    [
      "Число процессов на машине",
      "Импорт модулей из разных пакетов",
      "Размер списка в памяти",
    ],
  ),
  single(
    { id: "py-async", topic: "async-await", grades: MS, difficulty: 3 },
    "Чем корутина отличается от обычного вызова в async-функции?",
    "await отдаёт управление циклу, пока операция ждёт, поток при этом не блокируется ожиданием сокета",
    [
      "await запускает функцию в новом процессе",
      "await компилирует функцию в C",
      "async-функция выполняется раньше остального кода всегда",
    ],
  ),
  single(
    { id: "py-protocol", topic: "typing-protocol", grades: MS, difficulty: 3 },
    "Что проверяет typing.Protocol?",
    "Структурную совместимость: у объекта есть нужные методы, наследование не требуется",
    [
      "Что класс записан в реестр ABC",
      "Что все поля сериализуются в JSON",
      "Что модуль импортирован ровно один раз",
    ],
  ),
  single(
    { id: "py-descriptor", topic: "descriptor", grades: S, difficulty: 3 },
    "Когда вызывается __get__ дескриптора?",
    "При чтении атрибута через экземпляр или класс",
    [
      "Только при удалении объекта",
      "Только в декораторе @property у модуля",
      "При каждом вызове print",
    ],
  ),
  single(
    { id: "py-metaclass", topic: "metaclass", grades: S, difficulty: 3 },
    "Что создаёт метакласс?",
    "Сам класс: class является вызовом метакласса",
    [
      "Экземпляр без __init__",
      "Виртуальное окружение",
      "Байтовый код всего процесса",
    ],
  ),
  single(
    { id: "py-mp", topic: "multiprocessing", grades: S, difficulty: 3 },
    "Зачем multiprocessing, если уже есть потоки?",
    "Процессы обходят GIL и правда считают на разных ядрах",
    [
      "Процессы делят один список без копирования всегда",
      "Потоки в Python запрещены",
      "multiprocessing быстрее для любого ожидания сети",
    ],
  ),
  single(
    { id: "py-memory", topic: "memory", grades: S, difficulty: 3 },
    "Почему большой список целых чисел тяжелее, чем array из модуля array?",
    "Каждый int — отдельный объект с заголовком, array хранит числа плотнее",
    [
      "Список всегда копируется при чтении индекса",
      "array запрещён в 64-битной сборке",
      "int в списке хранится как строка",
    ],
  ),
  multi(
    { id: "py-abc", topic: "abc", grades: S, difficulty: 3 },
    "Зачем ABC с @abstractmethod?",
    [
      "Экземпляр нельзя создать, пока абстрактные методы не реализованы",
      "Наследник обязан объявить эти методы",
    ],
    ["ABC ускоряет вызов методов", "ABC отключает GIL"],
  ),
  order(
    { id: "py-cm", topic: "context-manager", grades: S, difficulty: 3 },
    "В каком порядке живёт with для файла?",
    ["Войти в __enter__", "Выполнить тело", "Вызвать __exit__ даже при ошибке"],
  ),
  single(
    { id: "py-generator", topic: "generator", grades: S, difficulty: 3 },
    "Чем генератор отличается от функции, которая возвращает список?",
    "Значения отдаются по одному и не держат всю последовательность в памяти",
    [
      "Генератор можно вызвать только один раз в процессе",
      "yield запрещён внутри цикла",
      "Генератор всегда выполняется в другом потоке",
    ],
  ),
  code(
    { id: "py-match", topic: "match", grades: S, difficulty: 3 },
    "python",
    "Что вернёт функция?",
    "def label(n):\n    match n:\n        case 0:\n            return 'zero'\n        case _:\n            return 'other'\nprint(label(0))",
    "zero",
    ["other", "None", "Ошибку: match нет в Python"],
  ),
  single(
    { id: "py-importlib", topic: "importlib", grades: S, difficulty: 3 },
    "Когда уместен importlib.import_module?",
    "Имя модуля становится известно только во время выполнения",
    [
      "Чтобы обойти синтаксическую ошибку в модуле",
      "Чтобы импорт не кэшировался никогда",
      "Вместо любого обычного import",
    ],
  ),
];
