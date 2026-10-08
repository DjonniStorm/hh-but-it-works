import { useEffect } from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import {
  gradeOptions,
  optionLabel,
  specializationOptions,
} from "@/pages/profile/model/options";
import { ROUTES } from "@/shared/router/routes";
import { Anchor, Badge, Group, Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Link } from "react-router";

import type { CandidateProfile } from "@hh/contracts";

export const HomeIdentity = observer(() => {
  const profiles = useStore(StoreKey.Profile);

  useEffect(() => {
    void profiles.load({ loader: false }).catch(() => {
      return undefined;
    });
  }, [profiles]);

  const profile = profiles.profile;
  if (!profile) {
    return null;
  }

  const specialization =
    optionLabel(specializationOptions, profile.specialization) ??
    "Специализация не выбрана";
  const grade = optionLabel(gradeOptions, profile.verifiedGrade);
  const next = nextStep(profile);

  return (
    <Stack gap="xs">
      {profile.displayName ? (
        <Title order={2}>{profile.displayName}</Title>
      ) : null}
      <Group justify="space-between" align="flex-end">
        <Text>
          {specialization}
          {grade ? `, ${grade}` : ", грейд не подтверждён"}
        </Text>
        <Badge color={profile.listed ? "fsp" : "gray"} variant="light">
          {profile.listed ? "На бирже" : "Не на бирже"}
        </Badge>
      </Group>
      {next ? (
        <Text>
          {next.text}{" "}
          <Anchor component={Link} to={next.to}>
            {next.label}
          </Anchor>
        </Text>
      ) : null}
    </Stack>
  );
});

function nextStep(
  profile: CandidateProfile,
): { text: string; to: string; label: string } | null {
  if (
    !profile.displayName ||
    !profile.specialization ||
    !profile.claimedGrade
  ) {
    return {
      text: "Сохраните анкету, чтобы компании могли вас найти.",
      to: ROUTES.PROFILE,
      label: "К анкете",
    };
  }
  if (!profile.verifiedGrade) {
    return {
      text: "Пройдите тест, чтобы компании видели подтверждённый грейд.",
      to: `${ROUTES.PROFILE}?tab=testing`,
      label: "К тестированию",
    };
  }
  return null;
}
