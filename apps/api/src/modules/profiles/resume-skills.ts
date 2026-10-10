import type { ResumeDraft } from "@hh/contracts";

import { slugFromTitle } from "./skill-catalog";

type KnownSkill = {
  title: string;
  // Есть у навыков каталога: черновик ссылается на строку в skills, а не плодит новую.
  slug?: string;
  // Регулярки без учёта регистра.
  aliases: string[];
  // С учётом регистра: «Go» — язык, «go» — просто слово.
  exact?: string[];
};

export type CatalogSkill = { slug: string; title: string };

// Слово целиком: «go» не находится внутри «golang», «js» — внутри «Node.js».
const boundary = String.raw`(?<![\p{L}\p{N}.])`;
const end = String.raw`(?![\p{L}\p{N}])`;

function term(source: string, flags: string): RegExp {
  return new RegExp(`${boundary}(?:${source})${end}`, flags);
}

// Алиасы технологий из резюме. Каталог расширяется в БД, здесь только написания.
const knownSkills: KnownSkill[] = [
  {
    slug: "postgresql",
    title: "PostgreSQL",
    aliases: ["postgre(?:s|sql)", "постгре\\p{L}*"],
  },
  {
    slug: "http-api",
    title: "HTTP и API",
    aliases: [
      String.raw`https?(?:\s*[/:,]\s*|\s+)api`,
      String.raw`rest(?:ful)?(?:\s+|-)api`,
    ],
    exact: ["REST"],
  },
  { slug: "typescript", title: "TypeScript", aliases: ["typescript", "ts"] },
  { slug: "docker", title: "Docker", aliases: ["docker(?:-compose)?"] },
  {
    slug: "testing",
    title: "Тестирование",
    aliases: [
      "pytest",
      "jest",
      "vitest",
      "playwright",
      "cypress",
      "selenium",
      "junit",
      "unit[\\s-]?тест\\p{L}*",
      "unit[\\s-]?test\\p{L}*",
    ],
  },
  { slug: "python", title: "Python", aliases: ["python\\s?3?"] },
  {
    slug: "csharp",
    title: "C#",
    aliases: [String.raw`c\s*#`, String.raw`c\s*sharp`, "csharp"],
  },
  {
    slug: "react",
    title: "React",
    aliases: [String.raw`react(?:\.js|js)?(?!\s+(?:native|router|query))`],
  },
  { slug: "go", title: "Go", aliases: ["golang"], exact: ["Go"] },
  { slug: "java", title: "Java", aliases: ["java(?!script)"] },
  {
    title: "JavaScript",
    aliases: ["javascript", "js", "es6\\+?", "ecmascript"],
  },
  { title: "Node.js", aliases: [String.raw`node(?:\.?js)?`] },
  { title: "HTML", aliases: ["html5?"] },
  { title: "CSS", aliases: ["css3?"] },
  { title: "SCSS", aliases: ["s[ac]ss", "scss/sass"] },
  { title: "Tailwind CSS", aliases: [String.raw`tailwind(?:\s*css)?`] },
  {
    slug: "vue",
    title: "Vue",
    aliases: [String.raw`vue(?:\.?js)?(?:\s*[23])?`],
  },
  { title: "Angular", aliases: ["angular(?:js)?"] },
  { title: "Svelte", aliases: ["svelte(?:kit)?"] },
  { title: "Next.js", aliases: [String.raw`next\.?js`] },
  { title: "Nuxt", aliases: [String.raw`nuxt(?:\.?js)?`] },
  { title: "Nest.js", aliases: [String.raw`nest\.?js`] },
  {
    title: "Express",
    aliases: [String.raw`express(?:\.?js)`],
    exact: ["Express"],
  },
  { title: "Redux", aliases: ["redux(?:\\s+toolkit)?", "rtk"] },
  { title: "MobX", aliases: ["mobx"] },
  { title: "Zustand", aliases: ["zustand"] },
  { title: "RxJS", aliases: ["rxjs"] },
  { title: "React Native", aliases: [String.raw`react\s+native`] },
  { title: "React Router", aliases: [String.raw`react\s+router`] },
  {
    title: "React Query",
    aliases: [String.raw`react\s+query`, String.raw`tanstack\s+query`],
  },
  { title: "GraphQL", aliases: ["graphql", "apollo"] },
  { title: "Webpack", aliases: ["webpack"] },
  { title: "Vite", aliases: ["vite"] },
  { title: "Storybook", aliases: ["storybook"] },
  { title: "Figma", aliases: ["figma"] },
  { title: "Mantine", aliases: [String.raw`mantine(?:\s*ui)?`] },
  { title: "shadcn/ui", aliases: [String.raw`shadcn(?:\s*/?\s*ui)?`] },
  { title: "Material UI", aliases: ["mui", String.raw`material[\s-]?ui`] },
  { title: "styled-components", aliases: ["styled-components"] },
  { title: "Module Federation", aliases: [String.raw`module\s+federation`] },
  { title: "Kotlin", aliases: ["kotlin"] },
  { title: "Swift", aliases: ["swift"] },
  { title: "C++", aliases: [String.raw`c\+\+`, "cpp"] },
  { title: "Rust", aliases: ["rust"] },
  { title: "PHP", aliases: ["php"] },
  { title: "Laravel", aliases: ["laravel"] },
  { title: "Symfony", aliases: ["symfony"] },
  { title: "Ruby", aliases: ["ruby"] },
  { title: "Ruby on Rails", aliases: [String.raw`ruby\s+on\s+rails`, "rails"] },
  {
    title: ".NET",
    aliases: [
      String.raw`\.net(?:\s*core)?`,
      "dotnet",
      String.raw`asp\.net(?:\s*core)?`,
    ],
  },
  { title: "Spring", aliases: [String.raw`spring(?:\s*boot)?`] },
  { title: "Hibernate", aliases: ["hibernate"] },
  { title: "Django", aliases: ["django(?:\\s+rest\\s+framework)?", "drf"] },
  { title: "Flask", aliases: ["flask"] },
  { title: "FastAPI", aliases: ["fastapi"] },
  { title: "Celery", aliases: ["celery"] },
  { title: "SQLAlchemy", aliases: ["sqlalchemy"] },
  { title: "gRPC", aliases: ["grpc"] },
  { title: "Kafka", aliases: [String.raw`(?:apache\s+)?kafka`] },
  { title: "RabbitMQ", aliases: ["rabbitmq"] },
  { title: "Redis", aliases: ["redis"] },
  { title: "SQL", aliases: ["sql"] },
  { title: "MySQL", aliases: ["mysql", "mariadb"] },
  {
    title: "MS SQL Server",
    aliases: [
      "mssql",
      String.raw`ms\s+sql(?:\s+server)?`,
      String.raw`sql\s+server`,
      "t-sql",
    ],
  },
  { title: "Oracle", aliases: [String.raw`oracle(?:\s+db)?`, "pl/sql"] },
  { title: "SQLite", aliases: ["sqlite"] },
  { title: "MongoDB", aliases: ["mongo(?:db)?"] },
  { title: "ClickHouse", aliases: ["clickhouse"] },
  { title: "Elasticsearch", aliases: ["elastic(?:search)?"] },
  { title: "Cassandra", aliases: ["cassandra"] },
  { title: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { title: "Helm", aliases: ["helm"] },
  { title: "Terraform", aliases: ["terraform"] },
  { title: "Ansible", aliases: ["ansible"] },
  { title: "Nginx", aliases: ["nginx"] },
  { title: "Linux", aliases: ["linux", "ubuntu", "debian", "centos"] },
  { title: "Bash", aliases: ["bash"] },
  { title: "Git", aliases: ["git"] },
  {
    title: "CI/CD",
    aliases: [
      String.raw`ci\s*/\s*cd`,
      String.raw`gitlab\s+ci`,
      String.raw`github\s+actions`,
      "jenkins",
    ],
  },
  { title: "AWS", aliases: ["aws", String.raw`amazon\s+web\s+services`] },
  { title: "Prometheus", aliases: ["prometheus"] },
  { title: "Grafana", aliases: ["grafana"] },
  { title: "Микросервисы", aliases: ["микросервис\\p{L}*", "microservices?"] },
  { title: "Pandas", aliases: ["pandas"] },
  { title: "NumPy", aliases: ["numpy"] },
  { title: "scikit-learn", aliases: ["scikit-learn", "sklearn"] },
  { title: "PyTorch", aliases: ["pytorch"] },
  { title: "TensorFlow", aliases: ["tensorflow", "keras"] },
  { title: "Airflow", aliases: [String.raw`(?:apache\s+)?airflow`] },
  { title: "Spark", aliases: [String.raw`(?:apache\s+)?spark`, "pyspark"] },
  { title: "Hadoop", aliases: ["hadoop", "hdfs"] },
  { title: "dbt", aliases: ["dbt"] },
  { title: "Power BI", aliases: [String.raw`power\s*bi`] },
  { title: "Tableau", aliases: ["tableau"] },
  { title: "Jupyter", aliases: ["jupyter"] },
  {
    title: "Machine Learning",
    aliases: [String.raw`machine\s+learning`, "машинное обучение", "ml"],
  },
  { title: "Burp Suite", aliases: [String.raw`burp(?:\s+suite)?`] },
  { title: "OWASP", aliases: ["owasp"] },
  { title: "Kali Linux", aliases: [String.raw`kali(?:\s+linux)?`] },
  { title: "Wireshark", aliases: ["wireshark"] },
  { title: "Metasploit", aliases: ["metasploit"] },
  { title: "Nmap", aliases: ["nmap"] },
  { title: "SIEM", aliases: ["siem"] },
  { title: "Splunk", aliases: ["splunk"] },
];

type Matcher = { slug: string; title: string; patterns: RegExp[] };

function matchers(catalog: CatalogSkill[]): Matcher[] {
  const list: Matcher[] = knownSkills.map((skill) => {
    return {
      slug: skill.slug ?? slugFromTitle(skill.title),
      title: skill.title,
      patterns: [
        ...skill.aliases.map((alias) => {
          return term(alias, "iu");
        }),
        ...(skill.exact ?? []).map((alias) => {
          return term(escape(alias), "u");
        }),
      ],
    };
  });
  const covered = new Set(
    list.map((item) => {
      return item.slug;
    }),
  );
  // Новые строки каталога ищутся по названию, без отдельного словаря.
  for (const row of catalog) {
    if (covered.has(row.slug) || row.title.trim().length < 2) {
      continue;
    }
    list.push({
      slug: row.slug,
      title: row.title,
      patterns: [term(escape(row.title.trim()), "iu")],
    });
  }
  return list;
}

// Навыки в анкете ограничены 50 своими, черновик берёт с запасом меньше.
const maxDraftSkills = 40;

export function findSkills(
  text: string,
  catalog: CatalogSkill[] = [],
): ResumeDraft["skills"] {
  const found: ResumeDraft["skills"] = [];
  for (const matcher of matchers(catalog)) {
    const hit = matcher.patterns.some((pattern) => {
      return pattern.test(text);
    });
    if (!hit) {
      continue;
    }
    // Название из каталога в БД важнее нашего написания.
    const row = catalog.find((item) => {
      return item.slug === matcher.slug;
    });
    found.push({ slug: matcher.slug, title: row?.title ?? matcher.title });
    if (found.length >= maxDraftSkills) {
      break;
    }
  }
  return found;
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}
