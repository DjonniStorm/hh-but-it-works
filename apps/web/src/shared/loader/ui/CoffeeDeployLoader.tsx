// Кружка «prod» и деплой в пятницу вечером: полоска ползёт и откатывается.
export const CoffeeDeployLoader = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Кофе для деплоя</title>
      <g stroke="#C8C9CA" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M58 44 q-6 -8 0 -16 q6 -8 0 -16">
          <animate
            attributeName="opacity"
            values="0.2;1;0.2"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M76 46 q-6 -8 0 -16 q6 -8 0 -16">
          <animate
            attributeName="opacity"
            values="1;0.2;1"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M94 44 q-6 -8 0 -16 q6 -8 0 -16">
          <animate
            attributeName="opacity"
            values="0.2;1;0.2"
            dur="1.6s"
            begin="0.4s"
            repeatCount="indefinite"
          />
        </path>
      </g>
      <path
        d="M40 54 h72 l-8 66 q-2 10 -12 10 H60 q-10 0 -12 -10 z"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="3"
      />
      <path
        d="M112 66 q20 0 18 18 q-2 16 -22 16"
        fill="none"
        stroke="#1B1C21"
        strokeWidth="3"
      />
      <path d="M43 62 h66" stroke="#402FFF" strokeWidth="6" />
      <text
        x="56"
        y="96"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        prod
      </text>
      <text
        x="58"
        y="110"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
        fill="#1B1C21"
      >
        пт 18:00
      </text>
      <text
        x="20"
        y="150"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#1B1C21"
      >
        деплою
      </text>
      <rect
        x="64"
        y="142"
        width="76"
        height="9"
        rx="4"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="1.6"
      />
      <rect x="66" y="144" width="10" height="5" rx="2" fill="#EC1D35">
        <animate
          attributeName="width"
          values="6;72;6"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  );
};
