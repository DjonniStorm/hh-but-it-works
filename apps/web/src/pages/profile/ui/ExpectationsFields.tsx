import type { ContactValues } from "@/pages/profile/model/types";
import { searchStatusOptions, workFormatOptions } from "@/shared/lib/labels";
import {
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";

// Ожидания кандидата. По ним подборка работодателя сверяет вилку и формат работы.
export const ExpectationsFields = ({
  form,
}: {
  form: UseFormReturnType<ContactValues>;
}) => {
  return (
    <Stack gap="sm">
      <Title order={4}>Ожидания</Title>
      <Text size="sm" c="dimmed">
        Работодатель видит их в подборке до приглашения: так предложения
        приходят с подходящей вилкой и форматом.
      </Text>
      <NumberInput
        label="Зарплата от, ₽"
        min={0}
        step={10000}
        thousandSeparator=" "
        {...form.getInputProps("desiredSalaryFrom")}
      />
      <MultiSelect
        label="Формат работы"
        data={workFormatOptions}
        {...form.getInputProps("workFormats")}
      />
      <Select
        label="Статус поиска"
        description="«Скрыт» — работодатели не увидят вас в подборках."
        data={searchStatusOptions}
        allowDeselect={false}
        {...form.getInputProps("searchStatus")}
      />
    </Stack>
  );
};
