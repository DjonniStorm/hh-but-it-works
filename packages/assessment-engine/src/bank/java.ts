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

export const java: Template[] = [
  single(
    { id: "java-class", topic: "class", grades: J, difficulty: 1 },
    "Где в обычном приложении Java лежит исполняемый класс?",
    "В файле .class, который читает виртуальная машина",
    ["Только в .java на проде", "В одном .exe без JVM", "В скрипте оболочки"],
  ),
  code(
    { id: "java-list", topic: "list", grades: J, difficulty: 1 },
    "java",
    "Чему равен size после кода?",
    "var nums = new ArrayList<Integer>();\nnums.add(1);\nnums.add(2);",
    "2",
    ["0", "1", "3"],
  ),
  single(
    { id: "java-null", topic: "null", grades: J, difficulty: 1 },
    "Что будет при вызове метода у ссылки null?",
    "NullPointerException",
    ["Вернётся 0", "Вернётся пустая строка", "Код не скомпилируется всегда"],
  ),
  single(
    { id: "java-string", topic: "string", grades: J, difficulty: 1 },
    "Почему s.toUpperCase() не меняет s?",
    "String неизменяем, метод возвращает новую строку",
    [
      "toUpperCase ничего не возвращает",
      "Строка меняется, если она в ArrayList",
      "Метод пишет только в лог",
    ],
  ),
  numeric(
    { id: "java-loop", topic: "loop", grades: J, difficulty: 1 },
    "Сколько раз выполнится тело for (int i = 0; i < 5; i++)?",
    5,
  ),
  single(
    { id: "java-package", topic: "package", grades: J, difficulty: 1 },
    "Зачем первая строка package в файле?",
    "Кладёт класс в пространство имён и в соответствующий каталог",
    [
      "Подключает зависимости Maven",
      "Делает класс публичным",
      "Запускает main",
    ],
  ),
  single(
    { id: "java-override", topic: "override", grades: J, difficulty: 1 },
    "Что означает @Override над методом?",
    "Метод заменяет метод предка или интерфейса, иначе компилятор ругнётся",
    [
      "Метод становится статическим",
      "Метод нельзя вызвать",
      "Аннотация нужна только документации",
    ],
  ),
  single(
    { id: "java-equals", topic: "equals", grades: J, difficulty: 1 },
    "Чем equals отличается от == для объектов?",
    "equals сравнивает содержимое, если его так написали, == сравнивает ссылки",
    [
      "Разницы нет",
      "== сравнивает поля, equals — адреса",
      "equals работает только для int",
    ],
  ),
  single(
    { id: "java-array", topic: "array", grades: J, difficulty: 1 },
    "Можно ли изменить длину массива int[] после создания?",
    "Нет, длина фиксирована",
    [
      "Да, методом add",
      "Да, если массив объявлен как var",
      "Да, присваиванием length",
    ],
  ),
  single(
    { id: "java-exception", topic: "exception", grades: JM, difficulty: 2 },
    "Чем проверяемое исключение отличается от RuntimeException?",
    "Проверяемое нужно объявить в throws или поймать, иначе код не соберётся",
    [
      "RuntimeException нельзя поймать",
      "Проверяемое летит только из main",
      "Разницы при компиляции нет",
    ],
  ),
  single(
    { id: "java-interface", topic: "interface", grades: JM, difficulty: 2 },
    "Сколько классов может реализовать один интерфейс?",
    "Сколько угодно",
    [
      "Только один",
      "Только класс из того же пакета",
      "Ни одного: интерфейс сам по себе класс",
    ],
  ),
  single(
    {
      id: "java-generic-list",
      topic: "generic-list",
      grades: JM,
      difficulty: 2,
    },
    "Зачем List<String>, а не сырой List?",
    "Компилятор не даст положить в список не строку",
    [
      "Список начинает хранить примитивы без упаковки всегда",
      "Сырой List быстрее и поэтому рекомендован",
      "Дженерик отключает equals",
    ],
  ),
  single(
    { id: "java-stream", topic: "stream", grades: M, difficulty: 2 },
    "Когда промежуточные операции стрима выполняются?",
    "Когда вызывают завершающую операцию, например collect",
    [
      "Сразу в момент filter",
      "При создании списка-источника",
      "В конструкторе Stream",
    ],
  ),
  single(
    { id: "java-optional", topic: "optional", grades: M, difficulty: 2 },
    "Для чего Optional в возвращаемом значении?",
    "Явно показать, что значения может не быть, вместо null",
    [
      "Ускорить метод",
      "Заменить любое поле класса",
      "Optional.of(null) — обычный способ пустого значения",
    ],
  ),
  single(
    { id: "java-record", topic: "record", grades: M, difficulty: 2 },
    "Что record генерирует сам?",
    "Конструктор, доступ к компонентам, equals и hashCode по компонентам",
    ["Схему таблицы", "Только toString", "Поток виртуальных потоков"],
  ),
  single(
    { id: "java-bean", topic: "spring-bean", grades: M, difficulty: 2 },
    "Кто создаёт бин, если класс помечен @Component, а его просят в конструкторе другого бина?",
    "Контейнер Spring",
    [
      "Оператор new в контроллере",
      "Сборщик мусора",
      "Maven при запуске тестов только",
    ],
  ),
  single(
    { id: "java-annotation", topic: "annotation", grades: M, difficulty: 2 },
    "Когда видна аннотация с RetentionPolicy.RUNTIME?",
    "Её можно прочитать рефлексией у работающей программы",
    [
      "Только в исходнике, в класс она не попадает",
      "Только компилятору, в рантайме её нет",
      "Она исполняется как метод",
    ],
  ),
  single(
    { id: "java-enum", topic: "enum", grades: M, difficulty: 2 },
    "Чем enum в Java отличается от набора int-констант?",
    "Это полноценный тип со своими экземплярами, их конечный набор известен",
    [
      "enum — это строка",
      "Константы enum можно дописать в рантайме",
      "enum нельзя использовать в switch",
    ],
  ),
  single(
    { id: "java-vt", topic: "virtual-thread", grades: MS, difficulty: 3 },
    "Чем виртуальный поток удобен для множества ожиданий сети?",
    "Он дёшев, блокировка сокета не занимает поток операционной системы на всё ожидание",
    [
      "Виртуальный поток считает быстрее на одном ядре всегда",
      "Он заменяет пул для тяжёлого CPU",
      "В нём нельзя вызвать блокирующий API",
    ],
  ),
  single(
    { id: "java-jdbc", topic: "jdbc", grades: MS, difficulty: 3 },
    "Зачем PreparedStatement вместо склейки SQL строкой?",
    "Параметры передаются отдельно, так не собирают запрос из пользовательского текста",
    [
      "Запрос нельзя повторить",
      "PreparedStatement не ходит в базу",
      "Он нужен только для SELECT *",
    ],
  ),
  single(
    { id: "java-gc", topic: "garbage", grades: MS, difficulty: 3 },
    "Когда объект может стать мусором?",
    "Когда на него не осталось достижимых ссылок",
    [
      "Сразу после вызова любого метода",
      "Только при System.exit",
      "Когда ссылка объявлена как final",
    ],
  ),
  single(
    { id: "java-hb", topic: "happens-before", grades: S, difficulty: 3 },
    "Зачем отношение happens-before?",
    "Оно гарантирует, что запись в одном потоке видна чтению в другом",
    [
      "Оно сортирует строки в логе",
      "Оно заменяет synchronized во всех случаях само",
      "Оно есть только у volatile-полей и больше нигде",
    ],
  ),
  single(
    { id: "java-cl", topic: "classloader", grades: S, difficulty: 3 },
    "Кто загружает класс приложения в JVM?",
    "Загрузчик классов, обычно отдельный от загрузчика платформы",
    [
      "Операционная система читает .class как исполняемый файл",
      "Только метод main",
      "Сборщик мусора",
    ],
  ),
  single(
    { id: "java-jit", topic: "jit", grades: S, difficulty: 3 },
    "Что делает JIT?",
    "Компилирует горячий байткод в машинный код по ходу работы",
    [
      "Проверяет типы в исходнике",
      "Заменяет сборщик мусора",
      "Скачивает зависимости",
    ],
  ),
  code(
    { id: "java-pattern", topic: "record-pattern", grades: S, difficulty: 3 },
    "java",
    "Что напечатает код?",
    "record Point(int x, int y) {}\nObject value = new Point(2, 3);\nif (value instanceof Point(int x, int y)) {\n    System.out.print(x);\n}",
    "2",
    ["3", "Point", "ничего"],
  ),
  single(
    { id: "java-sealed", topic: "sealed", grades: S, difficulty: 3 },
    "Что ограничивает sealed-класс?",
    "Список наследников, которые разрешено объявить",
    ["Число полей", "Пакет, из которого можно вызвать метод", "Версию JVM"],
  ),
  multi(
    { id: "java-jmm", topic: "memory-model", grades: S, difficulty: 3 },
    "Что даёт volatile-поле?",
    [
      "Чтение и запись не переставляются мимо него как попало",
      "Запись видна другим потокам",
    ],
    [
      "Поле становится атомарным составным объектом само",
      "volatile заменяет блокировку на нескольких полях",
    ],
  ),
  single(
    { id: "java-varhandle", topic: "varhandle", grades: S, difficulty: 3 },
    "Зачем VarHandle?",
    "Атомарно и с нужным режимом памяти читать и писать поле или элемент",
    [
      "Заменить запись в файл",
      "Объявить переменную без типа",
      "Отключить JIT для метода",
    ],
  ),
  order(
    { id: "java-soft", topic: "soft-ref", grades: S, difficulty: 3 },
    "Как ведёт себя мягкая ссылка при нехватке памяти?",
    [
      "Объект ещё достижим через SoftReference",
      "Памяти не хватает",
      "Сборщик может очистить ссылку и забрать объект",
    ],
  ),
  single(
    { id: "java-module", topic: "module", grades: S, difficulty: 3 },
    "Что описывает module-info.java?",
    "Какие пакеты модуль открывает наружу и от каких модулей зависит",
    [
      "Список бинов Spring",
      "Версию только исходников",
      "Порядок сборки мусора",
    ],
  ),
];
