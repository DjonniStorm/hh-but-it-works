// Улитка несёт ответ: таймаут догоняет даже самые медленные запросы.
export const TimeoutSnailArt = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Запрос упёрся в таймаут</title>
      {/* Плашка с диагнозом */}
      <rect
        x="24"
        y="8"
        width="112"
        height="22"
        rx="6"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      <text
        x="33"
        y="23"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        fill="#1B1C21"
      >
        timeout after 30s
      </text>
      {/* Раковина */}
      <circle
        cx="98"
        cy="96"
        r="34"
        fill="#F2F3FF"
        stroke="#1B1C21"
        strokeWidth="3"
      />
      <path
        d="M98 78 a18 18 0 1 1 -16 27 a9 9 0 1 1 15 -6"
        fill="none"
        stroke="#1B1C21"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Голова и усики */}
      <circle
        cx="48"
        cy="116"
        r="15"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="3"
      />
      <circle cx="43" cy="112" r="3" fill="#1B1C21" />
      <path
        d="M40 103 l-7 -15 M53 103 l3 -17"
        stroke="#1B1C21"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="33" cy="86" r="4" fill="#402FFF" />
      <circle cx="56" cy="84" r="4" fill="#402FFF" />
      {/* Ножка-лужа */}
      <path
        d="M26 146 q4 -18 24 -18 h64 q20 0 24 18 q0 6 -9 6 H35 q-9 0 -9 -6 z"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* След улитки блестит, но неспешно */}
      <path
        d="M120 152 h14"
        stroke="#402FFF"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
};
