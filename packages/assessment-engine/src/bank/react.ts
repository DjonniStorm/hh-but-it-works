import type { Template } from "../types";
import {
  Junior,
  Middle,
  Senior,
  code,
  numeric,
  order,
  single,
} from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

export const react: Template[] = [
  single(
    { id: "rx-jsx", topic: "jsx", grades: J, difficulty: 1 },
    "Во что обычно собирается JSX перед запуском в браузере?",
    "В вызовы функций, которые создают элементы",
    [
      "В HTML-файл, который браузер хранит как строку шаблона",
      "В SQL-запрос",
      "В CSS-класс",
    ],
  ),
  single(
    { id: "rx-props", topic: "props", grades: J, difficulty: 1 },
    "Кто меняет props компонента?",
    "Родитель, передавая новые значения. Сам компонент props не переписывает",
    [
      "Компонент через props.name = '...' ",
      "Браузер при каждом клике",
      "Только useEffect",
    ],
  ),
  single(
    { id: "rx-state", topic: "state", grades: J, difficulty: 1 },
    "Что происходит после setState с новым значением?",
    "React планирует повторный рендер этого компонента",
    [
      "Меняется только переменная, экран сам не обновляется",
      "Перезагружается вся страница",
      "Состояние пишется в localStorage",
    ],
  ),
  single(
    { id: "rx-event", topic: "event", grades: J, difficulty: 1 },
    "Как вешают обработчик клика в JSX?",
    "onClick={handler}",
    ['onclick="handler()"', "click={handler}", 'onClick="handler"'],
  ),
  single(
    { id: "rx-key", topic: "list-key", grades: J, difficulty: 1 },
    "Зачем key в списке?",
    "Чтобы React отличил элементы и не перепутал их состояние при сдвиге",
    [
      "Чтобы задать CSS-порядок",
      "key обязан быть индексом массива всегда",
      "Без key список не попадает в DOM",
    ],
  ),
  single(
    { id: "rx-fragment", topic: "fragment", grades: J, difficulty: 1 },
    "Зачем фрагмент <>...</>?",
    "Вернуть несколько узлов без лишнего DOM-элемента",
    [
      "Ускорить загрузку картинок",
      "Заменить div во всех случаях стилей",
      "Отключить повторный рендер",
    ],
  ),
  single(
    { id: "rx-img", topic: "img", grades: J, difficulty: 1 },
    "Какой атрибут у картинки в JSX обязателен по смыслу доступности?",
    "alt",
    ["title вместо alt всегда", "srcSet без alt", "loading"],
  ),
  code(
    { id: "rx-conditional", topic: "conditional", grades: J, difficulty: 1 },
    "tsx",
    "Что попадёт на экран, если ok равно false?",
    "const ok = false;\nreturn <p>{ok && 'да'}</p>;",
    "Пустой абзац, текст «да» не появится",
    ["Текст «да»", "Текст «false»", "Ошибка сборки"],
  ),
  single(
    { id: "rx-class", topic: "className", grades: J, difficulty: 1 },
    "Как в JSX задают CSS-класс?",
    "className",
    ["class как в HTML без исключений", "css=", "styleName"],
  ),
  single(
    { id: "rx-effect", topic: "effect", grades: JM, difficulty: 2 },
    "Когда срабатывает useEffect с пустым массивом зависимостей?",
    "После первого появления компонента на экране",
    [
      "Перед каждым рендером",
      "Только при размонтировании",
      "При каждом изменении любой переменной в файле",
    ],
  ),
  single(
    { id: "rx-controlled", topic: "controlled", grades: JM, difficulty: 2 },
    "Какое поле ввода контролируемое?",
    "value приходит из состояния, onChange это состояние обновляет",
    [
      "У поля есть только defaultValue",
      "Поле без value и без onChange",
      "Любое поле внутри формы",
    ],
  ),
  single(
    { id: "rx-children", topic: "children", grades: JM, difficulty: 2 },
    "Откуда берётся props.children?",
    "Из вложенной разметки между открывающим и закрывающим тегом компонента",
    [
      "Из соседнего файла автоматически",
      "Только из атрибута child",
      "Из useState родителя всегда",
    ],
  ),
  single(
    { id: "rx-context", topic: "context", grades: M, difficulty: 2 },
    "Зачем Context?",
    "Передать значение вниз по дереву без прокидывания props на каждом уровне",
    [
      "Заменить все состояния приложения",
      "Ускорить любой рендер сам по себе",
      "Хранить данные после закрытия вкладки",
    ],
  ),
  single(
    { id: "rx-memo", topic: "memo", grades: M, difficulty: 2 },
    "Когда React.memo пропускает рендер?",
    "Когда пропсы не изменились по сравнению, которое он использует",
    [
      "Всегда после первого раза",
      "Только если внутри есть useMemo",
      "Когда родитель размонтирован",
    ],
  ),
  single(
    { id: "rx-form", topic: "form", grades: M, difficulty: 2 },
    "Что сделать, чтобы отправка формы не перезагрузила страницу в обработчике onSubmit?",
    "Вызвать preventDefault у события",
    [
      "Убрать тег form",
      'Поставить type="button" на саму форму',
      "Вернуть false из JSX",
    ],
  ),
  single(
    { id: "rx-router", topic: "router", grades: M, difficulty: 2 },
    "Чем клиентский переход Link отличается от обычной ссылки <a href>?",
    "Меняется адрес и экран без полной перезагрузки документа",
    [
      "Ссылка не видна пользователю",
      "Сервер не участвует никогда, даже при первом заходе",
      "История браузера не пишется",
    ],
  ),
  single(
    { id: "rx-lazy", topic: "lazy", grades: M, difficulty: 2 },
    "Зачем React.lazy?",
    "Подгрузить код компонента отдельным куском, когда он понадобится",
    [
      "Отложить setState на секунду",
      "Спрятать компонент стилями",
      "Запретить повторный рендер",
    ],
  ),
  single(
    { id: "rx-key-reset", topic: "key-reset", grades: M, difficulty: 2 },
    "Что будет, если у компонента сменить key?",
    "React размонтирует старый экземпляр и смонтирует новый, состояние сбросится",
    [
      "Обновится только атрибут в DOM",
      "key нельзя менять после монтирования",
      "Состояние переедет в новый key само",
    ],
  ),
  single(
    { id: "rx-suspense", topic: "suspense", grades: MS, difficulty: 3 },
    "Что показывает Suspense, пока дочерний код ещё грузится?",
    "Запасной UI из fallback",
    [
      "Пустую страницу браузера",
      "Ошибку в консоли и ничего больше",
      "Предыдущий маршрут",
    ],
  ),
  single(
    { id: "rx-ref", topic: "ref", grades: MS, difficulty: 3 },
    "Для чего обычно useRef?",
    "Держать мутабельное значение или узел DOM между рендерами без лишнего рендера",
    [
      "Заменить useState для текста на экране",
      "Передать props родителю",
      "Подписаться на маршрутизатор",
    ],
  ),
  order(
    { id: "rx-reducer", topic: "reducer", grades: MS, difficulty: 3 },
    "Как течёт обновление через useReducer?",
    [
      "Событие вызывает dispatch",
      "Reducer считает следующее состояние",
      "Компонент рендерится с ним",
    ],
  ),
  single(
    { id: "rx-concurrent", topic: "concurrent", grades: S, difficulty: 3 },
    "Что даёт startTransition?",
    "Помечает обновление как несрочное: ввод остаётся отзывчивым, пока готовится тяжёлый экран",
    [
      "Отменяет все эффекты",
      "Запускает код в Web Worker сам",
      "Отключает батчинг setState",
    ],
  ),
  single(
    { id: "rx-rsc", topic: "server-component", grades: S, difficulty: 3 },
    "Чего нет у серверного компонента React?",
    "Состояния и обработчиков событий браузера: он рендерится на сервере",
    [
      "Доступа к данным на сервере",
      "Возможности вернуть разметку",
      "Импорта других серверных компонентов",
    ],
  ),
  single(
    { id: "rx-compiler", topic: "compiler", grades: S, difficulty: 3 },
    "Что React Compiler старается сделать за автора?",
    "Сам запомнить вычисления и компоненты, чтобы не писать memo вручную на каждом шагу",
    [
      "Заменить JSX на шаблоны строк",
      "Удалить все useEffect",
      "Собрать приложение без сборщика",
    ],
  ),
  single(
    { id: "rx-use-id", topic: "use-id", grades: S, difficulty: 3 },
    "Зачем useId?",
    "Стабильный идентификатор для связи label и поля, одинаковый на сервере и клиенте",
    [
      "Ключ списка вместо id сущности",
      "Идентификатор пользователя",
      "Случайное число на каждый рендер",
    ],
  ),
  single(
    { id: "rx-boundary", topic: "error-boundary", grades: S, difficulty: 3 },
    "Что ловит предохранитель ошибок?",
    "Ошибку рендера потомка и показывает запасной экран вместо падения всего дерева",
    [
      "Ошибку в обработчике клика сама по себе",
      "Любой reject промиса без настройки",
      "Ошибки в серверных логах",
    ],
  ),
  single(
    { id: "rx-portal", topic: "portal", grades: S, difficulty: 3 },
    "Куда createPortal рисует детей?",
    "В другой узел DOM, при этом в дереве React они остаются на месте вызова",
    [
      "В новый документ браузера",
      "Только в shadow root всегда",
      "Вместо родителя, связь с React рвётся",
    ],
  ),
  single(
    { id: "rx-cache", topic: "cache", grades: S, difficulty: 3 },
    "Зачем cache из React для серверной функции запроса?",
    "Повторный вызов с теми же аргументами в одном проходе отдаёт тот же результат",
    [
      "Кэш живёт в localStorage пользователя",
      "Запрос больше не ходит в сеть никогда",
      "cache заменяет useEffect на клиенте",
    ],
  ),
  single(
    { id: "rx-action", topic: "action", grades: S, difficulty: 3 },
    "Что такое action у формы в React 19?",
    "Функция, которую вызывают при отправке, в том числе на сервере",
    [
      "CSS-анимация кнопки",
      "Обязательный redux-action",
      'Атрибут method="get" под другим именем',
    ],
  ),
  single(
    { id: "rx-external", topic: "use-sync-external", grades: S, difficulty: 3 },
    "Когда нужен useSyncExternalStore?",
    "Подписка на хранилище вне React так, чтобы серверный снимок и клиент не разъехались",
    [
      "Чтобы заменить useState в форме",
      "Чтобы синхронизировать два CSS-файла",
      "Чтобы отменить Strict Mode",
    ],
  ),
  numeric(
    { id: "rx-synthetic", topic: "synthetic", grades: M, difficulty: 2 },
    "Сколько обработчиков onClick на одном элементе React позволяет повесить атрибутом onClick?",
    1,
  ),
];
