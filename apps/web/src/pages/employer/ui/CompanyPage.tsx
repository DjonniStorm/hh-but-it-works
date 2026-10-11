import { useState } from "react";

import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import {
  companyFormValues,
  emptyCompany,
} from "@/pages/employer/model/company";
import { CompanyCard } from "@/pages/employer/ui/CompanyCard";
import { CompanyForm } from "@/pages/employer/ui/CompanyForm";
import { ROUTES } from "@/shared/router/routes";
import { useReturnPath } from "@/shared/router/use-return-path";
import { pageSeo } from "@/shared/seo/pages";
import { usePageSeo } from "@/shared/seo/use-page-seo";
import { Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router";

export const CompanyPage = observer(() => {
  usePageSeo(pageSeo.company);
  const employer = useStore(StoreKey.Employer);
  const navigate = useNavigate();
  const returnPath = useReturnPath();
  // Раскладка рендерит страницу после загрузки профиля, поэтому company уже актуален.
  const [editing, setEditing] = useState(false);
  const company = employer.company;

  // Первое заполнение: дальше по пути работодателя.
  const onFirstSaved = () => {
    notifier.showSuccess("Профиль компании сохранён");
    // Пришли из приглашения: возвращаем к подборке.
    if (returnPath !== ROUTES.HOME) {
      navigate(returnPath);
      return;
    }
    navigate(
      employer.needs.length > 0
        ? ROUTES.EMPLOYER.NEEDS
        : ROUTES.EMPLOYER.NEED_NEW,
    );
  };

  return (
    <Stack gap="lg" maw={860} mx="auto">
      <Stack gap={4}>
        <Title order={2}>Профиль компании</Title>
        <Text c="dimmed" size="sm">
          {company
            ? "Название, описание и контакты кандидат видит в каждом приглашении."
            : "Без профиля нельзя пригласить кандидата: в приглашении он видит название компании и способ связи."}
        </Text>
      </Stack>

      {!company ? (
        <CompanyForm
          initial={emptyCompany}
          submitLabel="Сохранить профиль"
          onSaved={onFirstSaved}
        />
      ) : null}

      {company && !editing ? (
        <CompanyCard
          company={company}
          onEdit={() => {
            setEditing(true);
          }}
        />
      ) : null}

      {company && editing ? (
        <CompanyForm
          initial={companyFormValues(company)}
          submitLabel="Сохранить"
          onSaved={() => {
            notifier.showSuccess("Изменения сохранены");
            setEditing(false);
          }}
          onCancel={() => {
            setEditing(false);
          }}
        />
      ) : null}
    </Stack>
  );
});
