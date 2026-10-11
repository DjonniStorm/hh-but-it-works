// Иконка картинки для тулбара: отдельного набора иконок в проекте нет.
export const ImageIcon = () => {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="9" cy="10" r="1.4" fill="currentColor" />
      <path
        d="m3 16 5-5 4 4 3-3 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
};
