import { Anchor, Group, Text } from "@mantine/core";

// Пустой контакт не рисуем: кандидату нечего показывать.
export const ContactLine = ({
  label,
  value,
  href,
  external = false,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) => {
  if (!value) {
    return null;
  }

  return (
    <Group gap="sm" wrap="nowrap" align="baseline">
      <Text size="sm" c="dimmed" w={90} style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Anchor
        href={href}
        size="sm"
        style={{ wordBreak: "break-all" }}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {value}
      </Anchor>
    </Group>
  );
};
