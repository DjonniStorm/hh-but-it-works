import { useEffect } from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { profileProgress } from "@/pages/home/model/progress";
import { AttemptWidget } from "@/pages/home/ui/AttemptWidget";
import { ChecklistWidget } from "@/pages/home/ui/ChecklistWidget";
import { FspImportBanner } from "@/pages/home/ui/FspImportBanner";
import { HomeHero } from "@/pages/home/ui/HomeHero";
import { HomeOffer } from "@/pages/home/ui/HomeOffer";
import { MaterialsSection } from "@/pages/home/ui/MaterialsSection";
import { PrepCard } from "@/pages/home/ui/PrepCard";
import { SkillsWidget } from "@/pages/home/ui/SkillsWidget";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES } from "@/shared/router/routes";
import { SimpleGrid, Stack } from "@mantine/core";
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { Navigate } from "react-router";

import { Role } from "@hh/types";

export const HomePage = observer(() => {
  useHead({ title: pageTitle.home });
  const auth = useStore(StoreKey.Auth);
  const profiles = useStore(StoreKey.Profile);

  // У работодателя своя главная: подборки.
  if (auth.user?.role === Role.Employer) {
    return <Navigate to={ROUTES.EMPLOYER.ROOT} replace />;
  }

  // Анкета нужна для кольца, тем и виджетов. Тихая загрузка: тост при ошибке — от стора.
  useEffect(() => {
    void profiles.load({ loader: false }).catch(() => {
      return undefined;
    });
  }, [profiles]);

  const profile = profiles.profile;
  const profileFspId = profile?.fspId ?? null;

  // Импорт ФСП: пока ID не привязан, спрашиваем реестр о почте кандидата.
  // Баннер сам покажет ответ found и спрячет остальные статусы.
  useEffect(() => {
    if (!profileFspId && auth.user?.role === Role.Candidate) {
      void profiles.loadFspPreview().catch(() => {
        return undefined;
      });
    }
  }, [profiles, profileFspId, auth.user?.role]);

  const progress = profileProgress(profile);

  // На широких экранах контент занимает всю ширину main: maw ужимал страницу
  // до 1000px и половина экрана пустовала.
  return (
    <Stack gap="xl">
      <HomeHero profile={profile} progress={progress} />
      <HomeOffer />
      {profile ? (
        <>
          <FspImportBanner profile={profile} />
          <PrepCard profile={profile} />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <SkillsWidget profile={profile} />
            <AttemptWidget profile={profile} />
            <ChecklistWidget progress={progress} />
          </SimpleGrid>
          <MaterialsSection profile={profile} />
        </>
      ) : null}
    </Stack>
  );
});
