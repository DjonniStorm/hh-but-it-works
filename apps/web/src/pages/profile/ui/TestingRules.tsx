import {
  annulBelow,
  attemptPassScore,
  sectionFloorScore,
  sectionPassScore,
} from "@/pages/profile/model/attempt";
import { Alert, Checkbox, List, Stack, Text } from "@mantine/core";

export const TestingRules = ({
  agreed,
  onAgree,
}: {
  agreed: boolean;
  onAgree: (value: boolean) => void;
}) => {
  return (
    <Alert color="orange" variant="light" title="Это не тренировка">
      <Stack gap="sm">
        <Text size="sm">
          По итогу попытки работодатели видят ваш грейд и подтверждённые навыки.
          Проходите сами, в спокойной обстановке.
        </Text>
        <List size="sm" spacing={4}>
          <List.Item>
            Вопросы идут по одному, назад вернуться нельзя. У каждого свой
            таймер, по истечении ответ засчитывается неверным.
          </List.Item>
          <List.Item>
            Секция по навыку засчитана от {sectionPassScore}%. Грейд
            подтверждается, если в среднем от {attemptPassScore}% и ни одна
            секция не ниже {sectionFloorScore}%.
          </List.Item>
          <List.Item>
            Тест идёт в полноэкранном режиме. Уход на другую вкладку или в
            другое окно, выход из полноэкранного режима, копирование, смена сети
            и браузера фиксируются.
          </List.Item>
          <List.Item>
            Из этих событий складывается чистота попытки. Ниже {annulBelow}{" "}
            попытка аннулируется и на профиль не влияет.
          </List.Item>
          <List.Item>
            Не сдали — грейд не меняется. Сдали другой грейд — он заменит
            прежний, следующая смена через 90 дней.
          </List.Item>
        </List>
        <Checkbox
          label="Понимаю правила и прохожу тест сам"
          checked={agreed}
          onChange={(event) => {
            onAgree(event.currentTarget.checked);
          }}
        />
      </Stack>
    </Alert>
  );
};
