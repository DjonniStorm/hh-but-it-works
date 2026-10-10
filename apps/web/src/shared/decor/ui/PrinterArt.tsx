// Принтер выпечатывает «Hello World»: первое, что увидел прод.
export const PrinterArt = () => {
  return (
    <svg
      viewBox="0 0 160 160"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
    >
      {/* Бумага из принтера */}
      <rect
        x="40"
        y="8"
        width="80"
        height="46"
        rx="4"
        stroke="#281CA6"
        strokeWidth="2.5"
      />
      <text
        x="52"
        y="28"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#281CA6"
      >
        Hello
      </text>
      <text
        x="52"
        y="42"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        World
      </text>
      {/* Корпус */}
      <rect
        x="22"
        y="54"
        width="116"
        height="56"
        rx="10"
        stroke="#402FFF"
        strokeWidth="3"
      />
      <path d="M22 74 h116" stroke="#402FFF" strokeWidth="2.4" />
      <circle cx="120" cy="64" r="4" stroke="#EC1D35" strokeWidth="2" />
      {/* Лоток с отпечатком */}
      <rect
        x="36"
        y="110"
        width="88"
        height="30"
        rx="4"
        stroke="#402FFF"
        strokeWidth="2.5"
      />
      <path
        d="M48 124 h64"
        stroke="#402FFF"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
    </svg>
  );
};
