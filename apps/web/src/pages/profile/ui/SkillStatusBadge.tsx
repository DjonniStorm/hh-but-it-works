import { Badge } from "@mantine/core";

import { SkillVerification } from "@hh/types";

export const SkillStatusBadge = ({
  level,
  verification,
}: {
  level: string | null;
  verification: SkillVerification | null;
}) => {
  if (!level) {
    return null;
  }
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
    <Badge variant="outline" color="dark">
      Не подтверждён
    </Badge>
  );
};
