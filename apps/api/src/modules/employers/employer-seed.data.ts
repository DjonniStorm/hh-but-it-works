// Синтетические компании с потребностями для демо. Названия выдуманы.
// Стеки берём из каталога навыков (packages/types/src/skill-catalog.ts), чтобы подборка
// сопоставлялась с сид-кандидатами (profiles/candidate-seed.data.ts).
import { Grade, Specialization, WorkFormat } from "@hh/types";

export type EmployerSeedNeed = {
  title: string;
  specialization: Specialization;
  gradeFrom: Grade;
  gradeTo: Grade;
  mustSkills: string[];
  niceSkills: string[];
  workFormats: WorkFormat[];
  salaryFrom: number;
  salaryTo: number;
  description: string;
};

export type EmployerSeed = {
  id: string;
  name: string;
  industry: string;
  description: string;
  website: string;
  needs: EmployerSeedNeed[];
};

const { Backend, Frontend, Data, Security } = Specialization;
const { Junior, Middle, Senior } = Grade;
const { Office, Hybrid, Remote } = WorkFormat;

// Под этими компаниями можно войти, если задан DEMO_PASSWORD: employer.<id>@employers.hh.test.
export const demoEmployerIds = ["parus", "orbita", "ladoga"];

export const employerSeeds: EmployerSeed[] = [
  {
    id: "parus",
    name: "Парус Финтех",
    industry: "Финтех",
    description:
      "Платёжный сервис для малого бизнеса: эквайринг, выставление счетов, выплаты. Команда из 40 инженеров.",
    website: "https://parus-fintech.example",
    needs: [
      {
        title: "Backend-инженер платёжного ядра",
        specialization: Backend,
        gradeFrom: Middle,
        gradeTo: Senior,
        mustSkills: ["Go", "PostgreSQL"],
        niceSkills: ["Docker", "Redis", "Kafka"],
        workFormats: [Remote, Hybrid],
        salaryFrom: 250000,
        salaryTo: 400000,
        description:
          "Развитие ядра проведения платежей: идемпотентность, очереди, сверки.",
      },
      {
        title: "Инженер по безопасности приложений",
        specialization: Security,
        gradeFrom: Middle,
        gradeTo: Senior,
        mustSkills: ["Linux", "OWASP"],
        niceSkills: ["Pentest", "Python"],
        workFormats: [Hybrid, Remote],
        salaryFrom: 260000,
        salaryTo: 400000,
        description: "Ревью кода и архитектуры, внутренние пентесты, PCI DSS.",
      },
    ],
  },
  {
    id: "orbita",
    name: "Медиа Орбита",
    industry: "Медиа",
    description:
      "Онлайн-кинотеатр и подкасты. Веб-клиент обслуживает несколько миллионов зрителей в месяц.",
    website: "https://orbita-media.example",
    needs: [
      {
        title: "Frontend-разработчик веб-плеера",
        specialization: Frontend,
        gradeFrom: Middle,
        gradeTo: Middle,
        mustSkills: ["TypeScript", "React"],
        niceSkills: ["Playwright", "Node.js"],
        workFormats: [Remote],
        salaryFrom: 200000,
        salaryTo: 260000,
        description:
          "Плеер, каталог, личный кабинет зрителя. Работа в продуктовой команде.",
      },
      {
        title: "Junior frontend в команду каталога",
        specialization: Frontend,
        gradeFrom: Junior,
        gradeTo: Junior,
        mustSkills: ["TypeScript", "React"],
        niceSkills: ["Алгоритмы"],
        workFormats: [Remote, Hybrid],
        salaryFrom: 100000,
        salaryTo: 150000,
        description: "Растим джуниоров: ментор, ревью, задачи с первой недели.",
      },
    ],
  },
  {
    id: "ladoga",
    name: "Ладога Аналитика",
    industry: "Аналитика данных",
    description:
      "Прогнозирование спроса и ценообразование для ритейла. Свой ML-стек и витрины данных.",
    website: "https://ladoga-analytics.example",
    needs: [
      {
        title: "Data scientist, модели спроса",
        specialization: Data,
        gradeFrom: Middle,
        gradeTo: Senior,
        mustSkills: ["Python", "Pandas", "PyTorch"],
        niceSkills: ["SQL", "Machine Learning"],
        workFormats: [Remote, Hybrid],
        salaryFrom: 220000,
        salaryTo: 320000,
        description: "Модели прогноза спроса, эксперименты, вывод в продакшен.",
      },
      {
        title: "Junior аналитик данных",
        specialization: Data,
        gradeFrom: Junior,
        gradeTo: Junior,
        mustSkills: ["Python", "SQL"],
        niceSkills: ["Pandas", "Статистика"],
        workFormats: [Office, Hybrid],
        salaryFrom: 90000,
        salaryTo: 130000,
        description: "Отчёты, витрины, помощь дата-сайентистам.",
      },
    ],
  },
  {
    id: "vector",
    name: "Вектор Логистик",
    industry: "Логистика",
    description:
      "Платформа для перевозчиков: маршрутизация, трекинг грузов, документооборот.",
    website: "https://vector-logistics.example",
    needs: [
      {
        title: "Node.js-разработчик сервиса маршрутов",
        specialization: Backend,
        gradeFrom: Middle,
        gradeTo: Middle,
        mustSkills: ["TypeScript", "Node.js", "PostgreSQL"],
        niceSkills: ["NestJS", "Redis", "Docker"],
        workFormats: [Remote, Hybrid],
        salaryFrom: 200000,
        salaryTo: 280000,
        description: "Сервис расчёта маршрутов и статусов рейсов.",
      },
    ],
  },
  {
    id: "sever",
    name: "Облако Север",
    industry: "Облачные сервисы",
    description:
      "Региональный облачный провайдер: виртуальные машины, управляемые базы данных, S3.",
    website: "https://oblako-sever.example",
    needs: [
      {
        title: "Senior backend, управляемые базы данных",
        specialization: Backend,
        gradeFrom: Senior,
        gradeTo: Senior,
        mustSkills: ["Go", "PostgreSQL", "System Design"],
        niceSkills: ["Kubernetes", "Docker"],
        workFormats: [Remote],
        salaryFrom: 350000,
        salaryTo: 450000,
        description:
          "Проектирование и разработка control plane для БД как сервиса.",
      },
    ],
  },
  {
    id: "pilot",
    name: "Тест-Пилот",
    industry: "Образование",
    description:
      "Онлайн-школа программирования для подростков: тренажёры, проверка заданий, курсы.",
    website: "https://test-pilot.example",
    needs: [
      {
        title: "Junior backend для проверки заданий",
        specialization: Backend,
        gradeFrom: Junior,
        gradeTo: Junior,
        mustSkills: ["Python", "FastAPI", "SQL"],
        niceSkills: ["Docker", "Git"],
        workFormats: [Remote, Hybrid],
        salaryFrom: 80000,
        salaryTo: 130000,
        description: "Сервис автоматической проверки решений учеников.",
      },
      {
        title: "Frontend-разработчик тренажёров",
        specialization: Frontend,
        gradeFrom: Junior,
        gradeTo: Middle,
        mustSkills: ["TypeScript", "React"],
        niceSkills: ["Vite", "Storybook"],
        workFormats: [Remote, Hybrid],
        salaryFrom: 120000,
        salaryTo: 220000,
        description: "Интерактивные тренажёры и редактор кода в браузере.",
      },
    ],
  },
  {
    id: "kedr",
    name: "Кедр Ритейл",
    industry: "Розничная торговля",
    description:
      "Сеть продуктовых магазинов с собственным интернет-магазином и программой лояльности.",
    website: "https://kedr-retail.example",
    needs: [
      {
        title: "Python-разработчик программы лояльности",
        specialization: Backend,
        gradeFrom: Middle,
        gradeTo: Senior,
        mustSkills: ["Python", "Django", "PostgreSQL"],
        niceSkills: ["Redis", "Docker", "Celery"],
        workFormats: [Hybrid],
        salaryFrom: 250000,
        salaryTo: 330000,
        description: "Бонусы, акции, персональные предложения.",
      },
    ],
  },
  {
    id: "shield",
    name: "Щит Контур",
    industry: "Информационная безопасность",
    description:
      "Центр мониторинга и реагирования на инциденты для банков и промышленности.",
    website: "https://shield-kontur.example",
    needs: [
      {
        title: "Пентестер",
        specialization: Security,
        gradeFrom: Middle,
        gradeTo: Middle,
        mustSkills: ["Linux", "Сети", "Pentest"],
        niceSkills: ["Python", "Burp Suite"],
        workFormats: [Remote],
        salaryFrom: 240000,
        salaryTo: 300000,
        description: "Тестирование на проникновение для клиентов центра.",
      },
      {
        title: "Junior аналитик SOC",
        specialization: Security,
        gradeFrom: Junior,
        gradeTo: Junior,
        mustSkills: ["Linux", "OWASP"],
        niceSkills: ["Pentest", "SIEM"],
        workFormats: [Remote, Hybrid],
        salaryFrom: 100000,
        salaryTo: 150000,
        description: "Разбор инцидентов первой линии, обучение в команде.",
      },
    ],
  },
  {
    id: "garant",
    name: "Гарант Секьюрити",
    industry: "Информационная безопасность",
    description:
      "Аудит защищённости и разработка средств защиты для государственных заказчиков.",
    website: "https://garant-security.example",
    needs: [
      {
        title: "Руководитель направления аудита",
        specialization: Security,
        gradeFrom: Senior,
        gradeTo: Senior,
        mustSkills: ["Linux", "OWASP"],
        niceSkills: ["Go", "Криптография"],
        workFormats: [Hybrid],
        salaryFrom: 350000,
        salaryTo: 450000,
        description: "Ведёте команду аудиторов и отвечаете за методологию.",
      },
    ],
  },
  {
    id: "nevadom",
    name: "Нева Умный Дом",
    industry: "Интернет вещей",
    description:
      "Приложение и облако для умных домов: датчики, сценарии, голосовое управление.",
    website: "https://neva-smarthome.example",
    needs: [
      {
        title: "Senior frontend, панель управления домом",
        specialization: Frontend,
        gradeFrom: Senior,
        gradeTo: Senior,
        mustSkills: ["TypeScript", "React", "System Design"],
        niceSkills: ["Vue", "Storybook"],
        workFormats: [Hybrid, Remote],
        salaryFrom: 330000,
        salaryTo: 420000,
        description: "Архитектура веб-клиента и дизайн-системы.",
      },
    ],
  },
  {
    id: "zdorovie",
    name: "Здоровье Онлайн",
    industry: "Медицинские технологии",
    description:
      "Телемедицина: записи к врачам, видеоконсультации, электронные рецепты.",
    website: "https://zdorovie-online.example",
    needs: [
      {
        title: "Fullstack на React и Node.js",
        specialization: Frontend,
        gradeFrom: Middle,
        gradeTo: Senior,
        mustSkills: ["TypeScript", "React", "Node.js"],
        niceSkills: ["PostgreSQL", "Docker"],
        workFormats: [Remote],
        salaryFrom: 230000,
        salaryTo: 350000,
        description: "Личный кабинет пациента и интеграции с клиниками.",
      },
      {
        title: "Backend-разработчик на Python",
        specialization: Backend,
        gradeFrom: Middle,
        gradeTo: Middle,
        mustSkills: ["Python", "PostgreSQL"],
        niceSkills: ["FastAPI", "Docker"],
        workFormats: [Remote, Hybrid],
        salaryFrom: 220000,
        salaryTo: 300000,
        description: "Расписание врачей, запись, уведомления.",
      },
    ],
  },
  {
    id: "geotrek",
    name: "ГеоТрек",
    industry: "Картография и навигация",
    description:
      "Карты и навигация для коммерческого транспорта. Свой движок маршрутизации.",
    website: "https://geotrek.example",
    needs: [
      {
        title: "Backend на Go, движок маршрутизации",
        specialization: Backend,
        gradeFrom: Middle,
        gradeTo: Middle,
        mustSkills: ["Go", "PostgreSQL", "Алгоритмы"],
        niceSkills: ["Redis", "Docker"],
        workFormats: [Remote, Hybrid, Office],
        salaryFrom: 200000,
        salaryTo: 280000,
        description:
          "Графовые алгоритмы, тайлы, пересчёт маршрутов в реальном времени.",
      },
    ],
  },
  {
    id: "manufaktura",
    name: "Игровая Мануфактура",
    industry: "Игры",
    description:
      "Студия браузерных и мобильных игр. Магазин внутриигровых покупок и социальные функции.",
    website: "https://igra-manufaktura.example",
    needs: [
      {
        title: "Junior frontend, магазин и профиль игрока",
        specialization: Frontend,
        gradeFrom: Junior,
        gradeTo: Junior,
        mustSkills: ["JavaScript", "React"],
        niceSkills: ["TypeScript", "CSS"],
        workFormats: [Remote, Hybrid],
        salaryFrom: 100000,
        salaryTo: 160000,
        description: "Интерфейсы магазина, инвентаря и профиля игрока.",
      },
    ],
  },
  {
    id: "agro",
    name: "Агро Данные",
    industry: "Агротех",
    description:
      "Спутниковый мониторинг полей и прогноз урожайности для агрохолдингов.",
    website: "https://agro-data.example",
    needs: [
      {
        title: "Data engineer, пайплайны спутниковых данных",
        specialization: Data,
        gradeFrom: Middle,
        gradeTo: Middle,
        mustSkills: ["Python", "SQL"],
        niceSkills: ["Spark", "Airflow", "Pandas"],
        workFormats: [Remote],
        salaryFrom: 200000,
        salaryTo: 260000,
        description: "Загрузка и обработка снимков, витрины для агрономов.",
      },
    ],
  },
  {
    id: "gossluzhba",
    name: "ГосСервис Плюс",
    industry: "Электронное правительство",
    description:
      "Подрядчик региональных порталов госуслуг. Работаем в офисе, стек на Java.",
    website: "https://gosservice-plus.example",
    needs: [
      {
        title: "Java-разработчик региональных порталов",
        specialization: Backend,
        gradeFrom: Middle,
        gradeTo: Senior,
        mustSkills: ["Java", "Spring", "PostgreSQL"],
        niceSkills: ["Kafka", "Hibernate"],
        workFormats: [Office],
        salaryFrom: 250000,
        salaryTo: 380000,
        description: "Интеграции с федеральными системами, формы заявлений.",
      },
    ],
  },
];

export function employerSeedEmail(seed: EmployerSeed): string {
  return `employer.${seed.id}@employers.hh.test`;
}
