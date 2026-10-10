import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { emptyNeedForm } from "@/pages/employer/model/need-form";
import { BackToNeeds } from "@/pages/employer/ui/BackToNeeds";
import { NeedForm } from "@/pages/employer/ui/NeedForm";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES, needPath } from "@/shared/router/routes";
import { Stack, Text, Title } from "@mantine/core";
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router";

export const NeedNewPage = observer(() => {
  useHead({ title: pageTitle.needNew });
  const employer = useStore(StoreKey.Employer);
  const navigate = useNavigate();

  return (
    <Stack gap="lg" maw={860} mx="auto">
      <Stack gap={4}>
        <BackToNeeds />
        <Title order={2}>Кого вы ищете?</Title>
        <Text c="dimmed" size="sm">
          Подборка строится по категории кандидатов (специализация и
          подтверждённый грейд), а не по ключевым словам резюме.
        </Text>
      </Stack>

      <NeedForm
        initialValues={emptyNeedForm}
        submitLabel="Собрать подборку"
        cancelTo={ROUTES.EMPLOYER.NEEDS}
        onSubmit={(input) => {
          void employer.createNeed(input, {
            onSuccess: (need) => {
              navigate(needPath(need.id));
            },
          });
        }}
      />
    </Stack>
  );
});
