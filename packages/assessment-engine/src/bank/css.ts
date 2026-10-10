import { type Rng, between, pick, sample } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, multi, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

// Подсветки CSS нет: фрагмент стилей показывается простым текстом.
function sheet(
  band: Omit<Template, "build">,
  build: (rng: Rng) => {
    prompt: string;
    code: string;
    answer: number;
  },
): Template {
  return {
    ...band,
    build: (rng) => {
      return { kind: "numeric", ...build(rng) };
    },
  };
}

const specificityBasic = [
  {
    selector: "#nav .item > a:hover",
    correct: "(1, 2, 1)",
    wrong: ["(1, 1, 2)", "(1, 2, 2)", "(0, 3, 1)"],
  },
  {
    selector: "ul li.active a",
    correct: "(0, 1, 3)",
    wrong: ["(0, 1, 2)", "(0, 0, 4)", "(1, 0, 3)"],
  },
  {
    selector: ".card .title::before",
    correct: "(0, 2, 1)",
    wrong: ["(0, 3, 0)", "(0, 2, 0)", "(1, 2, 0)"],
  },
];

const specificityModern = [
  {
    selector: "#app :not(.hidden) span",
    correct: "(1, 1, 1)",
    wrong: ["(1, 0, 1)", "(1, 2, 1)", "(0, 1, 1)"],
  },
  {
    selector: ":where(#main) .btn",
    correct: "(0, 1, 0)",
    wrong: ["(1, 1, 0)", "(0, 2, 0)", "(0, 0, 0)"],
  },
  {
    selector: ":is(#main, .x) p",
    correct: "(1, 0, 1)",
    wrong: ["(0, 1, 1)", "(1, 1, 1)", "(0, 0, 1)"],
  },
];

export const css: Template[] = [
  sheet(
    { id: "css-box-content", topic: "box-model", grades: J, difficulty: 2 },
    (rng) => {
      const width = between(rng, 10, 30) * 10;
      const padding = between(rng, 1, 4) * 5;
      const border = between(rng, 1, 5);
      const margin = between(rng, 1, 4) * 10;
      return {
        prompt:
          "Сколько пикселей займёт .box по горизонтали от левого края рамки до правого?",
        code: `.box {\n  box-sizing: content-box;\n  width: ${width}px;\n  padding: ${padding}px;\n  border: ${border}px solid;\n  margin: ${margin}px;\n}`,
        answer: width + 2 * padding + 2 * border,
      };
    },
  ),
  sheet({ id: "css-rem", topic: "units", grades: J, difficulty: 2 }, (rng) => {
    const root = pick(rng, [10, 16, 20]);
    const card = pick(rng, [24, 30]);
    const size = pick(rng, [1.5, 2, 3]);
    return {
      prompt:
        "Элемент .title лежит внутри .card. Какой у него font-size в пикселях?",
      code: `html { font-size: ${root}px; }\n.card { font-size: ${card}px; }\n.title { font-size: ${size}rem; }`,
      answer: root * size,
    };
  }),
  single(
    { id: "css-inline-width", topic: "display", grades: J, difficulty: 1 },
    "Почему width: 200px не меняет ширину span?",
    "span строчный, display: inline, ширину ему задают после display: inline-block или block",
    [
      "span всегда растягивается на всю строку, его ширину задаёт родитель",
      "width работает только в процентах",
      "Ширину span задают атрибутом width в разметке",
    ],
  ),
  single(
    { id: "css-hidden", topic: "display", grades: J, difficulty: 1 },
    "Чем display: none отличается от visibility: hidden?",
    "display: none убирает элемент из раскладки, visibility: hidden прячет его, но место остаётся",
    [
      "visibility: hidden убирает элемент из раскладки, display: none оставляет место",
      "Оба оставляют место, разница только в анимации",
      "display: none прячет элемент только от скринридеров",
    ],
  ),
  {
    id: "css-inherit",
    topic: "cascade",
    grades: J,
    difficulty: 2,
    build: (rng) => {
      return {
        kind: "multiple",
        prompt: "Какие свойства наследуются от родителя по умолчанию?",
        correct: sample(
          rng,
          ["color", "font-size", "line-height", "font-family"],
          3,
        ),
        wrong: sample(
          rng,
          ["margin", "border", "background-color", "width"],
          2,
        ),
      };
    },
  },
  single(
    { id: "css-child", topic: "selectors", grades: J, difficulty: 1 },
    "Чем селектор .menu > li отличается от .menu li?",
    "> берёт только прямых детей .menu, пробел — потомков на любой глубине",
    [
      "> берёт потомков на любой глубине, пробел — только прямых детей",
      "Разницы нет, > пишут для читаемости",
      "> выбирает соседний элемент после .menu",
    ],
  ),
  single(
    { id: "css-same-weight", topic: "cascade", grades: J, difficulty: 1 },
    "Два правила с одинаковым селектором .btn задают разный color. Какое применится?",
    "То, что объявлено позже",
    [
      "То, что объявлено раньше",
      "Цвета смешаются",
      "Ни одно: браузер оставит цвет по умолчанию",
    ],
  ),
  sheet(
    {
      id: "css-margin-collapse",
      topic: "box-model",
      grades: JM,
      difficulty: 2,
    },
    (rng) => {
      const bottom = between(rng, 1, 6) * 5;
      let top = between(rng, 1, 6) * 5;
      if (top === bottom) {
        top += 10;
      }
      return {
        prompt:
          "Блоки .a и .b идут друг за другом в обычном блочном потоке, родитель не flex и не grid. Сколько пикселей между ними по вертикали?",
        code: `.a { margin-bottom: ${bottom}px; }\n.b { margin-top: ${top}px; }`,
        answer: Math.max(top, bottom),
      };
    },
  ),
  single(
    { id: "css-flex-axis", topic: "flex", grades: JM, difficulty: 2 },
    "Вдоль какой оси justify-content раскладывает элементы при flex-direction: column?",
    "Вдоль вертикальной",
    [
      "Вдоль горизонтальной",
      "Вдоль обеих сразу",
      "Ни вдоль какой: при column свойство не работает",
    ],
  ),
  single(
    { id: "css-absolute", topic: "positioning", grades: JM, difficulty: 2 },
    "Относительно чего встаёт элемент с position: absolute?",
    "Относительно ближайшего предка с position не static, а если такого нет — относительно начального блока страницы",
    [
      "Относительно своего места в потоке",
      "Всегда относительно окна браузера, даже при прокрутке",
      "Относительно непосредственного родителя, какой бы position у него ни был",
    ],
  ),
  sheet(
    { id: "css-media", topic: "responsive", grades: JM, difficulty: 2 },
    (rng) => {
      const viewport = pick(rng, [375, 600, 768, 1024, 1280]);
      return {
        prompt: `Ширина окна ${viewport}px. Какой ширины в процентах будет .col?`,
        code: ".col { width: 100%; }\n\n@media (min-width: 768px) {\n  .col { width: 50%; }\n}\n\n@media (min-width: 1200px) {\n  .col { width: 25%; }\n}",
        answer: viewport >= 1200 ? 25 : viewport >= 768 ? 50 : 100,
      };
    },
  ),
  sheet(
    { id: "css-box-border", topic: "box-model", grades: M, difficulty: 2 },
    (rng) => {
      const width = between(rng, 20, 40) * 10;
      const padding = between(rng, 1, 4) * 5;
      const border = between(rng, 1, 5);
      return {
        prompt: "Какой ширины в пикселях будет область содержимого .box?",
        code: `.box {\n  box-sizing: border-box;\n  width: ${width}px;\n  padding: ${padding}px;\n  border: ${border}px solid;\n}`,
        answer: width - 2 * padding - 2 * border,
      };
    },
  ),
  sheet({ id: "css-em", topic: "units", grades: M, difficulty: 3 }, (rng) => {
    const parent = pick(rng, [10, 12, 16, 20]);
    const size = pick(rng, [1.5, 2]);
    const space = pick(rng, [2, 3]);
    return {
      prompt: "Какой padding в пикселях получит .child внутри .parent?",
      code: `.parent { font-size: ${parent}px; }\n.child {\n  font-size: ${size}em;\n  padding: ${space}em;\n}`,
      answer: parent * size * space,
    };
  }),
  sheet(
    { id: "css-flex-grow", topic: "flex", grades: M, difficulty: 3 },
    (rng) => {
      const grows = pick(rng, [
        [1, 2, 1],
        [1, 3, 1],
        [2, 1, 1],
        [1, 1, 2],
      ]);
      const basis = pick(rng, [50, 80, 100]);
      const unit = between(rng, 2, 8) * 10;
      const free = (grows[0]! + grows[1]! + grows[2]!) * unit;
      const index = between(rng, 0, 2);
      const name = [".a", ".b", ".c"][index];
      return {
        prompt: `Какой ширины в пикселях станет ${name}? У элементов нет padding, border и margin.`,
        code: `.row { display: flex; width: ${3 * basis + free}px; }\n.a { flex: ${grows[0]} 1 ${basis}px; }\n.b { flex: ${grows[1]} 1 ${basis}px; }\n.c { flex: ${grows[2]} 1 ${basis}px; }`,
        answer: basis + grows[index]! * unit,
      };
    },
  ),
  sheet(
    { id: "css-grid-fr", topic: "grid", grades: M, difficulty: 3 },
    (rng) => {
      const fixed = pick(rng, [100, 150, 200]);
      const gap = pick(rng, [10, 20, 30]);
      const last = pick(rng, [2, 3]);
      const unit = between(rng, 10, 20) * 10;
      return {
        prompt: "Какой ширины в пикселях будет третья колонка? Ячейки пустые.",
        code: `.grid {\n  display: grid;\n  width: ${fixed + 2 * gap + (1 + last) * unit}px;\n  grid-template-columns: ${fixed}px 1fr ${last}fr;\n  column-gap: ${gap}px;\n}`,
        answer: last * unit,
      };
    },
  ),
  {
    id: "css-specificity",
    topic: "specificity",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const { selector, correct, wrong } = pick(rng, specificityBasic);
      return {
        kind: "single",
        prompt: `Какая специфичность у селектора ${selector} в формате (id, классы, типы)?`,
        correct,
        wrong,
      };
    },
  },
  single(
    { id: "css-important", topic: "cascade", grades: M, difficulty: 2 },
    'В таблице стилей .title { color: red !important; }, в разметке style="color: blue" без !important. Какого цвета будет текст?',
    "Красного: важное объявление автора сильнее обычного инлайнового",
    [
      "Синего: инлайновый стиль сильнее любого правила из файла",
      "Синего: объявление в разметке идёт позже",
      "Чёрного: при конфликте браузер сбрасывает color",
    ],
  ),
  sheet(
    {
      id: "css-custom-prop",
      topic: "custom-properties",
      grades: M,
      difficulty: 2,
    },
    (rng) => {
      const outer = pick(rng, [4, 8, 12]);
      const inner = pick(rng, [16, 20, 24]);
      const inside = rng() < 0.5;
      return {
        prompt: `Элемент .row лежит ${inside ? "внутри .card" : "вне .card"}. Какой padding в пикселях он получит?`,
        code: `:root { --gap: ${outer}px; }\n.card { --gap: ${inner}px; }\n.row { padding: var(--gap); }`,
        answer: inside ? inner : outer,
      };
    },
  ),
  single(
    { id: "css-percent-height", topic: "box-model", grades: M, difficulty: 2 },
    "У .child стоит height: 50%, а у родителя высота не задана и зависит от содержимого. Что получится?",
    "Процент не от чего считать, высота .child будет auto",
    [
      "Высота станет половиной окна браузера",
      "Высота станет половиной ширины родителя",
      "Высота станет 50px",
    ],
  ),
  single(
    { id: "css-sticky", topic: "positioning", grades: MS, difficulty: 3 },
    "У шапки таблицы position: sticky; top: 0, но при прокрутке страницы она уезжает. Частая причина?",
    "У одного из предков overflow: hidden или auto, и sticky прилипает к его прокрутке, а не к странице",
    [
      "sticky работает только вместе с z-index",
      "sticky действует только на элементы с display: inline",
      "top: 0 у sticky игнорируется, нужен margin-top",
    ],
  ),
  sheet(
    {
      id: "css-percent-padding",
      topic: "box-model",
      grades: MS,
      difficulty: 3,
    },
    (rng) => {
      const width = pick(rng, [400, 600, 800]);
      const height = pick(rng, [200, 300, 500]);
      const percent = pick(rng, [10, 25, 50]);
      return {
        prompt: "Какой padding-top в пикселях получит .child?",
        code: `.parent { width: ${width}px; height: ${height}px; }\n.child { padding-top: ${percent}%; }`,
        answer: (width * percent) / 100,
      };
    },
  ),
  single(
    { id: "css-z-trap", topic: "stacking", grades: S, difficulty: 3 },
    "В .modal (position: relative; z-index: 1) лежит .popup (position: absolute; z-index: 9999). Сосед .modal — .header (position: relative; z-index: 2), они перекрываются. Кто окажется сверху?",
    ".header: .popup заперт в контексте наложения .modal, а 1 меньше 2",
    [
      ".popup: 9999 больше 2",
      ".popup: absolute всегда рисуется над relative",
      ".modal: родитель всегда выше соседей своего ребёнка",
    ],
  ),
  {
    id: "css-stacking-context",
    topic: "stacking",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      return {
        kind: "multiple",
        prompt: "Какие свойства создают у элемента новый контекст наложения?",
        correct: sample(
          rng,
          [
            "opacity: 0.9",
            "transform: translateX(0)",
            "isolation: isolate",
            "position: fixed",
          ],
          3,
        ),
        wrong: sample(
          rng,
          ["position: relative без z-index", "display: flex", "margin: auto"],
          2,
        ),
      };
    },
  },
  {
    id: "css-specificity-modern",
    topic: "specificity",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      const { selector, correct, wrong } = pick(rng, specificityModern);
      return {
        kind: "single",
        prompt: `Какая специфичность у селектора ${selector} в формате (id, классы, типы)?`,
        correct,
        wrong,
      };
    },
  },
  single(
    { id: "css-layers", topic: "cascade", grades: S, difficulty: 3 },
    "Правило #nav a { color: red } лежит в @layer components, правило a { color: blue } — вне слоёв. Оба без !important. Какого цвета ссылка в #nav?",
    "Синего: обычные стили вне слоёв сильнее любых слоёв, специфичность сравнивают только внутри слоя",
    [
      "Красного: селектор с id сильнее",
      "Красного: правило в слое сильнее правила вне слоёв",
      "Синего: правило ниже в файле всегда сильнее",
    ],
  ),
  single(
    {
      id: "css-var-invalid",
      topic: "custom-properties",
      grades: S,
      difficulty: 3,
    },
    "Задано --size: red; и .box { width: var(--size, 10px); }. Какой будет ширина .box?",
    "auto: значение недопустимо для width, свойство сбрасывается к начальному, а запасные 10px не применяются",
    [
      "10px: при недопустимом значении берётся запасное",
      "0: недопустимая ширина превращается в ноль",
      "Правило целиком отбросится при разборе, ширину даст предыдущее правило для .box",
    ],
  ),
  single(
    { id: "css-min-width", topic: "flex", grades: S, difficulty: 3 },
    "Во flex-строке колонка с flex: 1 содержит длинный URL без пробелов и выталкивает соседей за край. Что поправить у колонки?",
    "min-width: 0: по умолчанию min-width: auto не даёт flex-элементу сжаться уже содержимого",
    [
      "flex-shrink: 0, чтобы колонка перестала сжиматься",
      "flex-basis: 100%, чтобы колонка заняла строку",
      "display: inline-flex, чтобы строка переносилась",
    ],
  ),
  single(
    { id: "css-dvh", topic: "responsive", grades: S, difficulty: 3 },
    "Экран с height: 100vh на телефоне выше видимой области, и кнопка внизу прячется под панелью браузера. Чем заменить?",
    "100dvh: высота считается по видимой сейчас области, с учётом показанной панели",
    [
      "100%: процент от окна всегда равен видимой области",
      "100vw: ширина окна на телефоне совпадает с высотой",
      "100vmax: берётся большая сторона экрана",
    ],
  ),
  multi(
    { id: "css-animate", topic: "performance", grades: S, difficulty: 3 },
    "Какие свойства анимировать, чтобы не пересчитывать раскладку на каждом кадре?",
    ["transform", "opacity"],
    ["width", "top", "margin-left"],
  ),
  single(
    { id: "css-auto-fit", topic: "grid", grades: S, difficulty: 3 },
    "В сетке repeat(auto-fit, minmax(200px, 1fr)) три карточки, а места хватает на пять колонок. Чем отличается auto-fill?",
    "auto-fill оставит пустые колонки, и карточки останутся узкими. auto-fit схлопнет пустые, и три карточки растянутся",
    [
      "auto-fill растянет три карточки, auto-fit оставит пустые колонки",
      "Разницы нет: это два названия одного режима",
      "auto-fill не создаёт колонок шире 200px, auto-fit создаёт ровно пять",
    ],
  ),
];
