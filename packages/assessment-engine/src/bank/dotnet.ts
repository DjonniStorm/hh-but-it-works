import { between, pick } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, code, multi, order, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

// Вопросы про платформу: ASP.NET Core, DI, EF Core, конфигурация. Язык проверяет банк C#.
export const dotnet: Template[] = [
  single(
    { id: "net-di-scoped", topic: "di-lifetime", grades: J, difficulty: 1 },
    "Что делает builder.Services.AddScoped<IClock, SystemClock>()?",
    "Регистрирует SystemClock для IClock, один экземпляр на HTTP-запрос",
    [
      "Регистрирует SystemClock для IClock, один экземпляр на всё приложение",
      "Регистрирует SystemClock для IClock, новый экземпляр при каждом разрешении",
      "Создаёт SystemClock при старте и кладёт его в статическое поле",
    ],
  ),
  single(
    { id: "net-env-key", topic: "configuration", grades: J, difficulty: 1 },
    "Как назвать переменную окружения на Linux, чтобы она задала ключ конфигурации ConnectionStrings:Default?",
    "ConnectionStrings__Default",
    [
      "ConnectionStrings.Default",
      "ConnectionStrings_Default",
      "ConnectionStrings/Default",
    ],
  ),
  code(
    { id: "net-route", topic: "routing", grades: J, difficulty: 1 },
    "csharp",
    "Какой запрос попадёт в метод Get?",
    '[ApiController]\n[Route("api/[controller]")]\npublic class OrdersController : ControllerBase\n{\n    [HttpGet("{id}")]\n    public IActionResult Get(int id) { /* ... */ }\n}',
    "GET /api/orders/5",
    ["GET /api/orderscontroller/5", "GET /orders/get/5", "POST /api/orders/5"],
  ),
  single(
    { id: "net-run", topic: "host", grades: J, difficulty: 1 },
    "Что делает app.Run() без аргументов в конце Program.cs?",
    "Запускает веб-хост и держит процесс, пока приложение не остановят",
    [
      "Обрабатывает первый входящий запрос и после ответа завершает процесс",
      "Компилирует контроллеры и представления, а затем завершает процесс",
      "Регистрирует сервисы в контейнере и возвращает управление в Main",
    ],
  ),
  single(
    { id: "net-binding", topic: "model-binding", grades: J, difficulty: 1 },
    "Откуда контроллер с [ApiController] по умолчанию берёт параметр CreateOrderDto в POST-действии?",
    "Из тела запроса в JSON",
    ["Из строки запроса", "Из заголовков запроса", "Из сегментов маршрута"],
  ),
  single(
    { id: "net-environment", topic: "environment", grades: J, difficulty: 1 },
    "Как ASP.NET Core узнаёт окружение: Development, Staging или Production?",
    "По переменной ASPNETCORE_ENVIRONMENT, без неё считает окружение Production",
    [
      "По переменной ASPNETCORE_ENVIRONMENT, без неё считает окружение Development",
      "По ключу Environment в appsettings.json, без него считает окружение Production",
      "По конфигурации сборки: Debug значит Development, Release значит Production",
    ],
  ),
  single(
    { id: "net-validation", topic: "validation", grades: JM, difficulty: 2 },
    "У DTO поле Name помечено [Required], клиент прислал JSON без него. Что сделает контроллер с [ApiController]?",
    "Ответит 400 с ошибками модели, действие не вызовется",
    [
      "Вызовет действие, Name будет null",
      "Вызовет действие, ModelState.IsValid будет false",
      "Ответит 500 из-за исключения валидации",
    ],
  ),
  order(
    {
      id: "net-pipeline-order",
      topic: "middleware",
      grades: JM,
      difficulty: 2,
    },
    "Расставьте вызовы конвейера в Program.cs в порядке из документации ASP.NET Core",
    [
      "app.UseExceptionHandler(...)",
      "app.UseAuthentication()",
      "app.UseAuthorization()",
      "app.MapControllers()",
    ],
  ),
  code(
    { id: "net-short-circuit", topic: "middleware", grades: JM, difficulty: 2 },
    "csharp",
    "Что получит клиент на GET /ping без заголовка X-Key?",
    'app.Use(async (ctx, next) =>\n{\n    if (!ctx.Request.Headers.ContainsKey("X-Key"))\n    {\n        ctx.Response.StatusCode = 401;\n        return;\n    }\n    await next();\n});\napp.MapGet("/ping", () => "pong");',
    "401 с пустым телом, обработчик /ping не вызовется",
    [
      "200 и pong: эндпоинты выполняются раньше app.Use",
      "401 и pong: обработчик всё равно допишет тело",
      "500: middleware обязан вызвать next",
    ],
  ),
  single(
    {
      id: "net-config-order",
      topic: "configuration",
      grades: JM,
      difficulty: 2,
    },
    "Logging:LogLevel:Default равен Information в appsettings.json и Debug в appsettings.Development.json. Ещё задана переменная окружения Logging__LogLevel__Default=Warning. Окружение — Development. Какое значение прочитает приложение?",
    "Warning",
    [
      "Debug",
      "Information",
      "Никакое: при конфликте источников хост не стартует",
    ],
  ),
  order(
    { id: "net-migration", topic: "ef-migrations", grades: JM, difficulty: 2 },
    "Как добавить колонку через миграции EF Core?",
    [
      "Добавить свойство в класс сущности",
      "Выполнить dotnet ef migrations add AddPhone",
      "Просмотреть сгенерированный код миграции",
      "Применить миграцию к базе: database update или SQL-скрипт",
    ],
  ),
  single(
    { id: "net-captive", topic: "di-lifetime", grades: M, difficulty: 2 },
    "Singleton-сервис просит в конструкторе scoped AppDbContext. Что произойдёт в окружении Development?",
    "Контейнер бросит исключение: scoped-сервис нельзя взять в singleton",
    [
      "Контейнер будет подставлять новый AppDbContext на каждый запрос",
      "Singleton автоматически станет scoped",
      "Всё заработает, AppDbContext будет общим и безопасным для потоков",
    ],
  ),
  single(
    { id: "net-no-tracking", topic: "ef-tracking", grades: M, difficulty: 2 },
    "Что даёт AsNoTracking() в запросе EF Core?",
    "Контекст не следит за сущностями: чтение дешевле, но SaveChanges их правки не увидит",
    [
      "Запрос идёт без транзакции и блокировок строк в базе",
      "Запрос не кешируется планировщиком базы и всегда компилируется заново",
      "Навигации грузятся сразу, без ленивой загрузки и Include",
    ],
  ),
  {
    id: "net-save-changes",
    topic: "ef-tracking",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const total = between(rng, 6, 20);
      const changed = between(rng, 2, total - 2);
      const tracked = pick(rng, [true, false]);
      const query = tracked
        ? "db.Users.Where(u => u.Active)"
        : "db.Users.AsNoTracking().Where(u => u.Active)";
      return {
        kind: "numeric",
        lang: "csharp",
        prompt: `Активных пользователей ${total}. Сколько строк изменится в базе?`,
        code: `var users = await ${query}.ToListAsync();\nforeach (var user in users.Take(${changed}))\n{\n    user.Score += 1;\n}\nawait db.SaveChangesAsync();`,
        answer: tracked ? changed : 0,
      };
    },
  },
  {
    id: "net-lazy-n1",
    topic: "ef-loading",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const orders = between(rng, 5, 40);
      return {
        kind: "numeric",
        lang: "csharp",
        prompt: `Включены UseLazyLoadingProxies, навигация Customer виртуальная. Заказов ${orders}, у каждого свой покупатель. Сколько SQL-запросов уйдёт в базу?`,
        code: "var orders = await db.Orders.ToListAsync();\nforeach (var order in orders)\n{\n    Console.WriteLine(order.Customer.Name);\n}",
        answer: orders + 1,
      };
    },
  },
  single(
    { id: "net-options", topic: "options", grades: M, difficulty: 2 },
    "Чем IOptionsSnapshot<T> отличается от IOptions<T>?",
    "Пересчитывает значения на каждый запрос, IOptions вычисляет их один раз",
    [
      "Вычисляет значения один раз, IOptions пересчитывает их на каждое обращение",
      "Ничем, это два имени одного и того же сервиса",
      "Хранит значения в файле, IOptions держит их в памяти",
    ],
  ),
  single(
    { id: "net-httpclient", topic: "httpclient", grades: M, difficulty: 2 },
    "Почему не создают new HttpClient() на каждый исходящий запрос?",
    "Сокеты освобождаются с задержкой и под нагрузкой кончаются, поэтому берут IHttpClientFactory",
    [
      "HttpClient не потокобезопасен, поэтому общий экземпляр берут только под lock",
      "Каждый HttpClient держит свой поток ОС, поэтому их число ограничено ядрами",
      "HttpClient можно создавать только в контроллере, поэтому его внедряют туда",
    ],
  ),
  single(
    {
      id: "net-background-scope",
      topic: "hosted-service",
      grades: M,
      difficulty: 2,
    },
    "Как BackgroundService правильно работает с AppDbContext, который зарегистрирован как scoped?",
    "Внедряет IServiceScopeFactory и создаёт scope на каждую итерацию",
    [
      "Внедряет AppDbContext в конструктор и держит его всё время работы",
      "Создаёт AppDbContext через new без опций",
      "Перерегистрирует AppDbContext как singleton",
    ],
  ),
  single(
    { id: "net-cancellation", topic: "cancellation", grades: M, difficulty: 2 },
    "Какой токен отменится, если клиент оборвёт HTTP-запрос?",
    "CancellationToken в параметрах действия, он же HttpContext.RequestAborted",
    [
      "CancellationToken.None, переданный в запрос к базе",
      "Токен нового CancellationTokenSource, созданного в начале действия",
      "IHostApplicationLifetime.ApplicationStopping",
    ],
  ),
  multi(
    { id: "net-dbcontext", topic: "dbcontext", grades: M, difficulty: 2 },
    "Что верно для DbContext в EF Core?",
    [
      "Он не потокобезопасен",
      "AddDbContext по умолчанию регистрирует его как scoped",
    ],
    [
      "Его выгодно держать singleton ради кеша сущностей",
      "SaveChanges без изменений всё равно открывает транзакцию в базе",
    ],
  ),
  single(
    { id: "net-sync-over-async", topic: "async", grades: MS, difficulty: 3 },
    "Почему .Result у Task в обработчике запроса ASP.NET Core опасен под нагрузкой?",
    "Поток пула стоит в ожидании, пул истощается, и запросы копятся в очереди",
    [
      "В ASP.NET Core .Result всегда даёт дедлок на SynchronizationContext",
      ".Result возвращает null, пока задача не завершилась",
      ".Result запускает задачу второй раз в новом потоке",
    ],
  ),
  single(
    {
      id: "net-middleware-scope",
      topic: "di-lifetime",
      grades: MS,
      difficulty: 3,
    },
    "Middleware-класс с методом InvokeAsync создаётся один раз на приложение. Как в нём получить scoped-сервис?",
    "Параметром InvokeAsync: его разрешают из scope текущего запроса",
    [
      "Параметром конструктора: его разрешают из scope текущего запроса",
      "Из корневого IServiceProvider, сохранённого в поле",
      "Из статического поля, заполненного при старте",
    ],
  ),
  single(
    { id: "net-async-void", topic: "async", grades: MS, difficulty: 3 },
    "Чем опасен async void метод, который вызывают из сервиса ASP.NET Core?",
    "Его исключение нельзя поймать через await, и оно роняет процесс",
    [
      "Он всегда выполняется синхронно и блокирует поток запроса до конца",
      "Компилятор запрещает в нём await и требует вернуть Task",
      "Он завершает запрос раньше и отправляет ответ клиенту дважды",
    ],
  ),
  single(
    {
      id: "net-concurrent-context",
      topic: "dbcontext",
      grades: S,
      difficulty: 3,
    },
    "Два запроса к одному экземпляру DbContext запускают через Task.WhenAll. Что будет?",
    "EF Core бросит InvalidOperationException: вторая операция начата до конца первой",
    [
      "Запросы пойдут параллельно по одному соединению, порядок ответов не гарантирован",
      "EF Core сам выстроит запросы в очередь и выполнит их по одному без ошибок",
      "Запросы выполнятся параллельно: контекст откроет второе соединение из пула",
    ],
  ),
  single(
    { id: "net-starvation", topic: "async", grades: S, difficulty: 3 },
    "Под нагрузкой задержки растут ступенями, CPU загружен слабо, длина очереди ThreadPool растёт, а потоки добавляются по одному в секунду-две. Какая причина вероятнее?",
    "Синхронное ожидание асинхронного кода истощает пул потоков",
    [
      "Server GC останавливает все потоки на каждую сборку",
      "Kestrel упёрся в лимит одновременных соединений",
      "JIT перекомпилирует горячие методы на каждый запрос",
    ],
  ),
  single(
    { id: "net-split-query", topic: "ef-loading", grades: S, difficulty: 3 },
    "Запрос с Include(o => o.Items).Include(o => o.Payments) по 1000 заказов возвращает из базы в разы больше строк, чем заказов, позиций и платежей вместе. Что помогает?",
    "AsSplitQuery: каждая коллекция грузится своим запросом",
    [
      "AsNoTracking: контекст перестанет дублировать строки",
      "Индекс по OrderId: база вернёт меньше строк",
      "ToList перед Include: коллекции подтянутся лениво",
    ],
  ),
  single(
    {
      id: "net-concurrency-token",
      topic: "ef-concurrency",
      grades: S,
      difficulty: 3,
    },
    "Как EF Core защищает от потерянного обновления, когда двое правят одну запись?",
    "Токен конкурентности в WHERE у UPDATE: нет затронутых строк — исключение",
    [
      "Контекст держит блокировку строки с момента чтения до SaveChanges",
      "SaveChanges сравнивает все поля с базой и сам сливает правки",
      "Защиты нет, пока транзакция не открыта с уровнем Serializable",
    ],
  ),
  single(
    { id: "net-shutdown", topic: "host", grades: S, difficulty: 3 },
    "Что происходит с запросами в работе, когда процессу ASP.NET Core приходит SIGTERM?",
    "Хост перестаёт принимать соединения и ждёт текущие запросы до ShutdownTimeout",
    [
      "Процесс завершается сразу, а текущие запросы обрываются без ответа",
      "Хост принимает новые соединения и ждёт текущие запросы без ограничения",
      "Kestrel передаёт текущие запросы другому экземпляру за балансировщиком",
    ],
  ),
  single(
    {
      id: "net-transient-disposable",
      topic: "di-dispose",
      grades: S,
      difficulty: 3,
    },
    "Transient-сервис реализует IDisposable, его много раз берут из корневого IServiceProvider. Что происходит с памятью?",
    "Корневой контейнер держит их до остановки приложения, память растёт",
    [
      "Контейнер вызывает Dispose сразу после выдачи экземпляра",
      "Сборщик мусора вызывает Dispose и освобождает экземпляры",
      "Контейнер запрещает такую регистрацию и падает при старте",
    ],
  ),
  single(
    { id: "net-execute-update", topic: "ef-bulk", grades: S, difficulty: 3 },
    "Как в EF Core 7+ поменять статус у 100 000 строк без загрузки сущностей?",
    "ExecuteUpdateAsync на запросе: один UPDATE в базе мимо трекера",
    [
      "Загрузить строки и вызвать SaveChanges: EF сольёт правки в один UPDATE",
      "Загрузить строки с AsNoTracking и вызвать SaveChanges",
      "Вызвать AddRange с новыми значениями и SaveChanges",
    ],
  ),
  single(
    { id: "net-context-pool", topic: "dbcontext", grades: S, difficulty: 3 },
    "О чём помнить, когда включают AddDbContextPool?",
    "Экземпляр переиспользуется, своё состояние в нём хранить нельзя",
    [
      "Каждый запрос получает отдельное физическое соединение навсегда",
      "Пул отключает трекинг изменений во всех запросах",
      "Контекст из пула становится потокобезопасным",
    ],
  ),
];
