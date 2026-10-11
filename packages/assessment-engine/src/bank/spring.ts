import { between } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, code, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

// Вопросы про платформу: IoC, Boot, транзакции, Spring Data JPA, MVC. Язык проверяет банк Java.
export const spring: Template[] = [
  single(
    { id: "spring-service", topic: "bean", grades: J, difficulty: 1 },
    "Что делает @Service на классе, если пакет попадает в сканирование компонентов?",
    "Регистрирует класс как бин в контексте Spring",
    [
      "Делает класс REST-контроллером",
      "Открывает транзакцию на все методы класса",
      "Делает класс синглтоном через статическое поле",
    ],
  ),
  single(
    { id: "spring-constructor", topic: "injection", grades: J, difficulty: 1 },
    "Как документация Spring советует внедрять обязательные зависимости?",
    "Через конструктор",
    [
      "Через @Autowired на приватном поле",
      "Через сеттер",
      "Через context.getBean в методе",
    ],
  ),
  single(
    { id: "spring-scope", topic: "scope", grades: J, difficulty: 1 },
    "Какая область видимости у бина, если её не указали?",
    "singleton: один экземпляр на контекст",
    [
      "prototype: новый экземпляр на каждое внедрение",
      "request: один экземпляр на HTTP-запрос",
      "session: один экземпляр на сессию пользователя",
    ],
  ),
  code(
    { id: "spring-mapping", topic: "mvc", grades: J, difficulty: 1 },
    "java",
    "Какой запрос попадёт в метод get?",
    '@RestController\n@RequestMapping("/api/users")\nclass UserController {\n    @GetMapping("/{id}")\n    UserDto get(@PathVariable long id) { /* ... */ }\n}',
    "GET /api/users/7",
    ["GET /users/7", "POST /api/users/7", "GET /api/users?id=7"],
  ),
  single(
    { id: "spring-properties", topic: "config", grades: J, difficulty: 1 },
    "Где Spring Boot по умолчанию ищет настройки приложения?",
    "В application.properties или application.yml из classpath",
    [
      "В web.xml и context.xml из каталога WEB-INF",
      "В секции properties файла pom.xml или build.gradle",
      "В файле .env или .env.local из корня проекта",
    ],
  ),
  single(
    { id: "spring-request-body", topic: "mvc", grades: J, difficulty: 1 },
    "Какая аннотация говорит Spring MVC собрать параметр метода из JSON в теле запроса?",
    "@RequestBody",
    ["@RequestParam", "@PathVariable", "@RequestHeader"],
  ),
  single(
    { id: "spring-starter", topic: "boot", grades: J, difficulty: 1 },
    "Что подключает зависимость spring-boot-starter-web?",
    "Spring MVC, Jackson и встроенный Tomcat",
    [
      "Spring MVC, Hibernate и встроенную базу H2",
      "Spring MVC, Thymeleaf и Spring Security",
      "Только аннотации контроллеров без сервера",
    ],
  ),
  single(
    { id: "spring-profile", topic: "config", grades: J, difficulty: 1 },
    "Как подключить настройки из application-prod.yml?",
    "Активировать профиль prod, например spring.profiles.active=prod",
    [
      'Повесить @Profile("prod") на класс с main',
      "Указать prod в artifactId в pom.xml",
      "Импортировать файл через @Import в конфигурации",
    ],
  ),
  single(
    { id: "spring-valid", topic: "validation", grades: JM, difficulty: 2 },
    "spring-boot-starter-validation подключён, у поля name в DTO стоит @NotBlank. Клиент шлёт пустое name, и метод с @RequestBody всё равно вызывается. Чего не хватает?",
    "@Valid перед параметром с @RequestBody",
    [
      "@NotNull рядом с @NotBlank",
      "@Transactional на методе контроллера",
      "@ResponseStatus(HttpStatus.BAD_REQUEST) на классе",
    ],
  ),
  single(
    { id: "spring-advice", topic: "errors", grades: JM, difficulty: 2 },
    "Зачем класс с @RestControllerAdvice и методом @ExceptionHandler(NotFoundException.class)?",
    "Перехватить исключение из любого контроллера и вернуть единый ответ",
    [
      "Перехватить исключение только в контроллере из того же пакета",
      "Запретить контроллерам бросать NotFoundException",
      "Повторить запрос, если контроллер бросил исключение",
    ],
  ),
  {
    id: "spring-page-offset",
    topic: "data-paging",
    grades: JM,
    difficulty: 2,
    build: (rng) => {
      const page = between(rng, 1, 9);
      const size = between(rng, 5, 50);
      return {
        kind: "numeric",
        lang: "java",
        prompt: "Какой OFFSET окажется в SQL этого запроса?",
        code: `repository.findAll(PageRequest.of(${page}, ${size}));`,
        answer: page * size,
      };
    },
  },
  single(
    { id: "spring-autoconfig", topic: "boot", grades: M, difficulty: 2 },
    "Как Spring Boot решает, создавать ли DataSource автоматически?",
    "По условиям: драйвер есть в classpath, а свой бин DataSource не объявлен",
    [
      "Всегда создаёт свой, а объявленный бин DataSource добавляет вторым",
      "Только если на классе с main стоит @EnableDataSource",
      "Только если задана переменная окружения SPRING_DATASOURCE_AUTO",
    ],
  ),
  {
    id: "spring-n1-count",
    topic: "jpa-loading",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const orders = between(rng, 5, 40);
      return {
        kind: "numeric",
        lang: "java",
        prompt: `Связь Order.customer — @ManyToOne(fetch = FetchType.LAZY). В таблице ${orders} заказов, у каждого свой покупатель. Код внутри @Transactional. Сколько SQL-запросов выполнит Hibernate?`,
        code: "List<Order> orders = orderRepository.findAll();\nfor (Order order : orders) {\n    log.info(order.getCustomer().getName());\n}",
        answer: orders + 1,
      };
    },
  },
  single(
    { id: "spring-n1-fix", topic: "jpa-loading", grades: M, difficulty: 2 },
    "Как в Spring Data JPA загрузить заказы вместе с покупателями без N+1?",
    "JOIN FETCH в @Query или @EntityGraph с атрибутом customer",
    [
      "FetchType.EAGER на связи: Hibernate сделает один JOIN",
      "@Transactional(readOnly = true) на методе сервиса",
      "Кеш второго уровня для сущности Order",
    ],
  ),
  single(
    { id: "spring-lazy-init", topic: "jpa-session", grades: M, difficulty: 2 },
    "При spring.jpa.open-in-view=false контроллер получает сущность из сервиса и читает её ленивую коллекцию. Что произойдёт?",
    "LazyInitializationException: сессия закрылась вместе с транзакцией",
    [
      "Hibernate откроет новую сессию и догрузит коллекцию отдельным запросом",
      "Коллекция окажется пустой: ленивые связи вне сервиса не грузятся",
      "Spring откроет транзакцию на чтение и догрузит коллекцию в ней",
    ],
  ),
  code(
    {
      id: "spring-dirty-check",
      topic: "jpa-session",
      grades: M,
      difficulty: 2,
    },
    "java",
    "Изменится ли имя пользователя в базе?",
    "@Transactional\npublic void rename(Long id, String name) {\n    User user = repository.findById(id).orElseThrow();\n    user.setName(name);\n}",
    "Да: при коммите Hibernate найдёт изменения управляемой сущности",
    [
      "Нет: без repository.save(user) изменения теряются",
      "Нет: findById возвращает отсоединённую копию",
      "Да, но только после вызова entityManager.clear()",
    ],
  ),
  code(
    {
      id: "spring-self-invocation",
      topic: "transactions",
      grades: MS,
      difficulty: 3,
    },
    "java",
    "Контроллер вызывает payAll. В какой транзакции выполняется pay?",
    "@Service\nclass PaymentService {\n    public void payAll(List<Long> ids) {\n        for (Long id : ids) {\n            pay(id);\n        }\n    }\n\n    @Transactional\n    public void pay(Long id) { /* ... */ }\n}",
    "Ни в какой: вызов через this идёт мимо прокси",
    [
      "В отдельной транзакции на каждый вызов pay",
      "В одной общей транзакции на весь payAll",
      "Ни в какой: Spring падает при старте из-за такого вызова",
    ],
  ),
  single(
    { id: "spring-checked", topic: "rollback", grades: MS, difficulty: 3 },
    "Метод с @Transactional без параметров бросает IOException. Что будет с транзакцией?",
    "Закоммитится: по умолчанию откат только на RuntimeException и Error",
    [
      "Откатится: по умолчанию откат идёт на любое исключение",
      "Останется открытой, пока не истечёт таймаут соединения",
      "Откатится только последний оператор, остальное закоммитится",
    ],
  ),
  single(
    { id: "spring-prototype", topic: "scope", grades: MS, difficulty: 3 },
    "Бин со scope prototype внедрён через конструктор в singleton. Сколько экземпляров prototype увидит singleton за свою жизнь?",
    "Один: внедрение было одно, при создании singleton",
    [
      "Новый на каждый вызов метода singleton",
      "Новый на каждый HTTP-запрос",
      "Ни одного: Spring запрещает такое внедрение",
    ],
  ),
  single(
    { id: "spring-cycle", topic: "injection", grades: MS, difficulty: 2 },
    "Бин A требует B в конструкторе, бин B требует A в конструкторе. Что будет при старте?",
    "Старт упадёт с ошибкой о циклической зависимости",
    [
      "Spring подставит прокси и разрулит цикл сам",
      "Один из бинов получит null вместо зависимости",
      "Оба бина станут prototype",
    ],
  ),
  single(
    {
      id: "spring-requires-new",
      topic: "propagation",
      grades: S,
      difficulty: 3,
    },
    "Метод A с @Transactional вызывает через другой бин метод B с @Transactional(propagation = REQUIRES_NEW). B завершился, потом A бросил RuntimeException. Что останется в базе?",
    "Изменения B останутся, изменения A откатятся",
    [
      "Откатятся изменения и A, и B",
      "Останутся изменения и A, и B",
      "Откатятся изменения B, изменения A останутся",
    ],
  ),
  single(
    {
      id: "spring-rollback-only",
      topic: "propagation",
      grades: S,
      difficulty: 3,
    },
    "Метод A с @Transactional вызывает через другой бин метод B с @Transactional (REQUIRED). B бросает RuntimeException, A ловит его в try/catch и выходит нормально. Чем кончится?",
    "UnexpectedRollbackException: транзакция уже помечена только на откат",
    [
      "Коммитом изменений A без изменений B",
      "Коммитом изменений и A, и B",
      "Откатом изменений B через точку сохранения и коммитом A",
    ],
  ),
  single(
    { id: "spring-read-only", topic: "read-only", grades: S, difficulty: 3 },
    "Что @Transactional(readOnly = true) меняет для Hibernate в Spring 5.1+?",
    "Сессия не делает flush, и проверка грязных сущностей пропускается",
    [
      "Включается кеш второго уровня для всех запросов в методе",
      "Транзакция открывается с уровнем изоляции Serializable",
      "Запросы идут мимо пула соединений по отдельному каналу",
    ],
  ),
  single(
    { id: "spring-tx-http", topic: "transactions", grades: S, difficulty: 3 },
    "В методе с @Transactional сервис ждёт ответ внешнего HTTP API около 5 секунд. Что первым ломается под нагрузкой?",
    "Пул соединений к базе: соединение занято на всё время ожидания",
    [
      "Стек потока: транзакция растёт с каждым вызовом",
      "Кеш первого уровня: Hibernate сбрасывает его по таймауту",
      "Сам вызов: JVM запрещает сеть внутри транзакции",
    ],
  ),
  single(
    { id: "spring-osiv", topic: "jpa-session", grades: S, difficulty: 3 },
    "Чем опасен spring.jpa.open-in-view=true, который включён по умолчанию?",
    "Соединение занято до конца запроса, ленивые загрузки в контроллере прячут N+1",
    [
      "Каждый HTTP-запрос открывает две транзакции подряд и коммитит обе",
      "Сущности перестают быть управляемыми внутри сервисов и не сохраняются",
      "Ленивые связи становятся жадными, и каждый запрос грузит весь граф",
    ],
  ),
  single(
    { id: "spring-async", topic: "async", grades: S, difficulty: 3 },
    "Метод с @Transactional сохраняет заказ и вызывает @Async-метод другого бина, который читает этот заказ из базы. Иногда заказ не находится. Почему?",
    "@Async идёт в другом потоке вне транзакции, а заказ ещё не закоммичен",
    [
      "@Async разделяет транзакцию вызывающего, но читает из кеша",
      "@Async-метод получает отсоединённую копию сущности",
      "@Async выполняется раньше, чем вызывающий метод начнётся",
    ],
  ),
];
