import { parseAsArrayOf, parseAsStringLiteral } from "nuqs";

import { gradeOrder } from "@hh/types";

import { refinementKeys } from "./refinements";

const refinementParser = parseAsStringLiteral(refinementKeys);

// Уточнения и категории подборки в адресе: перезагрузка и «Назад» сохраняют выбор.
export const needFilterParsers = {
  refinements: parseAsArrayOf(refinementParser).withDefault([]),
  grades: parseAsArrayOf(parseAsStringLiteral(gradeOrder)).withDefault([]),
};
