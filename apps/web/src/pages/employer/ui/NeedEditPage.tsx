import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { needFormValues } from "@/pages/employer/model/need-form";
import { BackToNeeds } from "@/pages/employer/ui/BackToNeeds";
import { NeedForm } from "@/pages/employer/ui/NeedForm";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES, needPath } from "@/shared/router/routes";
import { Stack, Text, Title } from "@mantine/core";
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { Navigate, useNavigate, useParams } from "react-router";

export const NeedEditPage = observer(() => {
  useHead({ title: pageTitle.needEdit });
  const { needId = "" } = useParams();
  const employer = useStore(StoreKey.Employer);
  const navigate = useNavigate();
  const need = employer.needById(needId);

  if (!need) {
    return <Navigate to={ROUTES.EMPLOYER.NEEDS} replace />;
  }

  return (
    <Stack gap="lg" maw={860}>
      <Stack gap={4}>
        <BackToNeeds />
        <Title order={2}>{need.title}</Title>
        <Text c="dimmed" size="sm">
          Подборка пересоберётся по новым требованиям. Отправленные приглашения
          сохранят свой текст и вилку.
        </Text>
      </Stack>

      <NeedForm
        // Форма берёт начальные значения один раз: другая потребность — новая форма.
        key={need.id}
        initialValues={needFormValues(need)}
        submitLabel="Сохранить"
        cancelTo={needPath(need.id)}
        onSubmit={(input) => {
          void employer.updateNeed(need.id, input, {
            onSuccess: () => {
              navigate(needPath(need.id));
            },
          });
        }}
      />
    </Stack>
  );
});
