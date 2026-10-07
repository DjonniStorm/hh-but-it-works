import { useEffect, useState } from "react";

import { Box, Text } from "@mantine/core";

type CodeLang = "typescript" | "dockerfile" | "sql";

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
        style={{ whiteSpace: "pre-wrap", margin: 0 }}
      >
        {code}
      </Text>
    );
  }

  return (
    <Box
      fz="sm"
      style={{ overflowX: "auto" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
