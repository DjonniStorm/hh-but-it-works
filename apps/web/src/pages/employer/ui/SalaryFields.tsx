import { NumberInput } from "@mantine/core";
import type { GetInputPropsReturnType } from "@mantine/form";

// Две ячейки сетки: родитель кладёт их в свой SimpleGrid рядом с другими полями.
export const SalaryFields = ({
  fromProps,
  toProps,
}: {
  fromProps: GetInputPropsReturnType;
  toProps: GetInputPropsReturnType;
}) => {
  return (
    <>
      <NumberInput
        label="Зарплата от, ₽"
        min={0}
        step={10000}
        thousandSeparator=" "
        {...fromProps}
      />
      <NumberInput
        label="Зарплата до, ₽"
        min={0}
        step={10000}
        thousandSeparator=" "
        {...toProps}
      />
    </>
  );
};
