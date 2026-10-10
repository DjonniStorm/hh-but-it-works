import { between, pick, sample } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, code, multi, order, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

function size(dims: readonly number[]): string {
  return `torch.Size([${dims.join(", ")}])`;
}

const mismatch = "RuntimeError: формы несовместимы";

// Сложение тензоров двух форм: ответ и правдоподобные ошибки.
const broadcastCases = [
  {
    left: [3, 1],
    right: [1, 4],
    correct: size([3, 4]),
    wrong: [size([3, 1]), size([1, 4]), mismatch],
  },
  {
    left: [2, 3],
    right: [3],
    correct: size([2, 3]),
    wrong: [size([3, 2]), size([2, 3, 3]), mismatch],
  },
  {
    left: [2, 3],
    right: [2],
    correct: mismatch,
    wrong: [size([2, 3]), size([2, 2, 3]), size([2, 2])],
  },
  {
    left: [4, 1, 5],
    right: [3, 1],
    correct: size([4, 3, 5]),
    wrong: [size([4, 3, 1]), size([4, 1, 5]), mismatch],
  },
  {
    left: [5],
    right: [5, 1],
    correct: size([5, 5]),
    wrong: [size([5]), size([5, 1]), mismatch],
  },
  {
    left: [8, 1, 6, 1],
    right: [7, 1, 5],
    correct: size([8, 7, 6, 5]),
    wrong: [size([8, 7, 6, 1]), size([7, 1, 6, 5]), mismatch],
  },
];

export const pytorch: Template[] = [
  {
    id: "pt-numel",
    topic: "tensors",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const dims = [between(rng, 2, 5), between(rng, 2, 5), between(rng, 2, 4)];
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Чему равно x.numel()?",
        code: `x = torch.zeros(${dims.join(", ")})`,
        answer: dims[0]! * dims[1]! * dims[2]!,
      };
    },
  },
  {
    id: "pt-matmul",
    topic: "shapes",
    grades: J,
    difficulty: 2,
    build: (rng) => {
      const [n, m, k] = sample(rng, [2, 3, 4, 5, 6, 7], 3) as [
        number,
        number,
        number,
      ];
      return {
        kind: "code",
        lang: "python",
        prompt: "Чему равна (a @ b).shape?",
        code: `a = torch.randn(${n}, ${m})\nb = torch.randn(${m}, ${k})`,
        correct: size([n, k]),
        wrong: [size([k, n]), size([n, m]), size([m, k])],
      };
    },
  },
  single(
    { id: "pt-requires-grad", topic: "autograd", grades: J, difficulty: 1 },
    "Что делает requires_grad=True у тензора?",
    "autograd записывает операции с тензором, чтобы потом посчитать по нему градиент",
    [
      "Переносит тензор на GPU",
      "Запрещает менять значения тензора",
      "Сразу считает градиент при создании тензора",
    ],
  ),
  order(
    { id: "pt-loop", topic: "training-loop", grades: J, difficulty: 1 },
    "Расставьте шаги одной итерации обучения по порядку",
    [
      "pred = model(x)",
      "loss = criterion(pred, y)",
      "loss.backward()",
      "optimizer.step()",
    ],
  ),
  single(
    { id: "pt-device", topic: "device", grades: J, difficulty: 1 },
    "Модель перенесли на cuda, а батч x остался на cpu. Что будет при model(x)?",
    "RuntimeError: тензоры на разных устройствах",
    [
      "PyTorch сам перенесёт x на GPU",
      "Модель посчитает на CPU, но медленнее",
      "Вернётся тензор из нулей",
    ],
  ),
  single(
    { id: "pt-item", topic: "tensors", grades: J, difficulty: 1 },
    "Как получить из скалярного тензора loss обычное число Python?",
    "loss.item()",
    ["loss.value", "int(loss.grad)", "loss.numpy"],
  ),
  single(
    { id: "pt-zero-grad", topic: "training-loop", grades: JM, difficulty: 2 },
    "Зачем на каждом шаге вызывать optimizer.zero_grad()?",
    "backward прибавляет градиенты к уже лежащим в .grad, без обнуления они копятся с прошлых шагов",
    [
      "Чтобы обнулить веса модели перед шагом",
      "Чтобы сбросить скорость обучения",
      "Чтобы освободить память под данные батча",
    ],
  ),
  {
    id: "pt-batches",
    topic: "dataloader",
    grades: JM,
    difficulty: 2,
    build: (rng) => {
      const batch = pick(rng, [16, 32, 64, 100]);
      // Остаток не ноль: иначе drop_last ничего не меняет.
      const total = between(rng, 5, 30) * batch + between(rng, 1, batch - 1);
      const dropLast = rng() < 0.5;
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Сколько батчей выдаст loader за одну эпоху?",
        code: `# len(dataset) == ${total}\nloader = DataLoader(dataset, batch_size=${batch}, shuffle=True, drop_last=${dropLast ? "True" : "False"})`,
        answer: dropLast ? Math.floor(total / batch) : Math.ceil(total / batch),
      };
    },
  },
  single(
    { id: "pt-eval", topic: "train-eval", grades: JM, difficulty: 2 },
    "Что меняет model.eval()?",
    "Переводит Dropout и BatchNorm в режим инференса",
    [
      "Отключает подсчёт градиентов",
      "Замораживает веса, optimizer.step() их больше не меняет",
      "Переносит модель на CPU",
    ],
  ),
  {
    id: "pt-grad",
    topic: "autograd",
    grades: JM,
    difficulty: 2,
    build: (rng) => {
      const factor = pick(rng, [2, 3, 5]);
      const value = between(rng, 1, 5);
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Чему равно x.grad.item()?",
        code: `x = torch.tensor(${value}.0, requires_grad=True)\ny = ${factor} * x ** 2 + x\ny.backward()`,
        answer: 2 * factor * value + 1,
      };
    },
  },
  {
    id: "pt-broadcast",
    topic: "broadcasting",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const { left, right, correct, wrong } = pick(rng, broadcastCases);
      return {
        kind: "code",
        lang: "python",
        prompt: "Чему равна (a + b).shape?",
        code: `a = torch.ones(${left.join(", ")}${left.length === 1 ? "," : ""})\nb = torch.ones(${right.join(", ")}${right.length === 1 ? "," : ""})`,
        correct,
        wrong,
      };
    },
  },
  single(
    { id: "pt-no-grad", topic: "train-eval", grades: M, difficulty: 2 },
    "Чем torch.no_grad() отличается от model.eval() на валидации?",
    "no_grad не строит граф и экономит память, eval переключает Dropout и BatchNorm. На валидации нужны оба",
    [
      "Это одно и то же, достаточно любого",
      "no_grad переключает Dropout, eval отключает граф",
      "eval отключает граф, а no_grad нужен только на GPU",
    ],
  ),
  {
    id: "pt-grad-accum",
    topic: "autograd",
    grades: M,
    difficulty: 3,
    build: (rng) => {
      const value = between(rng, 1, 6);
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Чему равно x.grad.item() в конце?",
        code: `x = torch.tensor(${value}.0, requires_grad=True)\nfor _ in range(2):\n    y = x ** 2\n    y.backward()`,
        answer: 4 * value,
      };
    },
  },
  {
    id: "pt-view",
    topic: "shapes",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const a = between(rng, 2, 4);
      const b = pick(rng, [3, 5]);
      const c = pick(rng, [4, 6]);
      const rows = pick(rng, [a, b, a * b]);
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Чему равно y.shape[1]?",
        code: `x = torch.zeros(${a}, ${b}, ${c})\ny = x.view(${rows}, -1)`,
        answer: (a * b * c) / rows,
      };
    },
  },
  single(
    { id: "pt-ce-input", topic: "loss", grades: M, difficulty: 2 },
    "Что подают в nn.CrossEntropyLoss для классификации на C классов?",
    "Логиты формы (N, C) без softmax и индексы классов формы (N,)",
    [
      "Вероятности после softmax и индексы классов",
      "Логиты формы (N,) и one-hot формы (N, C) всегда",
      "Вероятности после sigmoid по каждому классу",
    ],
  ),
  multi(
    { id: "pt-overfit", topic: "overfitting", grades: M, difficulty: 2 },
    "train loss падает, а val loss с десятой эпохи растёт. Что из этого помогает?",
    [
      "Остановить обучение по лучшему val loss",
      "Добавить Dropout или weight decay",
      "Добавить аугментации данных",
    ],
    ["Увеличить число эпох", "Перемешивать валидационную выборку"],
  ),
  single(
    { id: "pt-workers", topic: "dataloader", grades: M, difficulty: 2 },
    "Что даёт num_workers=4 у DataLoader?",
    "Батчи готовят четыре процесса параллельно, пока модель считает текущий батч",
    [
      "Модель обучается на четырёх GPU",
      "Батч делится на четыре части",
      "Каждый пример читается четыре раза",
    ],
  ),
  single(
    { id: "pt-dropout-random", topic: "train-eval", grades: M, difficulty: 2 },
    "Модель на инференсе даёт разные ответы на один и тот же вход. Самая частая причина?",
    "Забыли model.eval(), и Dropout продолжает случайно выключать нейроны",
    [
      "Забыли optimizer.zero_grad()",
      "Не обернули вызов в torch.no_grad()",
      "Веса модели меняются при каждом прямом проходе",
    ],
  ),
  {
    id: "pt-conv",
    topic: "shapes",
    grades: MS,
    difficulty: 3,
    build: (rng) => {
      const side = pick(rng, [28, 32, 64]);
      const kernel = pick(rng, [3, 5]);
      const padding = pick(rng, [0, 1, 2]);
      const stride = pick(rng, [1, 2]);
      return {
        kind: "numeric",
        lang: "python",
        prompt: "Чему равно y.shape[2]?",
        code: `conv = nn.Conv2d(3, 16, kernel_size=${kernel}, stride=${stride}, padding=${padding})\nx = torch.randn(8, 3, ${side}, ${side})\ny = conv(x)`,
        answer: Math.floor((side + 2 * padding - kernel) / stride) + 1,
      };
    },
  },
  code(
    { id: "pt-contiguous", topic: "shapes", grades: MS, difficulty: 3 },
    "python",
    "Что произойдёт?",
    "x = torch.randn(4, 6)\ny = x.t().view(-1)",
    "Упадёт с RuntimeError: после t() тензор не непрерывен, нужен reshape или contiguous()",
    [
      "Вернёт тензор формы (24,) в порядке строк x",
      "Вернёт тензор формы (6, 4)",
      "Вернёт копию x без изменений",
    ],
  ),
  code(
    { id: "pt-total-loss", topic: "autograd", grades: MS, difficulty: 3 },
    "python",
    "Память растёт от батча к батчу. Что не так?",
    "total = 0\nfor x, y in loader:\n    optimizer.zero_grad()\n    loss = criterion(model(x), y)\n    loss.backward()\n    optimizer.step()\n    total += loss",
    "total копит историю autograd через все батчи, нужно total += loss.item()",
    [
      "zero_grad стоит не в начале цикла",
      "loss.backward() надо вызывать после optimizer.step()",
      "criterion создаёт новую модель на каждом батче",
    ],
  ),
  single(
    { id: "pt-scheduler", topic: "training-loop", grades: MS, difficulty: 2 },
    "Где вызывать scheduler.step() для StepLR, который меняет шаг раз в эпоху?",
    "После optimizer.step(), один раз в конце эпохи",
    [
      "Перед optimizer.step() на каждом батче",
      "Перед loss.backward()",
      "Один раз до начала обучения",
    ],
  ),
  single(
    {
      id: "pt-small-batch-bn",
      topic: "normalization",
      grades: S,
      difficulty: 3,
    },
    "Модель с BatchNorm учится на батчах по 2 примера на GPU и ведёт себя нестабильно. Что поможет?",
    "Заменить BatchNorm на GroupNorm или LayerNorm либо синхронизировать статистики через SyncBatchNorm",
    [
      "Убрать model.eval() на валидации",
      "Поднять learning rate",
      "Включить shuffle=False",
    ],
  ),
  code(
    { id: "pt-inplace", topic: "autograd", grades: S, difficulty: 3 },
    "python",
    "Что произойдёт на последней строке?",
    "x = torch.randn(3, requires_grad=True)\ny = x.sigmoid()\ny.mul_(2)\ny.sum().backward()",
    "Упадёт с RuntimeError: выход sigmoid нужен для backward, а его изменили на месте",
    [
      "Градиент посчитается, x.grad будет вдвое больше",
      "Градиент посчитается так, будто mul_ не было",
      "x.grad останется None без ошибки",
    ],
  ),
  single(
    {
      id: "pt-grad-scaler",
      topic: "mixed-precision",
      grades: S,
      difficulty: 3,
    },
    "Зачем GradScaler при обучении в float16 через autocast?",
    "Малые градиенты в float16 обнуляются. Scaler умножает loss перед backward и делит градиенты перед шагом",
    [
      "Он переводит веса модели в float16, чтобы сэкономить память",
      "Он ограничивает норму градиентов, как clip_grad_norm_",
      "Он подбирает learning rate под каждый слой",
    ],
  ),
  single(
    { id: "pt-ddp-sampler", topic: "distributed", grades: S, difficulty: 3 },
    "Зачем при DistributedDataParallel DistributedSampler и вызов set_epoch каждую эпоху?",
    "Sampler даёт каждому процессу свою часть данных, set_epoch меняет перемешивание от эпохи к эпохе",
    [
      "Sampler копирует весь датасет на каждый GPU, set_epoch сохраняет чекпойнт",
      "Sampler синхронизирует градиенты, set_epoch меняет learning rate",
      "Без них DDP не запустится, других эффектов нет",
    ],
  ),
  single(
    { id: "pt-adamw", topic: "regularization", grades: S, difficulty: 3 },
    "Чем AdamW отличается от Adam с weight_decay?",
    "AdamW уменьшает веса отдельно от адаптивного шага. В Adam затухание добавляется к градиенту и масштабируется вместе с ним",
    [
      "Ничем, это псевдоним",
      "AdamW не хранит моменты градиента",
      "AdamW применяет weight decay только к bias",
    ],
  ),
  single(
    { id: "pt-pin-memory", topic: "device", grades: S, difficulty: 3 },
    "Что дают pin_memory=True у DataLoader и x.to('cuda', non_blocking=True)?",
    "Батч лежит в закреплённой памяти, и копирование на GPU идёт асинхронно, параллельно со счётом",
    [
      "Батч сразу создаётся на GPU, копирования нет",
      "Батч кешируется на диске между эпохами",
      "Копирование на GPU становится синхронным и поэтому надёжным",
    ],
  ),
  multi(
    {
      id: "pt-reproducible",
      topic: "reproducibility",
      grades: S,
      difficulty: 3,
    },
    "Что нужно, чтобы два запуска обучения дали одинаковый результат?",
    [
      "Зафиксировать seed для torch, numpy и random",
      "Передать DataLoader свой generator и задать seed воркерам",
      "Включить torch.use_deterministic_algorithms(True)",
    ],
    ["Вызвать model.eval() во время обучения", "Учить с batch_size=1"],
  ),
  code(
    { id: "pt-mse-broadcast", topic: "broadcasting", grades: S, difficulty: 3 },
    "python",
    "pred имеет форму (64, 1), target — (64,). Что не так?",
    "loss = nn.MSELoss()(pred, target)",
    "Формы растянутся до (64, 64), и loss посчитается по всем парам. Нужен pred.squeeze(1)",
    [
      "Ничего: MSELoss сам приводит формы",
      "Упадёт с RuntimeError о несовпадении форм",
      "Loss посчитается только по первому примеру",
    ],
  ),
];
