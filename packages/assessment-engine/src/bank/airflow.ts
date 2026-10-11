import { between, sample } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, multi, order, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

export const airflow: Template[] = [
  single(
    { id: "af-dag", topic: "dag", grades: J, difficulty: 1 },
    "Что такое DAG в Airflow?",
    "Набор задач с зависимостями без циклов и расписанием запусков",
    [
      "Один Python-скрипт, который Airflow запускает целиком раз в сутки",
      "Очередь сообщений между воркерами",
      "Таблица в базе метаданных со списком пользователей",
    ],
  ),
  single(
    { id: "af-operator", topic: "dag", grades: J, difficulty: 1 },
    "Чем оператор отличается от задачи?",
    "Оператор — класс, шаблон работы. Задача — его экземпляр с task_id внутри конкретного DAG",
    [
      "Задача — класс, оператор — её запуск за конкретную дату",
      "Оператор работает только с SQL, задача — только с Python",
      "Это одно и то же, разные названия в UI и в коде",
    ],
  ),
  single(
    { id: "af-shift", topic: "dependencies", grades: J, difficulty: 1 },
    "Что значит extract >> load в DAG?",
    "load запустится после того, как extract завершится успешно",
    [
      "extract и load запустятся одновременно",
      "extract запустится после load",
      "Вывод extract перенаправится в файл load",
    ],
  ),
  single(
    { id: "af-xcom", topic: "xcom", grades: J, difficulty: 1 },
    "Для чего в Airflow XCom?",
    "Передать между задачами небольшое значение: путь к файлу, id, счётчик",
    [
      "Передать между задачами целую таблицу с данными",
      "Хранить пароли к внешним системам",
      "Запускать задачи на другом кластере",
    ],
  ),
  {
    id: "af-retries",
    topic: "retries",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const retries = between(rng, 1, 5);
      return {
        kind: "numeric",
        lang: "python",
        prompt:
          "Задача падает при каждом запуске. Сколько раз всего она запустится в одном запуске DAG?",
        code: `load = PythonOperator(\n    task_id="load",\n    python_callable=load_data,\n    retries=${retries},\n)`,
        answer: retries + 1,
      };
    },
  },
  single(
    { id: "af-clear", topic: "operations", grades: J, difficulty: 1 },
    "Задача transform упала, ошибку исправили. Как перезапустить её и всё, что зависит от неё дальше?",
    "Clear у transform с отметкой Downstream",
    [
      "Удалить DAG и выложить файл заново",
      "Поставить transform статус success вручную",
      "Включить catchup и подождать следующего дня",
    ],
  ),
  {
    id: "af-upstream",
    topic: "dependencies",
    grades: JM,
    difficulty: 1,
    build: (rng) => {
      const middle = sample(
        rng,
        ["clean", "validate", "enrich", "dedupe"],
        between(rng, 2, 4),
      );
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Сколько у задачи load непосредственных предшественников?",
        code: `extract >> [${middle.join(", ")}] >> load`,
        answer: middle.length,
      };
    },
  },
  single(
    { id: "af-start-now", topic: "scheduling", grades: JM, difficulty: 2 },
    "Почему в DAG нельзя писать start_date=datetime.now()?",
    "Дата сдвигается при каждом разборе файла, и планировщик не может стабильно посчитать интервалы",
    [
      "datetime.now() запрещён в Python-коде DAG",
      "DAG тогда запустится один раз и выключится",
      "Airflow принимает start_date только строкой",
    ],
  ),
  single(
    { id: "af-top-level", topic: "dag", grades: JM, difficulty: 2 },
    "На верхнем уровне файла DAG стоит запрос к базе за списком таблиц. Чем это плохо?",
    "Файл постоянно перечитывается при разборе DAG, и запрос уходит в базу при каждом разборе",
    [
      "Запрос выполнится только один раз при старте Airflow, список устареет",
      "Airflow не даёт импортировать драйверы баз в файле DAG",
      "Запрос выполнится на воркере и займёт слот задачи",
    ],
  ),
  single(
    { id: "af-all-done", topic: "trigger-rules", grades: JM, difficulty: 2 },
    "Задача cleanup удаляет временные файлы и должна запуститься после предшественников при любом их исходе: успех, падение или пропуск. Какой trigger_rule?",
    "all_done",
    ["all_success", "one_success", "none_skipped"],
  ),
  {
    id: "af-catchup",
    topic: "catchup",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const day = between(rng, 4, 12);
      return {
        kind: "numeric",
        lang: "python",
        prompt: `Airflow 2. DAG включили ${day} марта 2024 года в 12:00 UTC. Сколько запусков за прошедшие интервалы планировщик выполнит, пока догоняет?`,
        code: 'DAG(\n    dag_id="daily_report",\n    schedule="@daily",\n    start_date=datetime(2024, 3, 1, tzinfo=timezone.utc),\n    catchup=True,\n)',
        answer: day - 1,
      };
    },
  },
  single(
    { id: "af-interval", topic: "scheduling", grades: M, difficulty: 2 },
    "Airflow 2, DAG с @daily. Запуск обрабатывает интервал с 5 марта 00:00 по 6 марта 00:00. Когда он стартует?",
    "Сразу после 6 марта 00:00, когда интервал закончился",
    [
      "5 марта в 00:00, в начале интервала",
      "5 марта в 12:00, в середине интервала",
      "7 марта в 00:00, через сутки после конца интервала",
    ],
  ),
  single(
    { id: "af-idempotent", topic: "idempotency", grades: M, difficulty: 2 },
    "Задача грузит в таблицу продажи за день через INSERT. Её перезапустили, и строки задвоились. Как сделать задачу идемпотентной?",
    "Перезаписывать данные за свой интервал: удалить строки за data_interval и вставить заново, либо заменить партицию",
    [
      "Поставить retries=0, чтобы задачу не перезапускали",
      "Добавить sleep перед INSERT",
      "Включить catchup=False",
    ],
  ),
  single(
    { id: "af-now-filter", topic: "idempotency", grades: M, difficulty: 2 },
    "Задача выбирает WHERE created_at >= now() - interval '1 day'. Что пойдёт не так при backfill за прошлый месяц?",
    "Каждый запуск возьмёт последние сутки до сегодняшнего момента, а не свой интервал. Надо фильтровать по data_interval_start и data_interval_end",
    [
      "Ничего: now() в backfill подменяется датой запуска",
      "Backfill не запустит задачи с SQL",
      "Запрос упадёт: now() нельзя использовать в Airflow",
    ],
  ),
  single(
    { id: "af-xcom-size", topic: "xcom", grades: M, difficulty: 2 },
    "Почему не стоит передавать через XCom DataFrame на миллион строк?",
    "XCom по умолчанию лежит в базе метаданных: большие значения раздувают её и тормозят Airflow. Лучше положить файл в хранилище и передать путь",
    [
      "XCom не умеет сериализовать ничего, кроме строк",
      "XCom видна только внутри одной задачи",
      "XCom очищается раньше, чем стартует следующая задача",
    ],
  ),
  {
    id: "af-pool",
    topic: "pools",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const slots = between(rng, 2, 4);
      const tasks = between(rng, slots + 3, 15);
      return {
        kind: "numeric",
        prompt: `Пул api на ${slots} слота. Готовы ${tasks} задач с pool="api" и pool_slots=1, другие лимиты не мешают. Сколько из них выполняются одновременно?`,
        answer: slots,
      };
    },
  },
  single(
    { id: "af-backfill", topic: "catchup", grades: M, difficulty: 2 },
    "Что делает backfill?",
    "Создаёт и выполняет запуски DAG за указанный диапазон прошлых интервалов",
    [
      "Повторяет только последний упавший запуск",
      "Копирует DAG в другой экземпляр Airflow",
      "Удаляет историю запусков за диапазон дат",
    ],
  ),
  single(
    { id: "af-max-runs", topic: "catchup", grades: M, difficulty: 2 },
    "catchup=True, пропущено 30 дней, у DAG max_active_runs=1. Как пойдёт догон?",
    "По одному запуску: следующий начнётся, когда закончится предыдущий",
    [
      "Все 30 запусков стартуют сразу",
      "Выполнится только последний день",
      "Airflow откажется запускать DAG, пока лимит меньше 30",
    ],
  ),
  order(
    { id: "af-ti-states", topic: "lifecycle", grades: M, difficulty: 2 },
    "Расставьте состояния задачи в обычном успешном запуске по порядку",
    [
      "scheduled: зависимости выполнены, планировщик решил запускать",
      "queued: задача передана исполнителю",
      "running: воркер выполняет задачу",
      "success: задача завершилась без ошибки",
    ],
  ),
  single(
    { id: "af-template", topic: "templating", grades: M, difficulty: 2 },
    "Как подставить дату интервала в SQL оператора?",
    "Jinja-шаблоном {{ ds }} в поле, которое оператор рендерит",
    [
      "Через datetime.now() в коде файла DAG",
      "Через переменную окружения AIRFLOW_DATE",
      "Через XCom из предыдущего запуска",
    ],
  ),
  {
    id: "af-mapping",
    topic: "dynamic-mapping",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const files = sample(
        rng,
        ["a.csv", "b.csv", "c.csv", "d.csv", "e.csv", "f.csv"],
        between(rng, 2, 6),
      );
      const quoted = files.map((file) => {
        return `"${file}"`;
      });
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Сколько экземпляров задачи process появится в одном запуске?",
        code: `@task\ndef process(path, mode):\n    ...\n\nprocess.partial(mode="full").expand(path=[${quoted.join(", ")}])`,
        answer: files.length,
      };
    },
  },
  single(
    { id: "af-sensor-mode", topic: "sensors", grades: MS, difficulty: 2 },
    "Чем сенсор с mode='reschedule' отличается от mode='poke'?",
    "reschedule освобождает слот воркера между проверками, poke держит его всё время ожидания",
    [
      "poke освобождает слот между проверками, reschedule держит его",
      "reschedule переносит весь DAG на следующий день",
      "Разницы нет, это разные названия одного режима",
    ],
  ),
  single(
    { id: "af-executors", topic: "executors", grades: MS, difficulty: 2 },
    "Чем KubernetesExecutor отличается от CeleryExecutor?",
    "Kubernetes запускает отдельный под на каждую задачу. Celery держит постоянные воркеры, которые берут задачи из брокера",
    [
      "Celery запускает под на каждую задачу, Kubernetes держит постоянные воркеры",
      "KubernetesExecutor выполняет задачи по одной в процессе планировщика",
      "CeleryExecutor работает только с Redis, KubernetesExecutor — только с Postgres",
    ],
  ),
  single(
    { id: "af-return-xcom", topic: "xcom", grades: MS, difficulty: 3 },
    "Python-задача возвращает список на 50 МБ, параметров XCom не задавали. Что произойдёт?",
    "Значение автоматически уйдёт в XCom и запишется в базу метаданных",
    [
      "Значение выбросится, XCom пишется только через xcom_push",
      "Значение сохранится в лог задачи",
      "Задача упадёт: возвращать значения из задач нельзя",
    ],
  ),
  single(
    { id: "af-depends-past", topic: "scheduling", grades: MS, difficulty: 3 },
    "У задачи depends_on_past=True, и её экземпляр за вчера упал. Что будет с ней в сегодняшнем запуске?",
    "Не запустится, пока вчерашний экземпляр не станет success или skipped",
    [
      "Запустится как обычно, флаг влияет только на retries",
      "Перезапустит вчерашний экземпляр сама",
      "Сразу получит статус failed",
    ],
  ),
  single(
    { id: "af-no-catchup", topic: "catchup", grades: MS, difficulty: 3 },
    "Airflow 2. DAG с @daily и catchup=False стоял на паузе неделю. Что будет, когда его снимут с паузы?",
    "Запустится только самый последний завершившийся интервал, пропущенные дни останутся без запусков",
    [
      "Запустятся все семь пропущенных интервалов",
      "Ничего до следующей полуночи",
      "Запустится первый пропущенный интервал, остальные позже по одному",
    ],
  ),
  single(
    { id: "af-sensor-jam", topic: "sensors", grades: S, difficulty: 3 },
    "200 сенсоров в mode='poke' ждут файлы, у Airflow parallelism=32. Что вероятнее всего случится?",
    "Сенсоры займут все слоты, и задачи, которые должны выложить файлы, не смогут запуститься",
    [
      "Airflow сам переведёт сенсоры в reschedule",
      "Сенсоры будут проверять файлы по очереди, остальное идёт как обычно",
      "Планировщик откажется разбирать DAG с таким числом сенсоров",
    ],
  ),
  single(
    { id: "af-deferrable", topic: "sensors", grades: S, difficulty: 3 },
    "Чем deferrable-оператор лучше сенсора в reschedule при тысячах долгих ожиданий?",
    "Ожидание уходит в triggerer на asyncio: слот воркера свободен, и задачу не перезапускают ради каждой проверки",
    [
      "Он проверяет условие чаще и поэтому быстрее",
      "Он не требует отдельного процесса и работает внутри планировщика",
      "Он хранит состояние в XCom, а reschedule — в памяти воркера",
    ],
  ),
  single(
    { id: "af-retry-effects", topic: "retries", grades: S, difficulty: 3 },
    "Задача рассылает письма 10 000 клиентам, падает на середине, у неё retries=3. Что важно сделать?",
    "Отмечать, кому письмо ушло, и при повторе пропускать их, иначе первая половина получит письмо дважды",
    [
      "Ничего: Airflow сам продолжит попытку с места падения",
      "Поставить retries=0, тогда рассылка не повторится",
      "Увеличить execution_timeout, тогда задача не упадёт",
    ],
  ),
  {
    id: "af-mapping-cross",
    topic: "dynamic-mapping",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      const regions = sample(
        rng,
        ["eu", "us", "asia", "latam"],
        between(rng, 2, 4),
      );
      const days = between(rng, 2, 5);
      const dates = Array.from({ length: days }, (_, index) => {
        return `"2024-03-0${index + 1}"`;
      });
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Сколько экземпляров задачи load появится в одном запуске?",
        code: `@task\ndef load(region, day):\n    ...\n\nload.expand(\n    region=[${regions
          .map((region) => {
            return `"${region}"`;
          })
          .join(", ")}],\n    day=[${dates.join(", ")}],\n)`,
        answer: regions.length * days,
      };
    },
  },
  multi(
    { id: "af-parse-slow", topic: "dag", grades: S, difficulty: 3 },
    "Разбор DAG-файлов занимает минуты, планировщик отстаёт. Что поможет?",
    [
      "Перенести запросы к базам и API с верхнего уровня файла внутрь задач",
      "Импортировать тяжёлые библиотеки внутри функций задач, а не в начале файла",
      "Не генерировать DAG по ответу внешнего сервиса при каждом разборе",
    ],
    ["Увеличить retries у всех задач", "Включить catchup=True"],
  ),
  single(
    { id: "af-branch-join", topic: "trigger-rules", grades: S, difficulty: 3 },
    "Ветвление выбрало ветку a, ветка b пропущена. Обе ведут в join с trigger_rule по умолчанию. Что будет с join?",
    "join пропустится: all_success не выполняется, если предок skipped. Нужен none_failed_min_one_success",
    [
      "join выполнится после ветки a, пропуски не мешают",
      "join упадёт с ошибкой зависимостей",
      "join будет ждать ветку b до таймаута",
    ],
  ),
];
