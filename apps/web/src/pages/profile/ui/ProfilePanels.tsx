import {
  type ReactNode,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import {
  type SectionKey,
  initialSections,
  sectionOrder,
} from "@/pages/profile/model/sections";
import type { ResumeDraftHit } from "@/pages/profile/model/types";
import { useProfileForm } from "@/pages/profile/model/use-profile-form";
import { AddSectionButton } from "@/pages/profile/ui/AddSectionButton";
import { ContactsPanel } from "@/pages/profile/ui/ContactsPanel";
import { EducationPanel } from "@/pages/profile/ui/EducationPanel";
import { ExperiencePanel } from "@/pages/profile/ui/ExperiencePanel";
import { SearchPanel } from "@/pages/profile/ui/SearchPanel";
import { SkillsPanel } from "@/pages/profile/ui/SkillsPanel";
import { Box, Group, useMatches } from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

const gap = "var(--mantine-spacing-lg)";

type ProfilePanelsProps = {
  profile: CandidateProfile;
  email: string;
  draft: ResumeDraftHit | null;
};

// memo: профиль обновляется редко, а переключение вкладок и лоадеры в родителе
// перерисовывают страницу целиком — плиткам эти ререндеры не нужны.
export const ProfilePanels = memo(
  ({ profile, email, draft }: ProfilePanelsProps) => {
    const profiles = useStore(StoreKey.Profile);
    // Форма одна на все плитки: сохраняется вся анкета, у каждой плитки только кнопка и заголовок.
    const { form, submit } = useProfileForm({ profile, draft });
    // Разделы, которые кандидат открыл кнопкой. Заполненные открыты сразу.
    const [sections, setSections] = useState<SectionKey[]>(() => {
      return initialSections(profile);
    });
    const available = sectionOrder.filter((key) => {
      return !sections.includes(key);
    });
    // Колонки вместо сетки: карточка не дотягивается до высоты соседа и не оставляет пустой блок.
    const columnCount = useMatches(
      { base: 1, md: 2 },
      { getInitialValueInEffect: false },
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const [highlighted, setHighlighted] = useState<SectionKey | null>(null);

    const onAdd = useCallback((key: SectionKey) => {
      // Порядок плиток задаёт sectionOrder, а не то, что добавили первым.
      setSections((current) => {
        return sectionOrder.filter((item) => {
          return item === key || current.includes(item);
        });
      });
      setHighlighted(key);
    }, []);

    // Плитки описаны декларативно: JSX создаётся при рендере, это путь React,
    // мемоизировать его бессмысленно — форма Mantine отдаёт новый объект каждый рендер.
    const tiles: { key: string; node: ReactNode }[] = [
      {
        key: "contacts",
        node: (
          <ContactsPanel
            profile={profile}
            email={email}
            form={form}
            submit={submit}
          />
        ),
      },
      ...(sections.includes("education")
        ? [
            {
              key: "education",
              node: <EducationPanel form={form} submit={submit} />,
            },
          ]
        : []),
      ...(sections.includes("experience")
        ? [
            {
              key: "experience",
              node: <ExperiencePanel form={form} submit={submit} />,
            },
          ]
        : []),
      { key: "search", node: <SearchPanel form={form} submit={submit} /> },
      { key: "skills", node: <SkillsPanel profile={profile} draft={draft} /> },
    ];

    // Эффекты детей уже подставили черновик. Дальше он не должен переживать уход со страницы.
    useEffect(() => {
      if (!draft) {
        return;
      }
      profiles.clearResumeDraft();
    }, [draft, profiles]);

    // Новая карточка встаёт в начало потока, а кнопка была внизу: доводим до неё взгляд.
    useEffect(() => {
      if (!highlighted) {
        return;
      }
      const node = containerRef.current?.querySelector<HTMLElement>(
        `[data-tile="${highlighted}"]`,
      );
      node?.scrollIntoView({ block: "center", behavior: "smooth" });
      const timer = window.setTimeout(() => {
        setHighlighted(null);
      }, 2000);
      return () => {
        window.clearTimeout(timer);
      };
    }, [highlighted]);

    return (
      <>
        <Box ref={containerRef} style={{ columnCount, columnGap: gap }}>
          {tiles.map((tile) => {
            const active = highlighted === tile.key;
            return (
              // Без этого карточка порвётся между колонками при балансировке.
              <Box
                key={tile.key}
                data-tile={tile.key}
                style={{
                  breakInside: "avoid",
                  marginBottom: gap,
                  // Кольцо вместо outline, чтобы обводка плавно гасла после подсветки.
                  boxShadow: active
                    ? "0 0 0 2px var(--mantine-primary-color-filled)"
                    : "0 0 0 0 transparent",
                  transition: "box-shadow 0.4s ease",
                }}
              >
                {tile.node}
              </Box>
            );
          })}
        </Box>
        {available.length > 0 ? (
          <Group mt="lg">
            <AddSectionButton available={available} onAdd={onAdd} />
          </Group>
        ) : null}
      </>
    );
  },
);
