// node_modules весит больше проекта: контурная версия лоадера для фона.
export const BoxArt = () => {
  return (
    <svg
      viewBox="0 0 160 160"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 50 l70 -24 l72 24 v74 l-72 26 l-70 -26 z"
        stroke="#402FFF"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M10 50 l70 22 l72 -22 M80 72 v78"
        stroke="#402FFF"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <text
        x="22"
        y="104"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#281CA6"
        transform="rotate(17 22 104)"
      >
        node_modules
      </text>
      <text
        x="88"
        y="112"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
        transform="rotate(-17 88 112)"
      >
        1 487 MB
      </text>
      <circle cx="136" cy="26" r="11" stroke="#EC1D35" strokeWidth="2.5" />
      <text
        x="132.5"
        y="31"
        fontSize="12"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        !
      </text>
    </svg>
  );
};
