import { fieldBorderColor, surfaceColor } from "@/shared/theme";
import { UnstyledButton } from "@mantine/core";

export const TestingChoice = ({
  index,
  label,
  selected,
  onSelect,
}: {
  index: number;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) => {
  return (
    <UnstyledButton
      type="button"
      aria-pressed={selected}
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
      <span style={{ width: 24 }}>{index + 1}</span>
      <span>{label}</span>
    </UnstyledButton>
  );
};
