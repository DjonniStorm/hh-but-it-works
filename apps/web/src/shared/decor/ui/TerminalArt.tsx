// Терминал: сборка собралась за сорок минут, курсор мигает.
export const TerminalArt = () => {
  return (
    <svg
      viewBox="0 0 160 160"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="12"
        y="28"
        width="136"
        height="102"
        rx="10"
        stroke="#402FFF"
        strokeWidth="3"
      />
      <path d="M12 50 h136" stroke="#402FFF" strokeWidth="3" />
      <circle cx="26" cy="39" r="3.4" stroke="#EC1D35" strokeWidth="2" />
      <circle cx="38" cy="39" r="3.4" stroke="#281CA6" strokeWidth="2" />
      <text
        x="24"
        y="74"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        fill="#281CA6"
      >
        npm run build
      </text>
      <text
        x="24"
        y="92"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        ok за 42:07
      </text>
      <text
        x="24"
        y="116"
        fontSize="11"
        fontFamily="JetBrains Mono, monospace"
        fill="#402FFF"
      >
        &gt;
        <tspan fill="#EC1D35">
          <animate
            attributeName="opacity"
            values="1;1;0;0"
            dur="1.2s"
            repeatCount="indefinite"
          />
          _
        </tspan>
      </text>
    </svg>
  );
};
