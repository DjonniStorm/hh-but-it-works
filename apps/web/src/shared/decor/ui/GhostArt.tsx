// Призрак старого кода: работает на моей машине.
export const GhostArt = () => {
  return (
    <svg
      viewBox="0 0 160 160"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
    >
      {/* Табличка */}
      <rect
        x="6"
        y="6"
        width="106"
        height="32"
        rx="6"
        stroke="#281CA6"
        strokeWidth="2.5"
      />
      <text
        x="14"
        y="20"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#281CA6"
      >
        works on
      </text>
      <text
        x="14"
        y="32"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        my machine
      </text>
      {/* Призрак */}
      <path
        d="M44 150 V74 a34 34 0 0 1 68 0 v76 l-11 -10 l-11 10 l-11 -10 l-11 10 l-11 -10 l-11 10 z"
        stroke="#402FFF"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Глаза и рот */}
      <circle cx="66" cy="80" r="4" fill="#402FFF" />
      <circle cx="90" cy="80" r="4" fill="#402FFF" />
      <path
        d="M70 94 q8 8 16 0"
        stroke="#402FFF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
};
