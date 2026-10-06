// Кот улёгся на клавиатуру и коммитит за тебя.
export const CatKeyboardLoader = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Кот печатает за тебя</title>
      <rect x="30" y="34" width="100" height="62" rx="6" fill="#1B1C21" />
      <rect x="36" y="40" width="88" height="50" rx="3" fill="#281CA6" />
      <text
        x="42"
        y="52"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#EDEDED"
      >
        git commit -m
      </text>
      <text
        x="42"
        y="64"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        &quot;ыыыыыы
        <tspan>
          <animate
            attributeName="opacity"
            values="1;0;1"
            dur="0.8s"
            repeatCount="indefinite"
          />
          _
        </tspan>
      </text>
      <path
        d="M18 104 h124 l-10 18 H28 z"
        fill="#C8C9CA"
        stroke="#1B1C21"
        strokeWidth="2"
      />
      <path
        d="M30 110 h100 M34 116 h92"
        stroke="#1B1C21"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -2; 0 0"
          dur="1.6s"
          repeatCount="indefinite"
        />
        <ellipse
          cx="86"
          cy="104"
          rx="38"
          ry="14"
          fill="#EDEDED"
          stroke="#1B1C21"
          strokeWidth="3"
        />
        <circle
          cx="56"
          cy="94"
          r="15"
          fill="#EDEDED"
          stroke="#1B1C21"
          strokeWidth="3"
        />
        <path
          d="M44 84 l-2 -12 l10 7 z M60 80 l6 -11 l3 12 z"
          fill="#EDEDED"
          stroke="#1B1C21"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Глаза-дуги: кот спит и ему всё равно на дедлайн. */}
        <path
          d="M49 93 q3 -3 6 0 M59 93 q3 -3 6 0"
          stroke="#1B1C21"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M55 99 l2 2 l2 -2"
          stroke="#EC1D35"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M122 102 q18 -4 14 -22"
          stroke="#1B1C21"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 122 102; 10 122 102; 0 122 102"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </path>
      </g>
      <text
        x="12"
        y="74"
        fontSize="11"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        z
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="2s"
          repeatCount="indefinite"
        />
      </text>
      <text
        x="18"
        y="62"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        z
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="2s"
          begin="0.6s"
          repeatCount="indefinite"
        />
      </text>
    </svg>
  );
};
