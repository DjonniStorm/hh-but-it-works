import { between, pick } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, multi, order, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

const namespaces = ["payments", "billing", "orders", "search"];
const pods = ["api-7d9f", "worker-5c2a", "gateway-6b1e"];

export const kubernetes: Template[] = [
  single(
    { id: "k8s-pod", topic: "pod", grades: J, difficulty: 1 },
    "Что такое Pod?",
    "Минимальная единица запуска: один или несколько контейнеров с общей сетью и томами",
    [
      "Физический или виртуальный узел кластера",
      "Образ контейнера, загруженный в реестр",
      "Набор правил балансировки входящего трафика",
    ],
  ),
  single(
    { id: "k8s-deployment", topic: "deployment", grades: J, difficulty: 1 },
    "Зачем нужен Deployment?",
    "Держит заданное число реплик подов и обновляет их по шаблону",
    [
      "Даёт подам постоянное DNS-имя внутри кластера",
      "Хранит конфигурацию приложения парами ключ-значение",
      "Выделяет подам постоянный диск под данные",
    ],
  ),
  single(
    { id: "k8s-service", topic: "service", grades: J, difficulty: 1 },
    "Зачем нужен Service?",
    "Даёт стабильное имя и адрес для набора подов, выбранных по меткам",
    [
      "Перезапускает упавшие контейнеры",
      "Собирает образ из исходного кода",
      "Хранит пароли в зашифрованном виде",
    ],
  ),
  single(
    { id: "k8s-service-type", topic: "service-type", grades: J, difficulty: 1 },
    "Какой тип Service создаётся, если поле type не указано?",
    "ClusterIP",
    ["NodePort", "LoadBalancer", "ExternalName"],
  ),
  {
    id: "k8s-get-pods",
    topic: "kubectl",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const namespace = pick(rng, namespaces);
      return {
        kind: "single",
        prompt: `Какая команда покажет поды в пространстве имён ${namespace}?`,
        correct: `kubectl get pods -n ${namespace}`,
        wrong: [
          `kubectl list pods ${namespace}`,
          `kubectl describe namespace ${namespace}`,
          `kubectl get namespace ${namespace} --pods`,
        ],
      };
    },
  },
  single(
    { id: "k8s-configmap", topic: "configmap", grades: J, difficulty: 1 },
    "Где хранить несекретную настройку приложения, например адрес внешнего сервиса?",
    "В ConfigMap",
    ["В PersistentVolumeClaim", "В ServiceAccount", "В аннотации узла"],
  ),
  {
    id: "k8s-replicas",
    topic: "replicas",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const replicas = between(rng, 2, 6);
      return {
        kind: "numeric",
        prompt: `У Deployment replicas: ${replicas}. Один под удалили вручную через kubectl delete pod. Сколько подов будет работать, когда контроллер отработает?`,
        answer: replicas,
      };
    },
  },
  single(
    { id: "k8s-namespace", topic: "namespace", grades: J, difficulty: 1 },
    "Для чего пространства имён (Namespace)?",
    "Делят кластер на группы ресурсов со своими именами, квотами и правами",
    [
      "Без настроек полностью закрывают сеть между подами разных пространств",
      "Задают версию API, по которой описан ресурс",
      "Привязывают поды к конкретным узлам кластера",
    ],
  ),
  single(
    { id: "k8s-apply", topic: "apply", grades: J, difficulty: 1 },
    "Что делает kubectl apply -f deploy.yaml?",
    "Приводит объекты в кластере к описанию из файла: создаёт новые или обновляет",
    [
      "Только проверяет синтаксис файла и ничего не меняет",
      "Удаляет все объекты пространства имён и создаёт заново",
      "Собирает образ по описанию из файла",
    ],
  ),
  single(
    { id: "k8s-image-pull", topic: "image-pull", grades: J, difficulty: 1 },
    "Под висит в статусе ImagePullBackOff. Что проверить первым?",
    "Имя и тег образа и доступ узла к реестру",
    [
      "Лимит памяти контейнера",
      "Настройки liveness-пробы",
      "Число реплик в Deployment",
    ],
  ),
  {
    id: "k8s-logs-previous",
    topic: "logs",
    grades: JM,
    difficulty: 2,
    build: (rng) => {
      const pod = pick(rng, pods);
      return {
        kind: "single",
        prompt: `Контейнер в поде ${pod} упал и перезапустился. Как посмотреть логи именно упавшего запуска?`,
        correct: `kubectl logs ${pod} --previous`,
        wrong: [
          `kubectl logs ${pod}`,
          `kubectl describe pod ${pod} --logs`,
          `kubectl get events ${pod}`,
        ],
      };
    },
  },
  single(
    { id: "k8s-crashloop", topic: "crashloop", grades: JM, difficulty: 2 },
    "Под в статусе CrashLoopBackOff. Что это значит?",
    "Контейнер запускается и падает, kubelet перезапускает его с растущей паузой",
    [
      "Образ не удаётся скачать из реестра",
      "Для пода не нашлось узла со свободными ресурсами",
      "Под ждёт, пока освободится его том",
    ],
  ),
  single(
    { id: "k8s-rollback", topic: "rollback", grades: JM, difficulty: 2 },
    "Новая версия Deployment api сломалась. Как вернуть прошлую ревизию?",
    "kubectl rollout undo deployment/api",
    [
      "kubectl rollback deployment/api",
      "kubectl delete deployment/api --previous",
      "kubectl apply --undo deployment/api",
    ],
  ),
  single(
    { id: "k8s-pending", topic: "pending", grades: JM, difficulty: 2 },
    "Под долго в Pending, в событиях: 0/3 nodes are available: insufficient memory. Что это значит?",
    "Ни на одном узле не хватает незанятой памяти под requests пода",
    [
      "Контейнер превысил limits.memory и был убит",
      "Образ слишком большой для диска узла",
      "Узлы кластера недоступны по сети",
    ],
  ),
  single(
    { id: "k8s-probes", topic: "probes", grades: M, difficulty: 2 },
    "Чем readiness-проба отличается от liveness?",
    "Провал readiness убирает под из балансировки Service, провал liveness перезапускает контейнер",
    [
      "Провал liveness убирает под из балансировки, провал readiness перезапускает контейнер",
      "Обе перезапускают контейнер и отличаются только периодом",
      "Readiness проверяется один раз при старте, liveness — всё время работы",
    ],
  ),
  single(
    { id: "k8s-cpu-limit", topic: "cpu-limit", grades: M, difficulty: 2 },
    "Что происходит, когда контейнер упирается в limits.cpu?",
    "Его троттлят: он получает меньше процессорного времени, но продолжает работать",
    [
      "Его убивают со статусом OOMKilled",
      "Под вытесняют с узла и создают заново",
      "Под переносят на узел с большим числом ядер",
    ],
  ),
  single(
    { id: "k8s-requests", topic: "requests", grades: M, difficulty: 2 },
    "На что влияет resources.requests?",
    "Планировщик ставит под только на узел, где столько ресурсов ещё не занято запросами других подов",
    [
      "Это верхняя граница: выше неё процесс не сможет потреблять",
      "Это объём, который под отдаст первым при нехватке на узле",
      "Это нужно только HPA, планировщик это поле не смотрит",
    ],
  ),
  multi(
    { id: "k8s-secret", topic: "secret", grades: M, difficulty: 2 },
    "Что верно про Secret без дополнительной настройки кластера?",
    [
      "Значения в манифесте закодированы в base64, это не шифрование",
      "Кто может читать Secret, ограничивают через RBAC",
    ],
    [
      "etcd всегда хранит Secret в зашифрованном виде",
      "Под видит любой Secret кластера без ссылки на него",
    ],
  ),
  {
    id: "k8s-dns",
    topic: "dns",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const [from, to] = pick(rng, [
        ["web", "payments"],
        ["orders", "billing"],
        ["search", "catalog"],
      ]) as [string, string];
      const service = pick(rng, ["postgres", "redis", "auth"]);
      return {
        kind: "single",
        prompt: `Под из пространства имён ${from} ходит в Service ${service} из пространства ${to}. Какое имя сработает?`,
        correct: `${service}.${to}`,
        wrong: [`${service}`, `${to}.${service}`, `${service}.${from}`],
      };
    },
  },
  single(
    { id: "k8s-ingress", topic: "ingress", grades: M, difficulty: 2 },
    "Чем Ingress отличается от Service типа LoadBalancer?",
    "Ingress разводит HTTP-запросы по хосту и пути на разные Service через одну точку входа",
    [
      "Ingress работает на уровне TCP и не видит путь запроса",
      "Ingress заменяет Service, и поды в нём указывают напрямую",
      "Ingress выдаёт каждому поду свой внешний IP",
    ],
  ),
  {
    id: "k8s-node-fit",
    topic: "scheduling",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const allocatable = pick(rng, [2000, 4000, 8000]);
      const system = pick(rng, [100, 200, 300]);
      const request = pick(rng, [250, 300, 500, 750]);
      return {
        kind: "numeric",
        prompt: `На узле allocatable CPU ${allocatable}m, системные поды уже запросили ${system}m. У пода requests.cpu: ${request}m, limits.cpu: ${request * 2}m. Памяти хватает с запасом. Сколько таких подов планировщик поставит на узел?`,
        answer: Math.floor((allocatable - system) / request),
      };
    },
  },
  {
    id: "k8s-surge",
    topic: "rolling-update",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const replicas = between(rng, 4, 12);
      const surge = between(rng, 1, 3);
      const unavailable = between(rng, 0, 2);
      return {
        kind: "numeric",
        prompt: `Deployment: replicas ${replicas}, RollingUpdate с maxSurge ${surge} и maxUnavailable ${unavailable}. Сколько подов максимум, старых и новых вместе, может быть запущено одновременно во время раскатки?`,
        answer: replicas + surge,
      };
    },
  },
  {
    id: "k8s-oom",
    topic: "oom",
    grades: MS,
    difficulty: 2,
    build: (rng) => {
      const memory = pick(rng, [256, 512, 1024]);
      return {
        kind: "single",
        prompt: `У контейнера limits.memory: ${memory}Mi, процесс занял больше. Что произойдёт?`,
        correct:
          "Процесс убьют, статус OOMKilled, контейнер перезапустится по restartPolicy",
        wrong: [
          "Процесс притормозят, пока он не освободит память",
          "Под переедет на узел, где памяти больше",
          "Лимит поднимется до значения из requests",
        ],
      };
    },
  },
  single(
    {
      id: "k8s-configmap-env",
      topic: "configmap-update",
      grades: MS,
      difficulty: 3,
    },
    "ConfigMap подключён к поду как переменные окружения через envFrom. ConfigMap изменили. Когда приложение увидит новые значения?",
    "Только после перезапуска контейнера",
    [
      "Сразу: переменные обновятся в работающем процессе",
      "Через период синхронизации kubelet, около минуты",
      "После kubectl apply процесс получит SIGHUP и перечитает их",
    ],
  ),
  single(
    { id: "k8s-statefulset", topic: "statefulset", grades: MS, difficulty: 2 },
    "Когда нужен StatefulSet, а не Deployment?",
    "Когда подам нужны стабильные имена и свой том у каждой реплики, как у кластера базы",
    [
      "Когда реплики не хранят состояние и взаимозаменяемы",
      "Когда под должен работать на каждом узле кластера",
      "Когда задача должна один раз выполниться и завершиться",
    ],
  ),
  {
    id: "k8s-hpa",
    topic: "hpa",
    grades: MS,
    difficulty: 3,
    build: (rng) => {
      const target = pick(rng, [50, 60, 70, 80]);
      const replicas = between(rng, 2, 8);
      // Отношение 1.2–2: HPA точно масштабирует, а политика по умолчанию не режет шаг.
      const current = Math.round((target * between(rng, 12, 20)) / 10);
      return {
        kind: "numeric",
        prompt: `HPA держит среднюю загрузку CPU на ${target} % от requests. Сейчас ${replicas} подов, средняя загрузка ${current} %. Сколько реплик посчитает HPA? minReplicas 1, maxReplicas 30.`,
        answer: Math.ceil((replicas * current) / target),
      };
    },
  },
  single(
    { id: "k8s-rbac", topic: "rbac", grades: MS, difficulty: 2 },
    "Сервис-аккаунту нужно только читать поды в своём пространстве имён. Что выдать?",
    "Role с get, list и watch на pods и RoleBinding на этот сервис-аккаунт",
    [
      "ClusterRole cluster-admin и ClusterRoleBinding",
      "Role с правами на pods и ClusterRoleBinding на неё",
      "Secret с токеном администратора, смонтированный в под",
    ],
  ),
  {
    id: "k8s-surge-percent",
    topic: "rolling-percent",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      const replicas = pick(rng, [5, 6, 7, 9, 10, 11, 13, 14, 15]);
      const askAvailable = rng() < 0.5;
      return {
        kind: "numeric",
        prompt: askAvailable
          ? `Deployment на ${replicas} реплик, RollingUpdate с maxSurge и maxUnavailable по 25 %. Ниже скольких доступных подов контроллер не опустится во время раскатки?`
          : `Deployment на ${replicas} реплик, RollingUpdate с maxSurge и maxUnavailable по 25 %. На сколько подов сверх replicas контроллер может подняться во время раскатки?`,
        answer: askAvailable
          ? replicas - Math.floor(replicas / 4)
          : Math.ceil(replicas / 4),
      };
    },
  },
  single(
    { id: "k8s-qos", topic: "qos", grades: S, difficulty: 3 },
    "Узлу не хватает памяти. Чьи поды kubelet вытеснит первыми при прочих равных?",
    "BestEffort: без requests и limits",
    [
      "Guaranteed: requests равны limits",
      "Burstable: requests меньше limits",
      "Те, у которых больше всего рестартов",
    ],
  ),
  order(
    { id: "k8s-termination", topic: "termination", grades: S, difficulty: 3 },
    "Расставьте по порядку, что происходит при удалении пода.",
    [
      "Под помечается удаляемым и переходит в Terminating",
      "Выполняется preStop-хук",
      "Контейнер получает SIGTERM",
      "Истекает terminationGracePeriodSeconds",
      "Оставшиеся процессы получают SIGKILL",
    ],
  ),
  single(
    { id: "k8s-endpoint-race", topic: "graceful", grades: S, difficulty: 3 },
    "При раскатке часть запросов получает 502: под уже получил SIGTERM, а трафик на него ещё идёт. Что помогает?",
    "preStop с короткой паузой, чтобы Service и балансировщики успели убрать под из эндпоинтов",
    [
      "Увеличить задержку liveness-пробы до нескольких минут",
      "Поставить maxUnavailable равным числу реплик",
      "Убрать readiness-пробу, чтобы под не выпадал из Service",
    ],
  ),
  single(
    { id: "k8s-pdb", topic: "pdb", grades: S, difficulty: 2 },
    "Зачем PodDisruptionBudget?",
    "Ограничивает, сколько подов можно одновременно выселить добровольно, например при drain узла",
    [
      "Ограничивает расход CPU и памяти пода",
      "Запрещает ядру убивать поды при нехватке памяти",
      "Задаёт порядок обновления подов в Deployment",
    ],
  ),
  single(
    { id: "k8s-throttling", topic: "throttling", grades: S, difficulty: 3 },
    "У сервиса на Go limits.cpu: 1, средняя загрузка CPU 40 %, но бывают пики задержки по сотне миллисекунд. Что вероятнее всего?",
    "CFS-троттлинг: потоки выбирают квоту в начале периода и ждут следующего",
    [
      "OOMKilled и перезапуск контейнера",
      "Readiness-проба выключает под из Service",
      "Планировщик переносит под между узлами",
    ],
  ),
  single(
    { id: "k8s-netpol", topic: "network-policy", grades: S, difficulty: 3 },
    "В пространстве имён создали NetworkPolicy: она выбирает поды app=db и разрешает входящий трафик только от app=api. Что станет с входящим трафиком к db от остальных подов?",
    "Будет запрещён, если сетевой плагин поддерживает NetworkPolicy",
    [
      "Останется разрешён: политика только добавляет правила",
      "Будет запрещён весь трафик к db, включая от api",
      "Будет запрещён исходящий трафик db, входящий не изменится",
    ],
  ),
];
