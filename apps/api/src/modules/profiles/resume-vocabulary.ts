import { Grade, Specialization, WorkFormat } from "@hh/types";

// Словари разбора резюме. Регулярки без учёта регистра, «ё» и «е» пишутся через [её].

const left = String.raw`(?<![\p{L}\p{N}])`;

function words(...sources: string[]): RegExp {
  return new RegExp(`${left}(?:${sources.join("|")})`, "iu");
}

export const specializationWords: Record<Specialization, RegExp> = {
  [Specialization.Frontend]: words(
    "front[\\s-]?end",
    "фронт[\\s-]?енд",
    "фронтэнд",
    "верстальщик",
    "ui[\\s-]разработчик",
  ),
  [Specialization.Backend]: words(
    "back[\\s-]?end",
    "б[эе]к[\\s-]?[эе]нд",
    "server[\\s-]side",
    "серверн\\p{L}* разработ",
  ),
  [Specialization.Data]: words(
    "data\\s+(?:engineer|scientist|analyst|science|engineering)",
    "(?:аналитик|инженер)\\p{L}* данных",
    "ml[\\s-](?:engineer|инженер)",
    "machine\\s+learning",
    "машинн\\p{L}* обучени",
    "dwh",
    "etl",
    "bi[\\s-]аналитик",
  ),
  [Specialization.Security]: words(
    "security",
    "безопасност",
    "кибербезопасн",
    "pentest",
    "пентест",
    "penetration",
    "appsec",
    "devsecops",
    "soc\\s+(?:analyst|аналитик|l[123])",
  ),
};

// Порядок важен: «Senior» в заголовке раньше «Junior» в описании.
export const gradeWords: [RegExp, Grade][] = [
  [
    words(
      "senior",
      "сень[оеё]р",
      "синьор",
      "lead",
      "тимлид",
      "техлид",
      "ведущ\\p{L}*",
      "старш\\p{L}*",
      "principal",
      "staff\\s+engineer",
    ),
    Grade.Senior,
  ],
  [words("middle", "мид(?:д)?л\\p{L}*"), Grade.Middle],
  [
    words(
      "junior",
      "джун\\p{L}*",
      "младш\\p{L}*",
      "стаж[её]р\\p{L}*",
      "intern",
      "trainee",
    ),
    Grade.Junior,
  ],
];

// «Хочу вырасти до Middle» — это цель, а не текущий грейд.
export const gradeGoal =
  /(?:до|в|к|to|towards|into|become)\s+(?:позиции\s+|уровня\s+|a\s+)?$/iu;

// Строка должности: на ней грейд описывает самого кандидата.
export const roleLine = words(
  "разработчик",
  "программист",
  "developer",
  "engineer",
  "инженер",
  "аналитик",
  "analyst",
  "тестировщик",
  "архитектор",
  "architect",
  "devops",
  "специалист",
  "specialist",
  "lead",
  "тимлид",
);

// Должность в записи опыта. Шире roleLine: преподаватель или менеджер тоже должность, но не грейд.
export const jobWords = new RegExp(
  `${roleLine.source}|${
    words(
      "преподавател\\p{L}*",
      "учител\\p{L}*",
      "teacher",
      "менеджер",
      "manager",
      "руководител\\p{L}*",
      "head of",
      "директор",
      "director",
      "консультант",
      "consultant",
      "дизайнер",
      "designer",
      "администратор",
      "administrator",
      "стаж[её]р\\p{L}*",
      "intern",
      "qa",
      "support",
    ).source
  }`,
  "iu",
);

// Степень перед программой: «Bachelor's degree, Applied Mathematics».
export const degreeWords = words(
  "бакалавр",
  "магистр",
  "специалитет",
  "аспирант",
  "bachelor",
  "master",
  "phd",
  "degree",
);

export const workFormatWords: [RegExp, WorkFormat][] = [
  [words("удал[её]нн?\\p{L}*", "remote", "дистанц\\p{L}*"), WorkFormat.Remote],
  [words("гибрид\\p{L}*", "hybrid"), WorkFormat.Hybrid],
  [
    words("на месте работодателя", "офис\\p{L}*", "on[\\s-]?site", "office"),
    WorkFormat.Office,
  ],
];

// Строки, где резюме перечисляет формат работы. В опыте «удалённо» — про прошлую работу.
export const workFormatLine =
  /^(?:формат работы|график работы|work format|work type|формат)\s*:/iu;

export const activeSearch = words(
  "активно ищу",
  "в активном поиске",
  "actively looking",
  "open to work",
);

export const softSkillWords: [RegExp, string][] = [
  [
    words("коммуникабельн", "коммуникативн", "общительн", "communication"),
    "Коммуникабельность",
  ],
  [
    words(
      "работ\\p{L}* в команде",
      "командн\\p{L}* (?:игрок|работ)",
      "teamwork",
      "team player",
      "collaborat",
    ),
    "Работа в команде",
  ],
  [words("ответственн", "responsib"), "Ответственность"],
  [
    words(
      "обучаем",
      "быстро (?:обучаюсь|учусь|осваиваю)",
      "fast learner",
      "quick learner",
    ),
    "Обучаемость",
  ],
  [
    words("самостоятельн", "self-motivated", "independent"),
    "Самостоятельность",
  ],
  [words("лидерск", "leadership"), "Лидерство"],
  [
    words("наставничеств", "менторств", "mentoring", "mentorship"),
    "Наставничество",
  ],
  [
    words("аналитическ\\p{L}* (?:мышлени|склад)", "analytical"),
    "Аналитическое мышление",
  ],
  [
    words("критическ\\p{L}* мышлени", "critical thinking"),
    "Критическое мышление",
  ],
  [words("внимательн", "attention to detail"), "Внимательность к деталям"],
  [words("решени\\p{L}* проблем", "problem[\\s-]solving"), "Решение проблем"],
  [
    words("стрессоустойчив", "under pressure", "stress[\\s-]resist"),
    "Стрессоустойчивость",
  ],
  [
    words(
      "тайм[\\s-]менеджмент",
      "time management",
      "организованн",
      "пунктуальн",
    ),
    "Тайм-менеджмент",
  ],
  [words("инициативн", "proactive"), "Инициативность"],
  [words("креативн", "creativ"), "Креативность"],
  [words("адаптивн", "гибкост\\p{L}* мышлени", "adaptab"), "Адаптивность"],
  [words("целеустремл[её]нн", "goal-oriented"), "Целеустремлённость"],
];
