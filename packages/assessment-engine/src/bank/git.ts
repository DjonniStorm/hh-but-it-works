import { between, pick } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, multi, order, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

const branches = ["feature/login", "fix/cart", "feature/search", "fix/export"];
const files = ["app.ts", "config.yml", "main.py", "README.md"];

export const git: Template[] = [
  single(
    { id: "git-commit", topic: "commit", grades: J, difficulty: 1 },
    "Что сохраняет коммит?",
    "Снимок файлов из индекса, автора, сообщение и ссылку на родительский коммит",
    [
      "Все файлы рабочего каталога, включая неотслеживаемые",
      "Только изменённые строки, без ссылки на прошлый коммит",
      "Только имя ветки и время сохранения",
    ],
  ),
  single(
    { id: "git-add", topic: "staging", grades: J, difficulty: 1 },
    "Что делает git add?",
    "Кладёт текущее состояние файла в индекс для следующего коммита",
    [
      "Сразу создаёт коммит с этим файлом",
      "Отправляет файл в удалённый репозиторий",
      "Добавляет файл в .gitignore",
    ],
  ),
  single(
    { id: "git-status", topic: "status", grades: J, difficulty: 1 },
    "Какая команда покажет изменённые, подготовленные и неотслеживаемые файлы?",
    "git status",
    ["git log", "git show", "git branch"],
  ),
  {
    id: "git-switch-create",
    topic: "branch",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const branch = pick(rng, branches);
      return {
        kind: "single",
        prompt: `Как создать ветку ${branch} и сразу перейти в неё?`,
        correct: `git switch -c ${branch}`,
        wrong: [
          `git branch -m ${branch}`,
          `git merge ${branch}`,
          `git push -u origin ${branch}`,
        ],
      };
    },
  },
  single(
    { id: "git-pull", topic: "pull", grades: J, difficulty: 1 },
    "Что делает git pull?",
    "git fetch, а затем вливает полученную ветку в текущую",
    [
      "Только git fetch, рабочий каталог не меняется",
      "git push, а затем git fetch",
      "git clone поверх текущего каталога",
    ],
  ),
  single(
    { id: "git-fetch", topic: "fetch", grades: J, difficulty: 1 },
    "Что делает git fetch?",
    "Скачивает новые коммиты и обновляет ветки вроде origin/main, рабочий каталог не трогает",
    [
      "Скачивает коммиты и сразу сливает их в текущую ветку",
      "Отправляет локальные коммиты на сервер",
      "Удаляет локальные ветки, которых нет на сервере",
    ],
  ),
  single(
    { id: "git-head", topic: "head", grades: J, difficulty: 1 },
    "Что такое HEAD?",
    "Указатель на текущий коммит, обычно через текущую ветку",
    [
      "Самый первый коммит репозитория",
      "Последний коммит на сервере",
      "Другое имя ветки main",
    ],
  ),
  single(
    { id: "git-amend", topic: "amend", grades: J, difficulty: 1 },
    "Как поправить сообщение последнего коммита, который ещё не отправлен?",
    "git commit --amend",
    ["git revert HEAD", "git reset --hard HEAD~1", "git rebase --continue"],
  ),
  single(
    { id: "git-ignore-tracked", topic: "gitignore", grades: JM, difficulty: 2 },
    "Файл уже закоммичен, потом его путь добавили в .gitignore. Что будет?",
    "Git продолжит отслеживать файл, пока его не уберут из индекса через git rm --cached",
    [
      "Git сразу удалит файл из репозитория",
      "Git удалит файл с диска",
      "Файл пропадёт из всех прошлых коммитов",
    ],
  ),
  single(
    {
      id: "git-fast-forward",
      topic: "fast-forward",
      grades: JM,
      difficulty: 2,
    },
    "Когда git merge выполнит fast-forward?",
    "Когда в текущей ветке нет коммитов, которых нет во вливаемой",
    [
      "Когда в обеих ветках есть новые коммиты",
      "Только когда передан флаг --no-ff",
      "Когда нет конфликтов, независимо от истории",
    ],
  ),
  {
    id: "git-restore",
    topic: "restore",
    grades: JM,
    difficulty: 2,
    build: (rng) => {
      const file = pick(rng, files);
      return {
        kind: "single",
        prompt: `Правки в ${file} не добавлены в индекс, и они больше не нужны. Как их отбросить?`,
        correct: `git restore ${file}`,
        wrong: [
          `git restore --staged ${file}`,
          `git rm ${file}`,
          `git revert ${file}`,
        ],
      };
    },
  },
  {
    id: "git-conflict-merge",
    topic: "conflict",
    grades: JM,
    difficulty: 2,
    build: (rng) => {
      const branch = pick(rng, branches);
      return {
        kind: "single",
        prompt: `При git merge ${branch} случился конфликт. Что в файле между <<<<<<< HEAD и =======?`,
        correct: "Версия текущей ветки",
        wrong: [
          `Версия ветки ${branch}`,
          "Версия общего предка",
          "Результат автоматического слияния",
        ],
      };
    },
  },
  single(
    { id: "git-stash", topic: "stash", grades: JM, difficulty: 2 },
    "Нужно срочно переключиться на другую ветку, а правки не готовы к коммиту и терять их нельзя. Что подходит?",
    "git stash, а потом git stash pop",
    ["git reset --hard", "git clean -fd", "git restore ."],
  ),
  single(
    { id: "git-detached", topic: "detached", grades: JM, difficulty: 2 },
    "Что значит detached HEAD?",
    "HEAD указывает прямо на коммит, а не на ветку, и новые коммиты не попадут ни в одну ветку",
    [
      "Репозиторий отключён от origin",
      "Текущую ветку удалили на сервере",
      "В рабочем каталоге есть незакоммиченные правки",
    ],
  ),
  single(
    { id: "git-pre-commit", topic: "hooks", grades: JM, difficulty: 2 },
    "Какой хук срабатывает до создания коммита и может его отменить?",
    "pre-commit",
    ["post-commit", "pre-push", "post-merge"],
  ),
  single(
    { id: "git-rebase-merge", topic: "rebase", grades: M, difficulty: 2 },
    "Чем rebase отличается от merge?",
    "Rebase пересоздаёт коммиты ветки поверх новой базы с новыми хешами, merge сохраняет их и добавляет коммит слияния",
    [
      "Rebase сохраняет хеши коммитов, а merge их меняет",
      "Это одна операция, разница только в названии",
      "Rebase удаляет коммиты целевой ветки",
    ],
  ),
  single(
    {
      id: "git-rebase-shared",
      topic: "rebase-shared",
      grades: M,
      difficulty: 2,
    },
    "Почему не стоит делать rebase ветки, которую уже забрали коллеги?",
    "Коммиты получат новые хеши, и история коллег разойдётся с вашей",
    [
      "Rebase не работает с ветками, которые есть на сервере",
      "Rebase удалит коммиты на машинах коллег",
      "Сервер навсегда заблокирует ветку после rebase",
    ],
  ),
  single(
    { id: "git-reset-modes", topic: "reset", grades: M, difficulty: 2 },
    "Чем отличаются git reset --soft, --mixed и --hard HEAD~1?",
    "--soft сдвигает ветку и оставляет изменения в индексе, --mixed ещё сбрасывает индекс, --hard ещё и откатывает рабочий каталог",
    [
      "--soft откатывает рабочий каталог, --hard только сдвигает ветку",
      "--mixed удаляет коммит на сервере, остальные только локально",
      "Все три одинаково меняют файлы и отличаются только записью в логе",
    ],
  ),
  single(
    { id: "git-revert", topic: "revert", grades: M, difficulty: 2 },
    "Коммит с ошибкой уже в общей main. Как отменить его, не переписывая историю?",
    "git revert с хешем этого коммита",
    [
      "git reset --hard на коммит раньше и git push --force",
      "git commit --amend",
      "git rebase -i и удалить коммит из списка",
    ],
  ),
  single(
    { id: "git-cherry-pick", topic: "cherry-pick", grades: M, difficulty: 2 },
    "Что делает git cherry-pick с хешем коммита?",
    "Создаёт в текущей ветке новый коммит с теми же изменениями",
    [
      "Переносит коммит и удаляет его из исходной ветки",
      "Переключает HEAD на этот коммит",
      "Сливает всю ветку, в которой лежит коммит",
    ],
  ),
  {
    id: "git-bisect",
    topic: "bisect",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const suspects = between(rng, 20, 1000);
      let steps = 0;
      while (2 ** steps < suspects) {
        steps += 1;
      }
      return {
        kind: "numeric",
        prompt: `Ошибка появилась в одном из ${suspects} коммитов линейной истории. Каждая проверка git bisect делит подозрительный диапазон пополам. Сколько проверок понадобится в худшем случае, чтобы найти виновный коммит?`,
        answer: steps,
      };
    },
  },
  single(
    { id: "git-squash", topic: "squash", grades: M, difficulty: 2 },
    "Как склеить три последних коммита ветки в один перед ревью?",
    "git rebase -i HEAD~3 и пометить два последних как squash или fixup",
    [
      "git cherry-pick HEAD~3",
      "git revert HEAD~3..HEAD",
      "git merge --no-ff HEAD~3",
    ],
  ),
  {
    id: "git-range-two-dots",
    topic: "range",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const inMain = between(rng, 2, 9);
      const inFeature = between(rng, 2, 9);
      return {
        kind: "numeric",
        prompt: `main и feature разошлись: после общего коммита в main сделали ${inMain} коммитов, в feature — ${inFeature}. Сколько коммитов выведет git log main..feature?`,
        answer: inFeature,
      };
    },
  },
  single(
    { id: "git-reflog", topic: "reflog", grades: MS, difficulty: 3 },
    "После git reset --hard HEAD~3 пропали нужные коммиты, их никуда не отправляли. Как их вернуть?",
    "Найти хеш в git reflog и вернуть ветку на него через git reset --hard",
    [
      "Никак: reset --hard сразу удаляет коммиты из базы",
      "Выполнить git revert HEAD~3",
      "Скачать их заново через git fetch",
    ],
  ),
  order(
    { id: "git-rebase-flow", topic: "rebase-flow", grades: MS, difficulty: 2 },
    "Расставьте шаги: перенести свою ветку на свежий main и обновить её на сервере.",
    [
      "git fetch origin",
      "git rebase origin/main",
      "Разрешить конфликты и выполнить git add",
      "git rebase --continue",
      "git push --force-with-lease",
    ],
  ),
  single(
    { id: "git-force-lease", topic: "force-push", grades: MS, difficulty: 2 },
    "Чем git push --force-with-lease безопаснее --force?",
    "Откажет, если ветка на сервере не совпадает с вашей последней известной origin-веткой",
    [
      "Спрашивает подтверждение у владельца репозитория",
      "Сохраняет резервную копию ветки на сервере",
      "Отправляет только коммиты без конфликтов",
    ],
  ),
  single(
    { id: "git-merge-base", topic: "three-way", grades: JM, difficulty: 2 },
    "Что берёт трёхстороннее слияние, кроме вершин двух веток?",
    "Их общего предка",
    [
      "Первый коммит репозитория",
      "Последний коммит origin/main",
      "Прошлый коммит слияния в текущей ветке",
    ],
  ),
  {
    id: "git-conflict-rebase",
    topic: "conflict-rebase",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      const branch = pick(rng, branches);
      return {
        kind: "single",
        prompt: `На ветке ${branch} выполнили git rebase main и получили конфликт. Что в файле между <<<<<<< HEAD и =======?`,
        correct: `Код main вместе с уже перенесёнными коммитами ${branch}`,
        wrong: [
          `Код коммита ${branch}, который сейчас переносится`,
          "Версия общего предка",
          `Код ветки origin/${branch}`,
        ],
      };
    },
  },
  {
    id: "git-range-three-dots",
    topic: "symmetric-range",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      const inMain = between(rng, 2, 9);
      const inFeature = between(rng, 2, 9);
      return {
        kind: "numeric",
        prompt: `main и feature разошлись: после общего коммита в main сделали ${inMain} коммитов, в feature — ${inFeature}. Сколько коммитов выведет git log main...feature?`,
        answer: inMain + inFeature,
      };
    },
  },
  single(
    { id: "git-server-hooks", topic: "server-hooks", grades: S, difficulty: 3 },
    "Где проверять формат сообщений коммитов, чтобы проверку нельзя было обойти?",
    "В серверном pre-receive хуке или в CI",
    [
      "В локальном pre-commit: его нельзя отключить",
      "В commit-msg: он приезжает в каждый клон",
      "В .gitattributes репозитория",
    ],
  ),
  single(
    { id: "git-rerere", topic: "rerere", grades: S, difficulty: 3 },
    "Ветку регулярно переносят на main и каждый раз заново разрешают одни и те же конфликты. Что поможет?",
    "git rerere: он запоминает разрешения конфликтов и применяет их снова",
    [
      "git gc --aggressive",
      "git config pull.ff only",
      "git stash перед каждым rebase",
    ],
  ),
  multi(
    {
      id: "git-leaked-secret",
      topic: "leaked-secret",
      grades: S,
      difficulty: 3,
    },
    "В общий репозиторий закоммитили и отправили ключ API. Что верно?",
    [
      "Ключ нужно отозвать и выпустить новый",
      "Чтобы убрать его из истории, её переписывают, например git filter-repo, и делают force push",
    ],
    [
      "Достаточно удалить файл новым коммитом",
      "git revert убирает ключ из всех прошлых коммитов",
    ],
  ),
  single(
    { id: "git-objects", topic: "objects", grades: S, difficulty: 3 },
    "Почему переименование большого файла почти не увеличивает репозиторий?",
    "Содержимое хранится как blob по хешу, и новое дерево ссылается на тот же blob",
    [
      "Git записывает в коммит отдельную команду rename",
      "Git хранит только diff к прошлому коммиту, а у переименования он пустой",
      "Переименованные файлы Git не сохраняет в истории",
    ],
  ),
];
