import { fieldBorderColor, surfaceColor } from "@/shared/theme";
import { UnstyledButton } from "@mantine/core";

export const TestingChoice = ({
  index,
  label,
  selected,
  mode,
  onSelect,
}: {
  index: number;
  label: string;
  selected: boolean;
  mode: "radio" | "check";
  onSelect: () => void;
}) => {
  return (
    <UnstyledButton
      type="button"
      role={mode === "radio" ? "radio" : "checkbox"}
      aria-checked={selected}
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        minHeight: 44,
        padding: "8px 12px",
        textAlign: "left",
        font: "inherit",
        color: "inherit",
        background: selected ? "var(--mantine-color-fsp-0)" : surfaceColor,
        border: selected
          ? "1px solid var(--mantine-color-fsp-6)"
          : `1px solid ${fieldBorderColor}`,
      }}
      styles={{
        root: {
          "&:focus-visible": {
            outline: "2px solid var(--mantine-color-fsp-6)",
            outlineOffset: 2,
          },
        },
      }}
    >
      {/* Колонка маркера одной ширины у всех вариантов: текст начинается с одного x. */}
      {mode === "radio" ? (
        <span style={{ flex: "0 0 24px" }}>{index + 1}</span>
      ) : (
        // Квадрат, не цифра: цифра читается как единственный номер.
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 18px",
            height: 18,
            marginInlineEnd: 6,
            background: selected ? "var(--mantine-color-fsp-6)" : surfaceColor,
            border: selected
              ? "1px solid var(--mantine-color-fsp-6)"
              : `1px solid ${fieldBorderColor}`,
          }}
        >
          {selected ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6.2 4.7 9 10 3"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="square"
              />
            </svg>
          ) : null}
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
        {label}
      </span>
    </UnstyledButton>
  );
};
