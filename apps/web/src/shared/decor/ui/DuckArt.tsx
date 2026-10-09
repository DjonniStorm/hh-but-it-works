// Утка для rubber-duck debugging: контурная версия лоадера для фона.
export const DuckArt = () => {
  return (
    <svg
      viewBox="0 0 160 160"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
    >
      {/* Пузырь реплики */}
      <path
        d="M92 14 h54 v28 h-36 l-10 10 v-10 h-8 z"
        stroke="#402FFF"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text
        x="98"
        y="28"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#281CA6"
      >
        у меня
      </text>
      <text
        x="98"
        y="39"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        работает
      </text>
      {/* Тело */}
      <ellipse
        cx="62"
        cy="108"
        rx="40"
        ry="26"
        stroke="#402FFF"
        strokeWidth="3"
      />
      <circle cx="94" cy="78" r="23" stroke="#402FFF" strokeWidth="3" />
      <path
        d="M113 74 L148 82 L113 92 Z"
        stroke="#EC1D35"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="101" cy="72" r="3" fill="#402FFF" />
      <path
        d="M46 102 q14 -12 30 -2 q-14 12 -30 2 z"
        stroke="#281CA6"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Вода */}
      <path
        d="M12 140 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0"
        stroke="#402FFF"
        strokeWidth="2"
        opacity="0.55"
      />
    </svg>
  );
};
