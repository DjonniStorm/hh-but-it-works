// Девочка из ChibiLoader смотрит на монитор с упавшим запросом.
export const BrokenBuildArt = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Запрос упал</title>
      <rect
        x="70"
        y="30"
        width="80"
        height="58"
        rx="6"
        fill="#EDEDED"
        stroke="#1B1C21"
        strokeWidth="3"
      />
      <rect x="78" y="38" width="64" height="42" rx="3" fill="#1B1C21" />
      <text
        x="84"
        y="56"
        fontSize="11"
        fontFamily="JetBrains Mono, monospace"
        fill="#EC1D35"
      >
        ERR
      </text>
      <text
        x="84"
        y="72"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#EDEDED"
      >
        retry 3/3
      </text>
      <path d="M102 88 h16 l4 14 h-24 z" fill="#C8C9CA" />
      <path
        d="M24 76c0-24 14-34 28-34s28 10 28 34v24c0 9-7 14-14 14H38c-7 0-14-5-14-14V76z"
        fill="#402FFF"
      />
      <ellipse cx="52" cy="84" rx="21" ry="23" fill="#F2F3FF" />
      <path
        d="M31 78c7-18 35-19 42-2-7-7-14-5-19 0-5-7-14-9-23 2z"
        fill="#402FFF"
      />
      {/* Брови домиком и рот-полукруг вниз: расстроилась, но не паникует. */}
      <path
        d="M40 80 l7 -3 M64 80 l-7 -3"
        stroke="#1B1C21"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="44" cy="87" rx="3.4" ry="4.4" fill="#1B1C21" />
      <ellipse cx="60" cy="87" rx="3.4" ry="4.4" fill="#1B1C21" />
      <path
        d="M46 99 q6 -5 12 0"
        fill="none"
        stroke="#1B1C21"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M36 114 h32 l6 34 H30 z" fill="#402FFF" />
      <circle cx="74" cy="104" r="5" fill="#EC1D35">
        <animate
          attributeName="r"
          values="5;7;5"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </circle>
      <text
        x="71.5"
        y="107.5"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
        fill="#EDEDED"
      >
        !
      </text>
    </svg>
  );
};
