// Жук-баг: баг это или фича — вопрос дня.
export const BugArt = () => {
  return (
    <svg
      viewBox="0 0 160 160"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="78"
        cy="96"
        rx="32"
        ry="40"
        stroke="#402FFF"
        strokeWidth="3"
      />
      <path d="M78 56 v80 M46 96 h64" stroke="#402FFF" strokeWidth="2.4" />
      <circle cx="78" cy="48" r="15" stroke="#402FFF" strokeWidth="3" />
      <path
        d="M71 36 l-8 -13 M85 36 l8 -13"
        stroke="#281CA6"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M46 78 l-20 -12 M110 78 l20 -12 M46 98 l-22 2 M110 98 l22 2 M50 118 l-16 14 M106 118 l16 14"
        stroke="#281CA6"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <text
        x="118"
        y="44"
        fontSize="16"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        ?
      </text>
    </svg>
  );
};
