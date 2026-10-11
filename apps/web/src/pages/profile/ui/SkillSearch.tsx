import { useRef, useState } from "react";

import { skillLevelOptions } from "@/pages/profile/model/options";
import {
  type CatalogSkill,
  availableSkills,
  findSkill,
  matchingSkills,
  sameTitle,
  skillGroups,
} from "@/pages/profile/model/skill-query";
import { specializationLabel } from "@/shared/lib/labels";
import { fieldBorderColor, surfaceColor } from "@/shared/theme";
import {
  Box,
  Button,
  Combobox,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  useCombobox,
  useMatches,
} from "@mantine/core";

import { SkillLevel, type Specialization } from "@hh/types";

export const SkillSearch = ({
  catalog,
  takenTitles,
  specialization,
  onAdd,
}: {
  catalog: CatalogSkill[];
  takenTitles: string[];
  specialization: Specialization | null;
  onAdd: (draft: {
    title: string;
    skillId?: string;
    level: SkillLevel;
  }) => void;
}) => {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string | null>(null);
  // На телефоне список стоит под полем, а не всплывает: всплывающий прыгал от клавиатуры
  // и не листался пальцем. Открыт он, пока поле в фокусе.
  const [listOpen, setListOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const phone = useMatches(
    { base: true, sm: false },
    { getInitialValueInEffect: false },
  );
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
    },
  });

  const open = availableSkills(catalog, takenTitles);
  const needle = query.trim();
  // Сверяем со всем каталогом, не только со свободными: «postgresql» это PostgreSQL.
  const known = findSkill(catalog, needle);
  const matches = matchingSkills(open, query);
  const groups = visibleGroups(matches, needle, specialization);
  const already = takenTitles.some((title) => {
    return sameTitle(title, needle);
  });
  const showCreate = needle.length > 0 && !known && !already;

  const add = () => {
    if (!isSkillLevel(level) || !needle || already) {
      return;
    }
    onAdd({
      title: known?.title ?? needle,
      skillId: known?.skillId,
      level,
    });
    setQuery("");
    setLevel(null);
    combobox.closeDropdown();
  };

  const openList = () => {
    if (phone) {
      setListOpen(true);
      return;
    }
    combobox.openDropdown();
  };

  const options = (
    <>
      {groups.map((group) => {
        return (
          <Combobox.Group key={group.key} label={group.label}>
            {group.skills.map((skill) => {
              return (
                <Combobox.Option key={skill.skillId} value={skill.skillId}>
                  <Group justify="space-between" wrap="nowrap" gap="xs">
                    <Text size="sm">{skill.title}</Text>
                    {skill.tested ? null : (
                      <Text size="xs" c="dimmed">
                        без теста
                      </Text>
                    )}
                  </Group>
                </Combobox.Option>
              );
            })}
          </Combobox.Group>
        );
      })}
      {showCreate ? (
        <Combobox.Option value={needle}>
          Такого нет, добавим «{needle}»
        </Combobox.Option>
      ) : null}
      {already ? <Combobox.Empty>Уже в списке</Combobox.Empty> : null}
      {groups.length === 0 && !showCreate && !already ? (
        <Combobox.Empty>Ничего не нашли</Combobox.Empty>
      ) : null}
    </>
  );

  const input = (
    <TextInput
      ref={inputRef}
      label="Навык"
      description="Каталог открыт по специализации. Навык без теста останется неподтверждённым. Если такого нет — добавим ваш вариант."
      placeholder="PostgreSQL"
      value={query}
      onChange={(event) => {
        setQuery(event.currentTarget.value);
        openList();
        combobox.updateSelectedOptionIndex();
      }}
      onClick={openList}
      onFocus={openList}
      onBlur={() => {
        setListOpen(false);
      }}
    />
  );

  return (
    <Stack gap="sm">
      <Combobox
        store={combobox}
        onOptionSubmit={(value) => {
          const skill = open.find((item) => {
            return item.skillId === value;
          });
          setQuery(skill?.title ?? value);
          combobox.closeDropdown();
          if (phone) {
            // Клавиатура уходит, и под полем виден выбор уровня.
            setListOpen(false);
            inputRef.current?.blur();
          }
        }}
      >
        {phone ? (
          <>
            <Combobox.EventsTarget>{input}</Combobox.EventsTarget>
            {listOpen ? (
              <Box
                mah={240}
                style={{
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  background: surfaceColor,
                  border: `1px solid ${fieldBorderColor}`,
                }}
              >
                <Combobox.Options>{options}</Combobox.Options>
              </Box>
            ) : null}
          </>
        ) : (
          <>
            <Combobox.Target>{input}</Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options mah={320} style={{ overflowY: "auto" }}>
                {options}
              </Combobox.Options>
            </Combobox.Dropdown>
          </>
        )}
      </Combobox>
      <Group align="flex-end" wrap="wrap">
        <Select
          style={{ flex: "1 1 160px" }}
          label="Уровень"
          placeholder="Выберите"
          data={skillLevelOptions}
          value={level}
          onChange={setLevel}
        />
        <Button
          type="button"
          disabled={!needle || !level || already}
          onClick={add}
        >
          Добавить
        </Button>
      </Group>
    </Stack>
  );
};

function isSkillLevel(value: string | null): value is SkillLevel {
  return Object.values(SkillLevel).includes(value as SkillLevel);
}

// Пустой запрос показывает свою специализацию. Поиск идёт по всему каталогу.
function visibleGroups(
  skills: CatalogSkill[],
  query: string,
  specialization: Specialization | null,
) {
  const groups = skillGroups(skills, specialization, specializationLabel);
  if (!query) {
    if (!specialization) {
      return groups.flatMap((group) => {
        const head = group.skills.slice(0, 6);
        if (head.length === 0) {
          return [];
        }
        return [{ ...group, skills: head }];
      });
    }
    return groups.filter((group) => {
      return group.key === specialization;
    });
  }
  return groups.flatMap((group) => {
    const head = group.skills.slice(0, 8);
    if (head.length === 0) {
      return [];
    }
    return [{ ...group, skills: head }];
  });
}
