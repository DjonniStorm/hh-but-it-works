import { between, pick } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, code, multi, order, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

// Вопросы про платформу: ORM, миграции, middleware, формы, DRF, транзакции, настройки. Язык проверяет банк Python.
export const django: Template[] = [
  single(
    { id: "dj-makemigrations", topic: "migrations", grades: J, difficulty: 1 },
    "Что делает python manage.py makemigrations?",
    "Создаёт файлы миграций по изменениям моделей и не трогает базу",
    [
      "Применяет к базе миграции, которые ещё не применены",
      "Создаёт файлы миграций и сразу применяет их к базе",
      "Удаляет таблицы моделей и создаёт их заново",
    ],
  ),
  single(
    { id: "dj-get", topic: "queryset", grades: J, difficulty: 1 },
    "Что сделает User.objects.get(email=email), если такой записи нет?",
    "Бросит исключение User.DoesNotExist",
    ["Вернёт None", "Вернёт пустой QuerySet", "Создаст запись с этим email"],
  ),
  code(
    { id: "dj-urls", topic: "urls", grades: J, difficulty: 1 },
    "python",
    "Какой путь дойдёт до post_detail?",
    'urlpatterns = [\n    path("posts/<int:pk>/", views.post_detail),\n]',
    "/posts/42/",
    ["/posts/abc/", "/posts/42/edit/", "/post/42/"],
  ),
  single(
    { id: "dj-csrf", topic: "csrf", grades: J, difficulty: 1 },
    "Зачем {% csrf_token %} в POST-форме шаблона?",
    "Без токена CsrfViewMiddleware отклонит POST ответом 403",
    [
      "Без токена шаблон не отрисует форму",
      "Без токена поля формы уйдут незашифрованными",
      "Без токена пользователь не останется в сессии",
    ],
  ),
  single(
    { id: "dj-debug", topic: "settings", grades: J, difficulty: 1 },
    "Почему DEBUG = True нельзя оставлять на проде?",
    "Страница ошибки показывает трассировку, настройки и фрагменты кода",
    [
      "В этом режиме Django отключает ORM и кеш",
      "В этом режиме Django не проверяет пароли пользователей",
      "В этом режиме Django обслуживает только один запрос за раз",
    ],
  ),
  single(
    { id: "dj-modelform", topic: "forms", grades: J, difficulty: 1 },
    "Что даёт ModelForm?",
    "Поля и валидацию по модели и save(), который записывает объект",
    [
      "Только HTML-разметку полей по модели, без валидации и записи",
      "Готовый REST API для модели со списком и детальной страницей",
      "Миграцию для модели, которая применяется при первом сабмите",
    ],
  ),
  single(
    { id: "dj-cascade", topic: "relations", grades: J, difficulty: 1 },
    "Что делает on_delete=models.CASCADE у ForeignKey?",
    "При удалении родителя удаляет и строки, которые на него ссылаются",
    [
      "Запрещает удалять родителя, пока на него есть ссылки",
      "Ставит NULL в строках, которые ссылаются на родителя",
      "Ничего не делает в базе, это подсказка для админки",
    ],
  ),
  order(
    { id: "dj-migrate-flow", topic: "migrations", grades: JM, difficulty: 2 },
    "Как добавить поле в модель и выкатить его?",
    [
      "Добавить поле в класс модели",
      "Выполнить manage.py makemigrations",
      "Закоммитить файл миграции вместе с кодом",
      "Выполнить manage.py migrate на сервере",
    ],
  ),
  single(
    { id: "dj-lazy", topic: "queryset", grades: JM, difficulty: 2 },
    "Когда User.objects.filter(active=True) обращается к базе?",
    "Когда его вычисляют: перебирают, берут len или list",
    [
      "Сразу при вызове filter, результат хранится в объекте",
      "При импорте модуля с моделями, один раз на процесс",
      "Только при вызове save у одной из найденных моделей",
    ],
  ),
  order(
    { id: "dj-middleware", topic: "middleware", grades: JM, difficulty: 2 },
    "MIDDLEWARE = [A, B]. Расставьте шаги обработки запроса по порядку",
    [
      "A получает запрос",
      "B получает запрос",
      "Вызывается view",
      "B получает ответ",
      "A получает ответ",
    ],
  ),
  single(
    { id: "dj-drf-valid", topic: "drf", grades: JM, difficulty: 2 },
    "Что происходит в DRF, если serializer.is_valid(raise_exception=True) нашёл ошибки?",
    "Бросается ValidationError, и DRF отвечает 400 с ошибками по полям",
    [
      "Метод возвращает False, и view продолжает работу дальше",
      "Бросается ValidationError, и DRF отвечает 500 с трассировкой",
      "Бросается ValidationError, и DRF отвечает 422 с ошибками по полям",
    ],
  ),
  single(
    { id: "dj-secret-key", topic: "settings", grades: JM, difficulty: 2 },
    "Где держать SECRET_KEY прода?",
    "В переменной окружения или хранилище секретов",
    [
      "В settings.py в репозитории: ключ нужен только админке",
      "В базе в таблице django_session",
      "В шаблоне base.html в скрытом поле",
    ],
  ),
  {
    id: "dj-n1",
    topic: "orm-loading",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const books = between(rng, 5, 40);
      const joined = pick(rng, [true, false]);
      const query = joined
        ? 'Book.objects.select_related("author")'
        : "Book.objects.all()";
      return {
        kind: "numeric",
        lang: "python",
        prompt: `В базе ${books} книг, у каждой свой автор. Сколько SQL-запросов выполнит код?`,
        code: `for book in ${query}:\n    print(book.author.name)`,
        answer: joined ? 1 : books + 1,
      };
    },
  },
  {
    id: "dj-prefetch",
    topic: "orm-loading",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const authors = between(rng, 5, 30);
      return {
        kind: "numeric",
        lang: "python",
        prompt: `В базе ${authors} авторов, у каждого по нескольку книг. Сколько SQL-запросов выполнит код?`,
        code: 'for author in Author.objects.prefetch_related("books"):\n    print([book.title for book in author.books.all()])',
        answer: 2,
      };
    },
  },
  single(
    { id: "dj-prefetch-when", topic: "orm-loading", grades: M, difficulty: 2 },
    "Когда нужен prefetch_related, а select_related не подойдёт?",
    "Для ManyToMany и обратной стороны ForeignKey",
    [
      "Для прямого ForeignKey и OneToOne",
      "Для любых связей: select_related устарел",
      "Для полей, у которых нет индекса",
    ],
  ),
  code(
    { id: "dj-f", topic: "concurrency", grades: M, difficulty: 2 },
    "python",
    "Чем этот код лучше, чем прочитать товар, вычесть 1 в Python и вызвать save()?",
    'Product.objects.filter(pk=pk).update(stock=F("stock") - 1)',
    "Вычитание идёт одним UPDATE в базе, параллельные запросы не затрут друг друга",
    [
      "F держит значение в памяти процесса, и база не нагружается",
      "update() вызывает save() и сигналы для каждой строки",
      "F блокирует таблицу целиком до конца запроса",
    ],
  ),
  single(
    { id: "dj-viewset", topic: "drf", grades: M, difficulty: 2 },
    "Что даёт ModelViewSet, зарегистрированный в роутере DRF?",
    "Маршруты для списка, создания, чтения, изменения и удаления записей",
    [
      "Маршруты только для списка и чтения, запись настраивают отдельно",
      "Страницу модели в админке Django со списком и формой",
      "Сериализатор и миграцию для модели без своих маршрутов",
    ],
  ),
  {
    id: "dj-qs-cache",
    topic: "queryset",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const reuse = pick(rng, [true, false]);
      const source = reuse
        ? "users = User.objects.filter(active=True)\nfor user in users:\n    print(user.email)\nfor user in users:\n    print(user.name)"
        : "for user in User.objects.filter(active=True):\n    print(user.email)\nfor user in User.objects.filter(active=True):\n    print(user.name)";
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Сколько SQL-запросов выполнит код?",
        code: source,
        answer: reuse ? 1 : 2,
      };
    },
  },
  single(
    { id: "dj-allowed-hosts", topic: "settings", grades: M, difficulty: 2 },
    "Что делает ALLOWED_HOSTS при DEBUG = False?",
    "Django отвечает 400 на запрос с заголовком Host не из списка",
    [
      "Django отбрасывает соединения с IP не из списка",
      "Django разрешает CORS-запросы с доменов из списка",
      "Django разрешает исходящие запросы только на домены из списка",
    ],
  ),
  code(
    { id: "dj-savepoint", topic: "transactions", grades: MS, difficulty: 3 },
    "python",
    "payment.save() бросает IntegrityError. Что останется в базе?",
    "with transaction.atomic():\n    order.save()\n    try:\n        with transaction.atomic():\n            payment.save()\n    except IntegrityError:\n        pass\n    log.save()",
    "order и log: внутренний atomic откатился до своей точки сохранения",
    [
      "Ничего: ошибка откатила всю внешнюю транзакцию",
      "order, payment и log: IntegrityError перехвачен",
      "Только order: после ошибки log.save() молча пропускается",
    ],
  ),
  single(
    { id: "dj-async-orm", topic: "async", grades: MS, difficulty: 3 },
    "Что будет, если в async def view вызвать User.objects.get(pk=pk)?",
    "Django бросит SynchronousOnlyOperation, нужен aget или sync_to_async",
    [
      "Запрос выполнится в цикле событий без блокировки",
      "Django сам обернёт вызов в поток и вернёт результат",
      "Запрос вернёт корутину, которую нужно дождаться",
    ],
  ),
  single(
    { id: "dj-conn-max-age", topic: "connections", grades: MS, difficulty: 2 },
    "Что даёт CONN_MAX_AGE = 60 в настройках базы?",
    "Соединение переживает запрос и переиспользуется до 60 секунд",
    [
      "Каждый запрос к базе прерывается, если идёт дольше 60 секунд",
      "Сессия пользователя живёт 60 секунд без активности",
      "Результаты QuerySet кешируются между запросами на 60 секунд",
    ],
  ),
  multi(
    { id: "dj-proxy-https", topic: "security", grades: MS, difficulty: 3 },
    "TLS снимает обратный прокси, Django он передаёт X-Forwarded-Proto. Какие две настройки нужны, чтобы request.is_secure() видел HTTPS и cookie сессии не уходила по HTTP?",
    [
      'SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")',
      "SESSION_COOKIE_SECURE = True",
    ],
    [
      'ALLOWED_HOSTS = ["*"]',
      "USE_X_FORWARDED_HOST = True",
      "CSRF_USE_SESSIONS = True",
    ],
  ),
  single(
    { id: "dj-drf-n1", topic: "drf", grades: MS, difficulty: 2 },
    "BookSerializer с вложенным AuthorSerializer медленно отдаёт список книг. Где правка?",
    'В get_queryset вьюхи: добавить select_related("author")',
    [
      "В сериализаторе: задать depth = 0",
      "В настройках DRF: увеличить PAGE_SIZE",
      "В модели: поставить db_index=True на author",
    ],
  ),
  single(
    { id: "dj-bulk-create", topic: "bulk", grades: MS, difficulty: 2 },
    "Что не происходит при bulk_create(objs)?",
    "Не вызываются save() моделей и сигналы pre_save и post_save",
    [
      "Не проверяются ограничения базы: NOT NULL и UNIQUE",
      "Не открывается транзакция, строки пишутся по одной",
      "Не создаются строки, пока не вызвать save() у каждого объекта",
    ],
  ),
  code(
    { id: "dj-broken-atomic", topic: "transactions", grades: S, difficulty: 3 },
    "python",
    "payment.save() бросает IntegrityError. База — PostgreSQL. Чем кончится блок?",
    "with transaction.atomic():\n    order.save()\n    try:\n        payment.save()\n    except IntegrityError:\n        pass\n    log.save()",
    "log.save() бросит TransactionManagementError, весь блок откатится",
    [
      "Сохранятся order и log",
      "Сохранятся order, payment и log",
      "Сохранится только order, log.save() молча пропустится",
    ],
  ),
  single(
    { id: "dj-select-for-update", topic: "locking", grades: S, difficulty: 3 },
    "Два запроса одновременно проверяют stock > 0 и списывают товар. Как это сделать безопасно в ORM?",
    "Внутри transaction.atomic взять строку через select_for_update, проверить и сохранить",
    [
      'Прочитать товар через get, проверить stock и вызвать save(update_fields=["stock"])',
      "Вызвать refresh_from_db перед save",
      "Выключить ATOMIC_REQUESTS, чтобы запросы не мешали друг другу",
    ],
  ),
  single(
    { id: "dj-on-commit", topic: "transactions", grades: S, difficulty: 3 },
    "Внутри transaction.atomic код создаёт заказ и сразу ставит задачу Celery с его id. Иногда воркер не находит заказ. Что поправит?",
    "Ставить задачу через transaction.on_commit",
    [
      "Добавить в задачу time.sleep перед чтением",
      "Вызвать save у заказа второй раз",
      "Поднять задаче приоритет в очереди",
    ],
  ),
  single(
    { id: "dj-get-model", topic: "migrations", grades: S, difficulty: 3 },
    "Почему в RunPython-миграции модель берут через apps.get_model, а не импортом?",
    "Нужна историческая версия модели на момент миграции, а не текущий код",
    [
      "Импорт моделей в файлах миграций запрещён синтаксически",
      "get_model быстрее, потому что не читает базу",
      "С get_model миграция идёт без транзакции",
    ],
  ),
  order(
    { id: "dj-drop-field", topic: "zero-downtime", grades: S, difficulty: 3 },
    "Поле NOT NULL нужно удалить без простоя: при выкатке старые и новые экземпляры работают одновременно. Расставьте шаги",
    [
      "Миграцией сделать поле nullable",
      "Выкатить код, который не читает и не пишет поле",
      "Дождаться, пока старые экземпляры остановятся",
      "Выкатить миграцию RemoveField",
    ],
  ),
  single(
    { id: "dj-iterator", topic: "memory", grades: S, difficulty: 3 },
    "Как пройти 10 миллионов строк QuerySet и не держать их все в памяти?",
    "Через .iterator(chunk_size=...): строки читаются порциями без кеша QuerySet",
    [
      "Через .all(): QuerySet и так читает порциями и не кеширует",
      "Через len(qs) заранее, чтобы Django знал размер",
      "Через .select_related() по всем связям",
    ],
  ),
];
