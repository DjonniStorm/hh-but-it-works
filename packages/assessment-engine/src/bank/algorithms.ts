import { type Rng, between, pick, sample, shuffle } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

const complexities = ["O(log n)", "O(n)", "O(n log n)", "O(n²)"];

type Edge = [number, number, number];

function listOf(values: readonly number[]): string {
  return `[${values.join(", ")}]`;
}

function except(values: readonly string[], correct: string): string[] {
  return values.filter((value) => {
    return value !== correct;
  });
}

// Связный граф: случайная цепочка через все вершины плюс несколько лишних рёбер.
function randomGraph(rng: Rng, size: number, extra: number): Edge[] {
  const middle = shuffle(
    rng,
    Array.from({ length: size - 2 }, (_, index) => {
      return index + 1;
    }),
  );
  const path = [0, ...middle, size - 1];
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const add = (from: number, to: number) => {
    const key = `${from}-${to}`;
    if (from === to || seen.has(key) || seen.has(`${to}-${from}`)) {
      return false;
    }
    seen.add(key);
    edges.push([from, to, between(rng, 1, 9)]);
    return true;
  };
  for (let index = 1; index < path.length; index += 1) {
    add(path[index - 1] as number, path[index] as number);
  }
  // Прямое ребро между началом и концом сделало бы ответ очевидным.
  seen.add(`0-${size - 1}`);
  let added = 0;
  while (added < extra) {
    if (add(between(rng, 0, size - 1), between(rng, 0, size - 1))) {
      added += 1;
    }
  }
  return shuffle(rng, edges);
}

function bfsDistance(size: number, edges: Edge[]): number {
  const distance = Array<number>(size).fill(-1);
  distance[0] = 0;
  const queue = [0];
  for (let head = 0; head < queue.length; head += 1) {
    const node = queue[head] as number;
    for (const [from, to] of edges) {
      const next = from === node ? to : to === node ? from : -1;
      if (next >= 0 && distance[next] === -1) {
        distance[next] = (distance[node] as number) + 1;
        queue.push(next);
      }
    }
  }
  return distance[size - 1] as number;
}

// Ориентированные рёбра, веса положительные: хватает Беллмана — Форда на |V| проходов.
function shortestPath(size: number, edges: Edge[]): number {
  const distance = Array<number>(size).fill(Infinity);
  distance[0] = 0;
  for (let round = 0; round < size; round += 1) {
    for (const [from, to, weight] of edges) {
      const candidate = (distance[from] as number) + weight;
      if (candidate < (distance[to] as number)) {
        distance[to] = candidate;
      }
    }
  }
  return distance[size - 1] as number;
}

function fewestCoins(coins: readonly number[], amount: number): number {
  const best = Array<number>(amount + 1).fill(Infinity);
  best[0] = 0;
  for (let sum = 1; sum <= amount; sum += 1) {
    for (const coin of coins) {
      if (coin <= sum) {
        best[sum] = Math.min(
          best[sum] as number,
          (best[sum - coin] as number) + 1,
        );
      }
    }
  }
  return best[amount] as number;
}

export const algorithms: Template[] = [
  {
    id: "algo-linear-search",
    topic: "linear-search",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const size = between(rng, 10, 500);
      return {
        kind: "numeric",
        prompt: `Линейный поиск в неотсортированном массиве из ${size} элементов. Сколько сравнений с искомым значением будет в худшем случае?`,
        answer: size,
      };
    },
  },
  {
    id: "algo-loop-complexity",
    topic: "complexity",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const [source, correct] = pick(rng, [
        [
          "for i in range(n):\n    for j in range(n):\n        total += i * j",
          "O(n²)",
        ],
        ["i = 1\nwhile i < n:\n    total += i\n    i *= 2", "O(log n)"],
        [
          "for i in range(n):\n    total += i\nfor j in range(n):\n    total -= j",
          "O(n)",
        ],
        [
          "for i in range(n):\n    j = 1\n    while j < n:\n        total += 1\n        j *= 2",
          "O(n log n)",
        ],
      ]) as [string, string];
      return {
        kind: "code",
        lang: "python",
        prompt: "Какая временная сложность у этого кода?",
        code: `total = 0\n${source}`,
        correct,
        wrong: except(complexities, correct),
      };
    },
  },
  single(
    { id: "algo-hash-table", topic: "hash-table", grades: J, difficulty: 1 },
    "Какая структура в среднем находит значение по ключу за O(1)?",
    "Хеш-таблица",
    [
      "Отсортированный массив",
      "Связный список",
      "Сбалансированное дерево поиска",
    ],
  ),
  single(
    { id: "algo-stack-queue", topic: "stack-queue", grades: J, difficulty: 1 },
    "Чем стек отличается от очереди?",
    "Стек отдаёт последний добавленный элемент, очередь — первый",
    [
      "Стек отдаёт первый добавленный элемент, очередь — последний",
      "Стек хранит только числа, очередь — любые значения",
      "Стек отдаёт наименьший элемент, очередь — наибольший",
    ],
  ),
  {
    id: "algo-stack-trace",
    topic: "stack-trace",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const values = sample(
        rng,
        Array.from({ length: 30 }, (_, index) => {
          return index + 1;
        }),
        5,
      );
      const pops = between(rng, 1, 3);
      const useStack = rng() < 0.5;
      const code = useStack
        ? `s = []\nfor x in ${listOf(values)}:\n    s.append(x)\n${"s.pop()\n".repeat(pops)}print(s[-1])`
        : `from collections import deque\n\nq = deque()\nfor x in ${listOf(values)}:\n    q.append(x)\n${"q.popleft()\n".repeat(pops)}print(q[0])`;
      return {
        kind: "numeric",
        prompt: "Что напечатает код?",
        code,
        lang: "python",
        answer: (useStack ? values[4 - pops] : values[pops]) as number,
      };
    },
  },
  {
    id: "algo-binary-search",
    topic: "binary-search",
    grades: JM,
    difficulty: 2,
    build: (rng) => {
      const size = between(rng, 20, 1000);
      return {
        kind: "numeric",
        prompt: `Сколько раз в худшем случае выполнится тело цикла while, если в отсортированном списке a ${size} элементов?`,
        code: "def find(a, x):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == x:\n            return mid\n        if a[mid] < x:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1",
        lang: "python",
        // Худший случай — floor(log2 n) + 1, это длина n в двоичной записи.
        answer: size.toString(2).length,
      };
    },
  },
  {
    id: "algo-triangle",
    topic: "count-loop",
    grades: JM,
    difficulty: 2,
    build: (rng) => {
      const size = between(rng, 5, 30);
      const inclusive = rng() < 0.5;
      return {
        kind: "numeric",
        prompt: "Что напечатает код?",
        code: `count = 0\nfor i in range(${size}):\n    for j in range(${inclusive ? "i + 1" : "i"}):\n        count += 1\nprint(count)`,
        lang: "python",
        answer: inclusive ? (size * (size + 1)) / 2 : (size * (size - 1)) / 2,
      };
    },
  },
  single(
    { id: "algo-stable-sort", topic: "stable-sort", grades: JM, difficulty: 2 },
    "Какая сортировка устойчивая, то есть не меняет порядок равных элементов?",
    "Сортировка слиянием",
    [
      "Пирамидальная сортировка",
      "Сортировка выбором с обменом",
      "Классическая быстрая сортировка",
    ],
  ),
  single(
    { id: "algo-bfs", topic: "bfs", grades: JM, difficulty: 2 },
    "Какой алгоритм находит кратчайший по числу рёбер путь в невзвешенном графе?",
    "Поиск в ширину (BFS)",
    ["Поиск в глубину (DFS)", "Топологическая сортировка", "Бинарный поиск"],
  ),
  single(
    { id: "algo-duplicates", topic: "duplicates", grades: JM, difficulty: 2 },
    "Как в среднем за O(n) проверить, есть ли в списке повторы?",
    "Складывать элементы в множество и проверять, был ли уже такой",
    [
      "Сравнить каждый элемент с каждым",
      "Применить бинарный поиск к неотсортированному списку",
      "Развернуть список и сравнить с исходным",
    ],
  ),
  single(
    { id: "algo-quick-worst", topic: "quicksort", grades: M, difficulty: 2 },
    "Когда быстрая сортировка с опорным первым элементом работает за O(n²)?",
    "На уже отсортированном массиве",
    [
      "На массиве из случайных различных чисел",
      "Никогда: в худшем случае она тоже O(n log n)",
      "Только на массиве из двух элементов",
    ],
  ),
  {
    id: "algo-bfs-distance",
    topic: "bfs-distance",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const edges = randomGraph(rng, 7, between(rng, 2, 4));
      const pairs = edges.map(([from, to]) => {
        return `(${from}, ${to})`;
      });
      return {
        kind: "numeric",
        prompt:
          "Граф неориентированный, рёбра перечислены в списке. Сколько рёбер в кратчайшем пути от вершины 0 до вершины 6?",
        code: `edges = [${pairs.join(", ")}]`,
        lang: "python",
        answer: bfsDistance(7, edges),
      };
    },
  },
  {
    id: "algo-stairs",
    topic: "dp-stairs",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const steps = between(rng, 5, 20);
      let previous = 1;
      let current = 1;
      for (let step = 2; step <= steps; step += 1) {
        [previous, current] = [current, previous + current];
      }
      return {
        kind: "numeric",
        prompt: `В лестнице ${steps} ступеней, за один шаг можно подняться на одну или на две. Сколькими способами можно подняться наверх?`,
        answer: current,
      };
    },
  },
  {
    id: "algo-two-pointers",
    topic: "two-pointers",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const values = sample(
        rng,
        Array.from({ length: 40 }, (_, index) => {
          return index + 1;
        }),
        8,
      ).sort((left, right) => {
        return left - right;
      });
      const [first, second] = sample(rng, values, 2) as [number, number];
      const target = rng() < 0.75 ? first + second : between(rng, 10, 70);
      let i = 0;
      let j = values.length - 1;
      let sums = 0;
      while (i < j) {
        const sum = (values[i] as number) + (values[j] as number);
        sums += 1;
        if (sum === target) {
          break;
        }
        if (sum < target) {
          i += 1;
        } else {
          j -= 1;
        }
      }
      return {
        kind: "numeric",
        prompt: "Сколько раз будет вычислена сумма s при этом вызове?",
        code: `def pair(a, t):\n    i, j = 0, len(a) - 1\n    while i < j:\n        s = a[i] + a[j]\n        if s == t:\n            return i, j\n        if s < t:\n            i += 1\n        else:\n            j -= 1\n    return None\n\npair(${listOf(values)}, ${target})`,
        lang: "python",
        answer: sums,
      };
    },
  },
  single(
    { id: "algo-memo", topic: "memoization", grades: M, difficulty: 2 },
    "Наивная рекурсия fib(n) = fib(n - 1) + fib(n - 2) работает за экспоненциальное время. Какой станет сложность с мемоизацией?",
    "O(n)",
    ["O(log n)", "O(n²)", "O(2ⁿ)"],
  ),
  single(
    { id: "algo-collisions", topic: "collisions", grades: M, difficulty: 2 },
    "Когда поиск в хеш-таблице деградирует до O(n)?",
    "Когда из-за коллизий много ключей попадает в одну корзину",
    [
      "Когда ключи — строки, а не числа",
      "Когда таблица заполнена меньше чем наполовину",
      "Когда ключи добавляли по возрастанию",
    ],
  ),
  single(
    { id: "algo-amortized", topic: "amortized", grades: M, difficulty: 2 },
    "Динамический массив при переполнении удваивает ёмкость и копирует элементы. Какая амортизированная стоимость добавления в конец?",
    "O(1)",
    ["O(log n)", "O(n)", "O(n log n)"],
  ),
  single(
    { id: "algo-topological", topic: "topological", grades: M, difficulty: 2 },
    "Для какого графа существует топологическая сортировка?",
    "Для ориентированного графа без циклов",
    [
      "Для любого связного графа",
      "Только для двоичного дерева",
      "Для неориентированного графа с циклом",
    ],
  ),
  single(
    { id: "algo-heap", topic: "heap", grades: M, difficulty: 2 },
    "Какая структура даёт минимум за O(1) и его извлечение за O(log n)?",
    "Двоичная куча",
    ["Неотсортированный массив", "Хеш-таблица", "Стек"],
  ),
  single(
    {
      id: "algo-dfs-memory",
      topic: "recursion-memory",
      grades: M,
      difficulty: 2,
    },
    "Сколько дополнительной памяти тратит рекурсивный DFS на графе-цепочке из n вершин?",
    "O(n): глубина стека вызовов растёт до n",
    [
      "O(1): рекурсия не тратит память",
      "O(log n): стек растёт как у бинарного поиска",
      "O(n²): каждый вызов копирует весь граф",
    ],
  ),
  single(
    { id: "algo-sort-bound", topic: "sort-bound", grades: MS, difficulty: 3 },
    "Почему сортировку сравнениями нельзя сделать быстрее O(n log n) в худшем случае?",
    "Ей нужно различить n! перестановок, а каждое сравнение делит варианты максимум надвое: log₂(n!) ≈ n log n",
    [
      "Процессор сравнивает за такт только два числа",
      "Любой рекурсивный алгоритм работает не быстрее n log n",
      "Можно: быстрая сортировка в худшем случае работает за O(n)",
    ],
  ),
  {
    id: "algo-dijkstra",
    topic: "dijkstra",
    grades: MS,
    difficulty: 3,
    build: (rng) => {
      const edges = randomGraph(rng, 6, between(rng, 4, 6));
      const triples = edges.map(([from, to, weight]) => {
        return `(${from}, ${to}, ${weight})`;
      });
      return {
        kind: "numeric",
        prompt:
          "Рёбра ориентированные: (откуда, куда, вес). Какая длина кратчайшего пути от вершины 0 до вершины 5?",
        code: `edges = [${triples.join(", ")}]`,
        lang: "python",
        answer: shortestPath(6, edges),
      };
    },
  },
  single(
    {
      id: "algo-negative",
      topic: "negative-weights",
      grades: MS,
      difficulty: 3,
    },
    "Почему алгоритм Дейкстры не годится для графа с отрицательными весами?",
    "Он считает вершину готовой при извлечении, а отрицательное ребро позже может дать путь короче",
    [
      "Он не работает с ориентированными графами",
      "Он работает только на деревьях",
      "Ему нужна матрица смежности, а не списки",
    ],
  ),
  {
    id: "algo-coins",
    topic: "dp-coins",
    grades: MS,
    difficulty: 3,
    build: (rng) => {
      const coins = pick(rng, [
        [1, 3, 4],
        [1, 5, 6, 9],
        [1, 7, 10],
      ]);
      const amount = between(rng, 11, 40);
      return {
        kind: "numeric",
        prompt: `Есть монеты номиналом ${coins.join(", ")}, каждой сколько угодно. Каким наименьшим числом монет набрать ровно ${amount}?`,
        answer: fewestCoins(coins, amount),
      };
    },
  },
  {
    id: "algo-fib-calls",
    topic: "recursion-calls",
    grades: MS,
    difficulty: 3,
    build: (rng) => {
      const n = between(rng, 4, 10);
      const calls = [1, 1];
      for (let index = 2; index <= n; index += 1) {
        calls.push(
          1 + (calls[index - 1] as number) + (calls[index - 2] as number),
        );
      }
      return {
        kind: "numeric",
        prompt: "Сколько раз всего будет вызвана f, считая первый вызов?",
        code: `def f(n):\n    if n < 2:\n        return n\n    return f(n - 1) + f(n - 2)\n\nf(${n})`,
        lang: "python",
        answer: calls[n] as number,
      };
    },
  },
  {
    id: "algo-recurrence",
    topic: "recurrence",
    grades: MS,
    difficulty: 3,
    build: (rng) => {
      const [recurrence, correct] = pick(rng, [
        ["T(n) = 2T(n/2) + O(n)", "O(n log n)"],
        ["T(n) = 2T(n/2) + O(1)", "O(n)"],
        ["T(n) = T(n/2) + O(1)", "O(log n)"],
        ["T(n) = T(n/2) + O(n)", "O(n)"],
        ["T(n) = 4T(n/2) + O(n)", "O(n²)"],
      ]) as [string, string];
      return {
        kind: "single",
        prompt: `Время работы задано рекуррентой ${recurrence}. Какая итоговая сложность?`,
        correct,
        wrong: except(complexities, correct),
      };
    },
  },
  {
    id: "algo-inversions",
    topic: "inversions",
    grades: MS,
    difficulty: 3,
    build: (rng) => {
      const values = sample(
        rng,
        Array.from({ length: 20 }, (_, index) => {
          return index + 1;
        }),
        6,
      );
      let swaps = 0;
      for (let left = 0; left < values.length; left += 1) {
        for (let right = left + 1; right < values.length; right += 1) {
          if ((values[left] as number) > (values[right] as number)) {
            swaps += 1;
          }
        }
      }
      return {
        kind: "numeric",
        prompt: `Сколько обменов соседних элементов сделает сортировка пузырьком, упорядочивая по возрастанию ${listOf(values)}?`,
        answer: swaps,
      };
    },
  },
  {
    id: "algo-merge",
    topic: "merge",
    grades: MS,
    difficulty: 2,
    build: (rng) => {
      const left = between(rng, 3, 12);
      const right = between(rng, 3, 12);
      return {
        kind: "numeric",
        prompt: `Сколько сравнений в худшем случае нужно, чтобы слить отсортированные массивы длиной ${left} и ${right} в один отсортированный?`,
        answer: left + right - 1,
      };
    },
  },
  {
    id: "algo-dynamic-array",
    topic: "dynamic-array",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      const inserts = between(rng, 10, 200);
      let capacity = 1;
      let copies = 0;
      for (let size = 0; size < inserts; size += 1) {
        if (size === capacity) {
          copies += size;
          capacity *= 2;
        }
      }
      return {
        kind: "numeric",
        prompt: `Динамический массив начинается с ёмкости 1. Если при добавлении места нет, он выделяет вдвое больше и копирует туда все элементы. Сколько всего копирований элементов будет за ${inserts} добавлений в пустой массив?`,
        answer: copies,
      };
    },
  },
  single(
    { id: "algo-top-k", topic: "top-k", grades: S, difficulty: 3 },
    "Нужны 10 самых больших чисел из потока в миллиард значений, памяти мало. Что подходит?",
    "Мин-куча на 10 элементов: новое число вытесняет минимум, если оно больше",
    [
      "Отсортировать весь поток и взять последние 10",
      "Макс-куча на 10 элементов: новое число вытесняет максимум, если оно меньше",
      "Хеш-таблица, куда складываются все числа потока",
    ],
  ),
  single(
    { id: "algo-dfs-cycle", topic: "cycle", grades: S, difficulty: 3 },
    "Как поиском в глубину найти цикл в ориентированном графе?",
    "Найти ребро в вершину, которая ещё в текущем стеке рекурсии",
    [
      "Найти ребро в любую уже посещённую вершину",
      "Проверить, что рёбер больше, чем вершин",
      "Найти вершину, из которой не выходит ни одного ребра",
    ],
  ),
];
