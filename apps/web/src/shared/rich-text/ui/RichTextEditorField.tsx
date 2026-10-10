import { useEffect } from "react";

import { Box, Input } from "@mantine/core";
import { RichTextEditor } from "@mantine/tiptap";
import { ListItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { type Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { type RichTextDoc, emptyRichText } from "@hh/contracts";

type Props = {
  value?: RichTextDoc | null;
  // Документ уходит в форму как объект: Mantine onChange принимает готовое значение.
  onChange: (doc: RichTextDoc) => void;
  label: string;
  error?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  "data-path"?: string;
  onFocus?: () => void;
  onBlur?: () => void;
};

// Вложенные списки контракт не пропускает: убираем вложенность на уровне узла.
const FlatListItem = ListItem.extend({ content: "paragraph" });

// WYSIWYG-редактор ричтекста. Пускает только то, что умеет схема в contracts:
// жирный, курсив, заголовок, списки, ссылки. Прочие теги из вставки Tiptap
// отбрасывает сам, поэтому документ всегда проходит валидацию на сервере.
export const RichTextEditorField = ({
  value,
  onChange,
  label,
  error,
  description,
  placeholder,
  required,
  onFocus,
  onBlur,
  ...others
}: Props) => {
  const editor = useEditor({
    extensions: [
      // Комплект строго по whitelist контракта: без зачёркивания, кода и цитат.
      StarterKit.configure({
        heading: { levels: [2] },
        listItem: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: false },
      }),
      FlatListItem,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value ?? emptyRichText(),
    onUpdate: ({ editor: current }: { editor: Editor }) => {
      onChange(current.getJSON() as RichTextDoc);
    },
  });

  // Внешнее изменение значения (сброс формы): синхронизируем документ в редакторе.
  useEffect(() => {
    if (!editor) {
      return;
    }
    const next = value ?? emptyRichText();
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    // tabIndex и фокус-события — на обёртке: после неудачной отправки фокус
    // встаёт сюда (focusFirstError), touched ставится по событиям редактора.
    <Box tabIndex={-1} onFocus={onFocus} onBlur={onBlur} {...others}>
      <Input.Wrapper
        label={label}
        description={description}
        error={error}
        required={required}
      >
        <RichTextEditor editor={editor}>
          <RichTextEditor.Toolbar>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.H2 />
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>
          <RichTextEditor.Content />
        </RichTextEditor>
      </Input.Wrapper>
    </Box>
  );
};
