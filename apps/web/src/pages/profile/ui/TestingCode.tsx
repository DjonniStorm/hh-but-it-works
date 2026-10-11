import { useEffect, useState } from "react";

import { Box, Text } from "@mantine/core";

type CodeLang =
  | "typescript"
  | "dockerfile"
  | "sql"
  | "python"
  | "csharp"
  | "go"
  | "java"
  | "tsx";

type Highlighter = {
  codeToHtml: (
    code: string,
    options: { lang: CodeLang; theme: string },
  ) => string;
};

let loading: Promise<Highlighter> | null = null;

function loadHighlighter(): Promise<Highlighter> {
  if (!loading) {
    loading = (async () => {
      const { createHighlighterCore } = await import("shiki/core");
      const { createJavaScriptRegexEngine } =
        await import("shiki/engine/javascript");
      return createHighlighterCore({
        themes: [import("@shikijs/themes/github-light")],
        langs: [
          import("@shikijs/langs/typescript"),
          import("@shikijs/langs/dockerfile"),
          import("@shikijs/langs/sql"),
          import("@shikijs/langs/python"),
          import("@shikijs/langs/csharp"),
          import("@shikijs/langs/go"),
          import("@shikijs/langs/java"),
          import("@shikijs/langs/tsx"),
        ],
        engine: createJavaScriptRegexEngine(),
      });
    })();
  }
  return loading;
}

export const TestingCode = ({
  code,
  lang,
}: {
  code: string;
  lang: CodeLang | null;
}) => {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!lang) {
      return;
    }
    let cancelled = false;
    void loadHighlighter()
      .then((highlighter) => {
        if (cancelled) {
          return;
        }
        setHtml(highlighter.codeToHtml(code, { lang, theme: "github-light" }));
      })
      .catch(() => {
        if (!cancelled) {
          setHtml(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (!html) {
    return (
      <Text
        component="pre"
        ff="inherit"
        fz="sm"
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0 }}
      >
        {code}
      </Text>
    );
  }

  return (
    <Box
      fz="sm"
      // Длинная строка кода листается внутри блока, страница остаётся шириной с экран.
      style={{ overflowX: "auto", maxWidth: "100%" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
