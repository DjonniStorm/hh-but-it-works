// node_modules весит больше проекта и трясётся под собственным весом.
export const NodeModulesLoader = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>npm install</title>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 1 0; -1 0; 0 0"
          dur="0.5s"
          repeatCount="indefinite"
        />
        <path
          d="M8 40 l70 -22 l74 22 v84 l-74 26 l-70 -26 z"
          fill="#402FFF"
          stroke="#1B1C21"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M8 40 l70 22 l74 -22 M78 62 v88"
          stroke="#1B1C21"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M8 40 l70 22 l74 -22 l-74 -22 z"
          fill="#5648FF"
          stroke="#1B1C21"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <text
          x="16"
          y="96"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
          fill="#EDEDED"
          transform="rotate(17 16 96)"
        >
          node_modules
        </text>
        <text
          x="86"
          y="104"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
          fill="#EDEDED"
          transform="rotate(-17 86 104)"
        >
          1 487 MB
        </text>
      </g>
      <circle cx="132" cy="30" r="12" fill="#EC1D35" />
      <text
        x="128"
        y="35"
        fontSize="13"
        fontFamily="JetBrains Mono, monospace"
        fill="#EDEDED"
      >
        !
      </text>
      <text
        x="6"
        y="12"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
        fill="#1B1C21"
      >
        added 2 147 packages
        <tspan>
          <animate
            attributeName="opacity"
            values="1;0;1"
            dur="0.9s"
            repeatCount="indefinite"
          />
          …
        </tspan>
      </text>
    </svg>
  );
};
