export const ChibiLoader = () => {
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" role="img">
      <title>Девочка ждёт сборку</title>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 2; 0 -5; 0 2"
          dur="1.4s"
          repeatCount="indefinite"
        />
        <path
          d="M50 62c0-28 16-40 32-40s32 12 32 40v28c0 10-8 16-16 16H66c-8 0-16-6-16-16V62z"
          fill="#402FFF"
        />
        <ellipse cx="82" cy="72" rx="24" ry="26" fill="#F2F3FF" />
        <path
          d="M58 64c8-20 40-22 48-2-8-8-16-6-22 0-6-8-16-10-26 2z"
          fill="#402FFF"
        />
        <ellipse cx="72" cy="74" rx="4" ry="5.2" fill="#1B1C21" />
        <ellipse cx="92" cy="74" rx="4" ry="5.2" fill="#1B1C21" />
        <circle cx="73.4" cy="72.2" r="1.3" fill="#EDEDED" />
        <circle cx="93.4" cy="72.2" r="1.3" fill="#EDEDED" />
        <ellipse cx="64" cy="84" rx="4" ry="2" fill="#EC1D35" opacity="0.45" />
        <ellipse cx="100" cy="84" rx="4" ry="2" fill="#EC1D35" opacity="0.45" />
        <path
          d="M76 88c2.2 3 7.8 3 10 0"
          stroke="#1B1C21"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M108 50l12-6 2 9-9 4z" fill="#EC1D35" />
        <path d="M58 110c4-16 44-16 48 0v18H58v-18z" fill="#1B1C21" />
        <rect x="46" y="128" width="68" height="8" rx="2" fill="#1B1C21" />
        <rect
          x="54"
          y="108"
          width="52"
          height="24"
          rx="3"
          fill="#281CA6"
          stroke="#402FFF"
          strokeWidth="2"
        />
        <text
          x="64"
          y="124"
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
          fill="#EDEDED"
        >
          &gt;_
        </text>
      </g>
    </svg>
  );
};
