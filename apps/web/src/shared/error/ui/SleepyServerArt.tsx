// Стойка сервера уснула на смене: диоды не бегут, ответа нет.
export const SleepyServerArt = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Сервер спит и не отвечает</title>
      {/* Плашка с диагнозом */}
      <rect
        x="30"
        y="8"
        width="100"
        height="22"
        rx="6"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      <text
        x="41"
        y="23"
        fontSize="11"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        no response
      </text>
      {/* Храп по-серверному */}
      <text
        x="110"
        y="54"
        fontSize="17"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        z
      </text>
      <text
        x="123"
        y="42"
        fontSize="13"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        z
      </text>
      <text
        x="133"
        y="32"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        z
      </text>
      {/* Корпус стойки */}
      <rect
        x="34"
        y="54"
        width="76"
        height="94"
        rx="8"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="3"
      />
      <rect
        x="42"
        y="62"
        width="60"
        height="22"
        rx="4"
        fill="#F2F3FF"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      <rect
        x="42"
        y="88"
        width="60"
        height="22"
        rx="4"
        fill="#F2F3FF"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      <rect
        x="42"
        y="114"
        width="60"
        height="22"
        rx="4"
        fill="#F2F3FF"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      {/* Красный диод тревогится, синие спят */}
      <circle cx="50" cy="73" r="4" fill="#EC1D35">
        <animate
          attributeName="opacity"
          values="1;0.2;1"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="50" cy="99" r="4" fill="#402FFF" />
      <circle cx="50" cy="125" r="4" fill="#402FFF" />
      {/* Щелчки дисков */}
      <path
        d="M62 73 h30 M62 99 h30 M62 125 h30"
        stroke="#1B1C21"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
