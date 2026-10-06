import { ErrorArt } from "@/shared/error/ui/ErrorArt";
import { Box, Button, Paper, Stack, Text, Title } from "@mantine/core";

// Показывается, когда все попытки загрузки упали. Причина уже ушла тостом через ErrorStore.
export const ErrorScreen = ({
  title,
  onReload,
}: {
  title: string;
  onReload: () => void;
}) => {
  return (
    <Paper withBorder radius="md" p="xl" maw={560} mx="auto" mt="xl">
      <Stack align="center" gap="md" ta="center">
        <Box w={180} h={180}>
          <ErrorArt />
        </Box>
        <Title order={3}>{title}</Title>
        <Text c="dimmed" size="sm" maw={380}>
          Мы попробовали несколько раз, но сервер не ответил. Проверьте
          соединение и перезагрузите.
        </Text>
        <Button onClick={onReload}>Перезагрузить</Button>
      </Stack>
    </Paper>
  );
};
