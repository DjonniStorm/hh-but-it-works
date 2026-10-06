// Та же утка, что в DuckLoader, только кабель выдернут: сеть или сервер не ответили.
export const UnpluggedDuckArt = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Утка выдернула кабель</title>
      <rect
        x="74"
        y="8"
        width="80"
        height="40"
        rx="8"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      <text
        x="82"
        y="25"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        fill="#1B1C21"
      >
        а сеть
      </text>
      <text
        x="82"
        y="39"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        не отвечает
      </text>
      <ellipse
        cx="58"
        cy="112"
        rx="40"
        ry="26"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="3"
      />
      <circle
        cx="92"
        cy="80"
        r="24"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="3"
      />
      <path d="M112 76 L146 84 L112 94 Z" fill="#EC1D35" />
      {/* Глаза-крестики: утка растеряна. */}
      <path
        d="M96 70 l8 8 M104 70 l-8 8"
        stroke="#1B1C21"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Кабель от утки и вилка рядом, не в розетке. */}
      <path
        d="M30 122 C10 130 12 148 34 148 H62"
        fill="none"
        stroke="#1B1C21"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="62" y="140" width="16" height="16" rx="3" fill="#402FFF" />
      <path
        d="M78 144 h8 M78 152 h8"
        stroke="#1B1C21"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect
        x="112"
        y="132"
        width="22"
        height="24"
        rx="4"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      <path
        d="M119 140 v8 M127 140 v8"
        stroke="#1B1C21"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M94 132 l4 -6 M100 136 l6 -4 M92 140 l-2 -8"
        stroke="#EC1D35"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <animate
          attributeName="opacity"
          values="1;0.2;1"
          dur="1.2s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
};
