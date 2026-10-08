import {
  type CSSVariablesResolver,
  Input,
  type MantineColorsTuple,
  PasswordInput,
  createTheme,
  defaultVariantColorsResolver,
} from "@mantine/core";

import { InvitationStatus, SkillVerification } from "@hh/types";

/** #402FFF, оттенок 6 — цвет из брендбука. */
const fsp: MantineColorsTuple = [
  "#F2F3FF",
  "#DEE0FF",
  "#C0C4FF",
  "#9AA0FF",
  "#7478FF",
  "#5648FF",
  "#402FFF",
  "#3424D4",
  "#281CA6",
  "#1C1478",
];

/** #EC1D35, оттенок 6 — цвет из брендбука. */
const fspRed: MantineColorsTuple = [
  "#FFF1F3",
  "#FFD8DD",
  "#FFB3BB",
  "#FF8491",
  "#F85368",
  "#F03349",
  "#EC1D35",
  "#C91228",
  "#A10E20",
  "#6E0916",
];

export const feedbackColor = {
  error: "fspRed",
  success: "fsp",
} as const;

export const invitationStatusColor: Record<InvitationStatus, string> = {
  [InvitationStatus.Sent]: "gray",
  [InvitationStatus.Viewed]: "fsp",
  [InvitationStatus.Accepted]: "teal",
  [InvitationStatus.Declined]: "fspRed",
};

// Кандидату важнее новое, чем просмотренное: акцент на «Новое», «Ждёт ответа» спокойнее.
export const candidateInvitationColor: Record<InvitationStatus, string> = {
  [InvitationStatus.Sent]: "fsp",
  [InvitationStatus.Viewed]: "gray",
  [InvitationStatus.Accepted]: "teal",
  [InvitationStatus.Declined]: "fspRed",
};

// Те же цвета, что у SkillStatusBadge в профиле кандидата.
export const verificationColor: Record<SkillVerification, string> = {
  [SkillVerification.Unverified]: "gray",
  [SkillVerification.Verified]: "fsp",
  [SkillVerification.VerifiedExternal]: "fspRed",
};

// Фон бренда #EDEDED совпадает с фоном Paper. Карточкам кабинета нужен свой слой, иначе они сливаются.
export const surfaceColor = "#FFFFFF";

// Тона брендового #1B1C21 вместо серых Mantine: те не дотягивают до WCAG AA на фоне #EDEDED.
// Подписи и подсказки: 4.98:1 на #EDEDED, 5.83:1 на белом (норма 4.5).
export const mutedTextColor = "#646568";
// Рамка поля: 3.15:1 на #EDEDED, 3.69:1 на белом (норма 3).
export const fieldBorderColor = "#848587";

// Цвет значка перед строкой в «Почему подходит» и «На что обратить внимание».
export const reasonColor = {
  positive: "teal.9",
  risk: "fspRed.7",
} as const;

// Грейд в карточке кандидата. Неподтверждённый — контур: серый 6 даёт 3.3:1, берём 7-й.
export const gradeBadge = {
  verified: { variant: "filled", color: "fsp" },
  unverified: { variant: "outline", color: "gray.7" },
} as const;

export const scoreColor = {
  strong: "fsp",
  medium: "yellow",
  weak: "gray",
} as const;

export const theme = createTheme({
  primaryColor: "fsp",
  primaryShade: 6,
  fontFamily: "JetBrains Mono, monospace",
  black: "#1B1C21",
  white: "#EDEDED",
  colors: {
    fsp,
    fspRed,
  },
  variantColorResolver: (input) => {
    const colors = defaultVariantColorsResolver(input);
    // Бейдж «Принято»: тёмный текст на бирюзовом фоне Mantine даёт 4.3:1, на самом светлом оттенке — 4.7:1.
    if (input.variant === "light" && input.color === "teal") {
      return { ...colors, background: input.theme.colors.teal[0] };
    }
    return colors;
  },
  components: {
    Input: Input.extend({
      styles: (_theme, props) => {
        // Свою рамку ставим только обычному полю: у ошибки и успеха Mantine красит её сам.
        const plain =
          !props.error &&
          !props.success &&
          (props.variant === undefined || props.variant === "default");
        return {
          wrapper: plain ? { "--input-bd": fieldBorderColor } : {},
          // Лигатуры JetBrains Mono склеивают «://» в один знак: в поле «https://site» читалось как «https: /site».
          input: { fontVariantLigatures: "none" },
        };
      },
    }),
    // Mantine убирает кнопку из Tab и подписывает её по-английски.
    // Подпись постоянная: показан ли пароль, Mantine сообщает через aria-pressed.
    PasswordInput: PasswordInput.extend({
      defaultProps: {
        visibilityToggleFocusable: true,
        visibilityToggleButtonProps: { "aria-label": "Показать пароль" },
      },
    }),
  },
});

// Цвета Mantine по умолчанию, которые не проходят контраст на фоне бренда.
export const cssVariablesResolver: CSSVariablesResolver = (theme) => {
  return {
    variables: {},
    light: {
      "--mantine-color-dimmed": mutedTextColor,
      "--mantine-color-placeholder": mutedTextColor,
      // Красный Mantine #fa5252 даёт 2.8:1, оттенок брендового красного — 4.98:1.
      "--mantine-color-error": theme.colors.fspRed[7],
    },
    dark: {},
  };
};
