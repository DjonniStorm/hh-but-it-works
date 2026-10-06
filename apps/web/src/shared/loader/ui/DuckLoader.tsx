export const DuckLoader = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Утка дебажит</title>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -6; 0 0"
          dur="1.1s"
          repeatCount="indefinite"
        />
        <rect
          x="78"
          y="10"
          width="74"
          height="40"
          rx="8"
          fill="#EDEDED"
          stroke="#1B1C21"
          strokeWidth="2"
        />
        <text
          x="86"
          y="27"
          fontSize="10"
          fontFamily="JetBrains Mono, monospace"
          fill="#1B1C21"
        >
          у меня
        </text>
        <text
          x="86"
          y="41"
          fontSize="10"
          fontFamily="JetBrains Mono, monospace"
          fill="#402FFF"
        >
          работает
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
        <circle cx="100" cy="74" r="4" fill="#1B1C21" />
        <circle cx="101.4" cy="72.6" r="1.3" fill="#EDEDED" />
        <ellipse cx="44" cy="100" rx="11" ry="7" fill="#402FFF" />
        <circle cx="40" cy="98" r="1.4" fill="#EDEDED" />
        <circle cx="48" cy="98" r="1.4" fill="#EDEDED" />
        <path
          d="M44 93 v-5 M38 96 l-4-3 M50 96 l4-3"
          stroke="#281CA6"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
