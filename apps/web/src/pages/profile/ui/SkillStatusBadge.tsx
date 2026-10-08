import { skillPassport } from "@/shared/lib/labels";
import { mutedTextColor } from "@/shared/theme";
import { Badge, Stack, Text, Tooltip } from "@mantine/core";

import { SkillVerification } from "@hh/types";

export const SkillStatusBadge = ({
  level,
  verification,
  verifiedAt,
}: {
  level: string | null;
  verification: SkillVerification | null;
  verifiedAt: string | null;
}) => {
  if (!level) {
    return null;
  }
  const passport = skillPassport(verification, verifiedAt);
  const badge = statusBadge(verification);
  if (!passport) {
    return badge;
  }
  return (
    <Stack gap={2} align="flex-end">
      {badge}
      <Text size="xs" style={{ color: mutedTextColor }}>
        {passport}
      </Text>
    </Stack>
  );
};

function statusBadge(verification: SkillVerification | null) {
  if (verification === SkillVerification.Verified) {
    return <Badge color="fsp">Подтверждён</Badge>;
  }
  if (verification === SkillVerification.VerifiedExternal) {
    return (
      <Badge color="fspRed" variant="light">
        Подтверждён интеграцией
      </Badge>
    );
  }
  return (
    <Tooltip
      label="Самооценка. Тест и интеграция этот уровень ещё не подтвердили."
      multiline
      w={260}
      withArrow
    >
      <Badge variant="outline" color="dark">
        Не подтверждён
      </Badge>
    </Tooltip>
  );
}
