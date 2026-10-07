import type { FormErrors } from "@mantine/form";

type FormWithNodes = {
  getInputNode: (path: string) => HTMLElement | null;
};

// После неудачной отправки курсор встаёт в верхнее поле с ошибкой, а не остаётся на кнопке.
// Порядок берём по странице: ключи ошибок идут в порядке схемы, а не разметки.
export function focusFirstError(form: FormWithNodes, errors: FormErrors): void {
  const nodes = Object.keys(errors).reduce<HTMLElement[]>((found, path) => {
    const node = form.getInputNode(path);
    if (node) {
      found.push(node);
    }
    return found;
  }, []);
  nodes.sort((left, right) => {
    return left.compareDocumentPosition(right) &
      Node.DOCUMENT_POSITION_FOLLOWING
      ? -1
      : 1;
  });
  nodes[0]?.focus();
}
