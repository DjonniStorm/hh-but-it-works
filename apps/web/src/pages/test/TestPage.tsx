import { Button, Group, Stack, Text, Title } from "@mantine/core";

const swatches = [
  { name: "Основной", hex: "#402FFF" },
  { name: "Акцент", hex: "#EC1D35" },
  { name: "Фон", hex: "#EDEDED" },
  { name: "Серый", hex: "#C8C9CA" },
  { name: "Текст", hex: "#1B1C21" },
] as const;

export const TestPage = () => {
  return (
    <Stack p="xl" gap="lg">
      <Title order={1}>Тема ФСП</Title>
      <Text>JetBrains Mono</Text>
      <Group gap="md">
        {swatches.map((swatch) => (
          <Stack key={swatch.hex} gap={4}>
            <div
              style={{
                width: 96,
                height: 96,
                background: swatch.hex,
                border: "1px solid #1B1C21",
              }}
            />
            <Text size="sm">{swatch.name}</Text>
            <Text size="xs" c="dimmed">
              {swatch.hex}
            </Text>
          </Stack>
        ))}
      </Group>
      <Group>
        <Button>Основной</Button>
        <Button color="fspRed">Акцент</Button>
      </Group>
    </Stack>
  );
};
