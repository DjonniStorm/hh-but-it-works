// Кот улёгся на клавиатуру: контурная версия лоадера для фона.
export const CatArt = () => {
  return (
    <svg
      viewBox="0 0 160 160"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
    >
      {/* Клавиатура */}
      <path
        d="M14 112 h132 l-12 22 H26 z"
        stroke="#281CA6"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M30 120 h100 M34 128 h92"
        stroke="#281CA6"
        strokeWidth="1.6"
        strokeDasharray="4 4"
      />
      {/* Кот сверху */}
      <ellipse
        cx="82"
        cy="108"
        rx="40"
        ry="15"
        stroke="#402FFF"
        strokeWidth="3"
      />
      <circle cx="48" cy="96" r="16" stroke="#402FFF" strokeWidth="3" />
      <path
        d="M36 86 l-3 -13 l11 8 z M56 82 l7 -12 l3 13 z"
        stroke="#402FFF"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Спящие глаза */}
      <path
        d="M41 95 q4 -4 8 0 M52 95 q4 -4 8 0"
        stroke="#402FFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Хвост */}
      <path
        d="M120 106 q20 -4 15 -24"
        stroke="#EC1D35"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Сон */}
      <text
        x="20"
        y="66"
        fontSize="12"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        z
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </text>
      <text
        x="30"
        y="52"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        z
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="2.4s"
          begin="0.8s"
          repeatCount="indefinite"
        />
      </text>
    </svg>
  );
};
