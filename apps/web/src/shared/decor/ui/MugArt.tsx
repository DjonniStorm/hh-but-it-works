// Кружка prod в пятницу вечером: контурная версия лоадера для фона.
export const MugArt = () => {
  return (
    <svg
      viewBox="0 0 160 160"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
    >
      {/* Пар */}
      <g stroke="#C8C9CA" strokeWidth="3" strokeLinecap="round">
        <path d="M56 48 q-7 -9 0 -18 q7 -9 0 -18">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M80 50 q-7 -9 0 -18 q7 -9 0 -18">
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M104 48 q-7 -9 0 -18 q7 -9 0 -18">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2.2s"
            begin="0.6s"
            repeatCount="indefinite"
          />
        </path>
      </g>
      {/* Кружка */}
      <path
        d="M34 58 h84 l-8 62 q-2 10 -12 10 H54 q-10 0 -12 -10 z"
        stroke="#402FFF"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M118 72 q22 0 20 20 q-2 16 -22 16"
        stroke="#402FFF"
        strokeWidth="3"
      />
      <text
        x="52"
        y="98"
        fontSize="12"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        prod
      </text>
      <text
        x="44"
        y="114"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        пт 18:00
      </text>
    </svg>
  );
};
