import { Button, EmptyState, Paper } from "@mantine/core";

// Причина уже ушла тостом через ErrorStore. Здесь только понятный экран и повтор.
export const LoadError = ({
  title,
  onRetry,
}: {
  title: string;
  onRetry: () => void;
}) => {
  return (
    <Paper withBorder radius="md" p="xl" maw={720} mx="auto" mt="xl">
      <EmptyState
        title={title}
        description="Проверьте соединение и попробуйте ещё раз."
      >
        <EmptyState.Actions>
          <Button onClick={onRetry}>Повторить</Button>
        </EmptyState.Actions>
      </EmptyState>
    </Paper>
  );
};
