import { type KeyboardEvent, useEffect, useState } from "react";

import {
  Box,
  Button,
  Group,
  Input,
  Popover,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { RichTextEditor } from "@mantine/tiptap";
import { ListItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { type Editor, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { type RichTextDoc, emptyRichText, isHttpUrl } from "@hh/contracts";

import { ImageNode } from "../model/image-node";
import { ImageIcon } from "./ImageIcon";

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

// Подписи контролов на русском и с горячими клавишами: в комплекте Mantine
// английские — для первого знакомства с редактором это не помогает.
const controlLabels = {
  boldControlLabel: "Жирный — Ctrl+B",
  italicControlLabel: "Курсив — Ctrl+I",
  h2ControlLabel: "Заголовок второго уровня",
  linkControlLabel: "Вставить ссылку",
  unlinkControlLabel: "Убрать ссылку",
  clearFormattingControlLabel: "Сбросить форматирование",
  bulletListControlLabel: "Список с маркерами",
  orderedListControlLabel: "Нумерованный список",
};

const imageHrefError = "Полная ссылка на картинку, с http:// или https://";

// WYSIWYG-редактор ричтекста. Пускает только то, что умеет схема в contracts:
// жирный, курсив, заголовок, списки, ссылки, картинки по внешней ссылке.
// Прочие теги из вставки Tiptap отбрасывает сам, поэтому документ всегда
// проходит валидацию на сервере.
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
      ImageNode,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value ?? emptyRichText(),
    onUpdate: ({ editor: current }: { editor: Editor }) => {
      onChange(current.getJSON() as RichTextDoc);
    },
  });

  // Подписка на состояние картинки: кнопка должна гаснуть внутри списка,
  // где узел картинки невставим, и гореть, когда картинка выделена.
  const imageState = useEditorState({
    editor,
    selector: (state) => {
      const safeEditor =
        state.editor && !state.editor.isDestroyed ? state.editor : null;
      return {
        selected: safeEditor?.isActive("image") ?? false,
        blocked:
          (safeEditor?.isActive("bulletList") ?? false) ||
          (safeEditor?.isActive("orderedList") ?? false),
      };
    },
  });

  const [imageOpened, setImageOpened] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);

  // Открываем попап: у выделенной картинки подставляем текущие значения.
  const openImagePopover = () => {
    const attributes = editor?.isActive("image")
      ? editor.getAttributes("image")
      : null;
    setImageUrl(attributes?.src ?? "");
    setImageAlt(attributes?.alt ?? "");
    setImageError(null);
    setImageOpened(true);
  };

  const applyImage = () => {
    if (!editor) {
      return;
    }
    const src = imageUrl.trim();
    if (!isHttpUrl(src)) {
      setImageError(imageHrefError);
      return;
    }
    const alt = imageAlt.trim() || null;
    const chain = editor.chain().focus();
    if (editor.isActive("image")) {
      chain.updateAttributes("image", { src, alt });
    } else {
      chain.insertContent({ type: "image", attrs: { src, alt } });
    }
    chain.run();
    setImageOpened(false);
  };

  const removeImage = () => {
    editor?.chain().focus().deleteSelection().run();
    setImageOpened(false);
  };

  const onImageUrlKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyImage();
    }
  };

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
        {/* Без min-height область текста схлопывается в строку: раньше её держала autosize-Textarea. */}
        <RichTextEditor
          editor={editor}
          labels={controlLabels}
          styles={(theme) => ({
            content: {
              minHeight: 120,
              // Картинка — блок во всю ширину; рамка показывает выделение.
              "& img": {
                display: "block",
                maxWidth: "100%",
                marginBlock: theme.spacing.sm,
                borderRadius: theme.radius.sm,
              },
              "& img.ProseMirror-selectednode": {
                outline: `2px solid ${theme.colors[theme.primaryColor][6]}`,
                outlineOffset: 2,
              },
            },
          })}
        >
          <RichTextEditor.Toolbar>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.H2 />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
              <RichTextEditor.ClearFormatting />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <Popover
                opened={imageOpened}
                onChange={(opened) => {
                  if (!opened) {
                    setImageOpened(false);
                  }
                }}
                trapFocus
                withinPortal
                shadow="md"
                position="bottom"
                offset={-44}
                zIndex={10_000}
              >
                <Popover.Target>
                  <RichTextEditor.Control
                    aria-label="Вставить картинку по ссылке"
                    title="Картинка по ссылке"
                    active={imageState?.selected ?? false}
                    disabled={
                      imageState != null &&
                      imageState.blocked &&
                      !imageState.selected
                    }
                    onClick={openImagePopover}
                  >
                    <ImageIcon />
                  </RichTextEditor.Control>
                </Popover.Target>
                <Popover.Dropdown>
                  <Stack gap="xs">
                    <TextInput
                      label="Ссылка на картинку"
                      description="Храним ссылку, не файл: картинка живёт на чужом сайте."
                      placeholder="https://example.com/photo.jpg"
                      type="url"
                      value={imageUrl}
                      onChange={(event) => {
                        setImageUrl(event.currentTarget.value);
                        setImageError(null);
                      }}
                      onKeyDown={onImageUrlKeyDown}
                      error={imageError}
                      data-autofocus
                    />
                    <TextInput
                      label="Подпись (необязательно)"
                      placeholder="Описание картинки для скринридера"
                      value={imageAlt}
                      onChange={(event) => {
                        setImageAlt(event.currentTarget.value);
                      }}
                    />
                    <Group justify="flex-end" gap="xs">
                      {imageState?.selected ? (
                        <Button
                          variant="subtle"
                          color="red"
                          onClick={removeImage}
                        >
                          Удалить
                        </Button>
                      ) : null}
                      <Button
                        variant="default"
                        onClick={() => {
                          setImageOpened(false);
                        }}
                      >
                        Отмена
                      </Button>
                      <Button onClick={applyImage}>
                        {imageState?.selected ? "Сохранить" : "Вставить"}
                      </Button>
                    </Group>
                  </Stack>
                </Popover.Dropdown>
              </Popover>
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>
          <RichTextEditor.Content />
          {/* Строка помощи для тех, кто видит редактор впервые. */}
          <Text size="xs" c="dimmed" mt="xs">
            Ctrl+B и Ctrl+I — жирный и курсив, Ctrl+Z — отменить, «- » в начале
            строки — список; ссылку и картинку вставляйте на пустой строке или
            по выделению.
          </Text>
        </RichTextEditor>
      </Input.Wrapper>
    </Box>
  );
};
