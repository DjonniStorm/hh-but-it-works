// Экран без сигнала: данные не доехали или доехали кривыми.
export const NoSignalTvArt = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Нет сигнала</title>
      {/* Антенны */}
      <path
        d="M58 36 l-16 -22 M98 36 l18 -20"
        stroke="#1B1C21"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="42" cy="14" r="4" fill="#402FFF" />
      <circle cx="116" cy="16" r="4" fill="#402FFF" />
      {/* Корпус */}
      <rect
        x="16"
        y="36"
        width="128"
        height="94"
        rx="12"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="3"
      />
      {/* Экран */}
      <rect x="28" y="48" width="84" height="70" rx="6" fill="#1B1C21" />
      {/* Статика по экрану */}
      <path
        d="M36 58 h50 M36 68 h34 M36 78 h56 M36 96 h44 M36 106 h52"
        stroke="#EDEDED"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <text
        x="36"
        y="90"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        NO SIGNAL
      </text>
      {/* Ручки и диод */}
      <circle
        cx="126"
        cy="64"
        r="6"
        fill="#F2F3FF"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      <circle
        cx="126"
        cy="84"
        r="6"
        fill="#F2F3FF"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      <circle cx="126" cy="104" r="5" fill="#EC1D35">
        <animate
          attributeName="opacity"
          values="1;0.25;1"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Ножки */}
      <path
        d="M46 130 v14 M114 130 v14"
        stroke="#1B1C21"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};
