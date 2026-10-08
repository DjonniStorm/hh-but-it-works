import {
  annulBelow,
  attemptPassScore,
  sectionFloorScore,
  sectionPassScore,
} from "@/pages/profile/model/attempt";
import { Checkbox, Stack, Text } from "@mantine/core";

export const TestingRules = ({
  agreed,
  onAgree,
}: {
  agreed: boolean;
  onAgree: (value: boolean) => void;
}) => {
  return (
    <Stack gap="xs">
      <Text size="sm">
        Вопросы идут по одному, назад вернуться нельзя. Время вышло — ответ
        неверный.
      </Text>
      <Text size="sm">
        Секция засчитана от {sectionPassScore}%. Грейд подтверждается, если в
        среднем от {attemptPassScore}% и ни одна секция не ниже{" "}
        {sectionFloorScore}%.
      </Text>
      <Text size="sm">
        Тест идёт на весь экран. Уход, копирование, смена сети и браузера
        записываются. Чистота ниже {annulBelow} аннулирует попытку, профиль не
        меняется.
      </Text>
      <Text size="sm">
        Не сдали — грейд не меняется. Сдали другой грейд — следующая смена через
        90 дней.
      </Text>
      <Checkbox
        mt="xs"
        label="Понимаю правила и прохожу тест сам"
        checked={agreed}
        onChange={(event) => {
          onAgree(event.currentTarget.checked);
        }}
      />
    </Stack>
  );
};
