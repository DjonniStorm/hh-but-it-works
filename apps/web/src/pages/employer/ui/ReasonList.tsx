import { List, Stack, Text } from "@mantine/core";

// Знак перед строкой дублирует цвет: статус не передаётся одним цветом.
const tone = {
  positive: { mark: "+", color: "teal.7" },
  risk: { mark: "!", color: "fspRed.7" },
} as const;

export const ReasonList = ({
  title,
  items,
  kind,
}: {
  title: string;
  items: string[];
  kind: keyof typeof tone;
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Stack gap={4}>
      <Text size="sm" fw={600}>
        {title}
      </Text>
      <List
        size="sm"
        spacing={2}
        icon={<Text c={tone[kind].color}>{tone[kind].mark}</Text>}
      >
        {items.map((item) => {
          return <List.Item key={item}>{item}</List.Item>;
        })}
      </List>
    </Stack>
  );
};
