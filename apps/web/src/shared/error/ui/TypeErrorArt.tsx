// Лист с упавшим рендером: именно его показывает роутер, когда страница не собралась.
export const TypeErrorArt = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Страница упала с ошибкой</title>
      {/* Лист с загнутым углом */}
      <path
        d="M36 12 h68 l24 24 v108 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6 V18 a6 6 0 0 1 6 -6 z"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M104 12 v24 h24"
        fill="none"
        stroke="#1B1C21"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Строки трейсбека */}
      <text
        x="40"
        y="58"
        fontSize="11"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        TypeError
      </text>
      <text
        x="40"
        y="76"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#1B1C21"
      >
        reading &apos;includes&apos;
      </text>
      <text
        x="40"
        y="94"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#1B1C21"
        opacity="0.6"
      >
        at Route.render
      </text>
      <text
        x="40"
        y="110"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#1B1C21"
        opacity="0.6"
      >
        at Component
      </text>
      {/* Красный штамп поверх */}
      <path
        d="M112 112 l18 18 M130 112 l-18 18"
        stroke="#EC1D35"
        strokeWidth="7"
        strokeLinecap="round"
      >
        <animate
          attributeName="opacity"
          values="1;0.55;1"
          dur="1.8s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
};
