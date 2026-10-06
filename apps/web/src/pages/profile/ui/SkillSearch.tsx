import { useState } from "react";

import { skillLevelOptions } from "@/pages/profile/model/options";
import {
  type CatalogSkill,
  availableSkills,
  findSkill,
  matchingSkills,
  sameTitle,
} from "@/pages/profile/model/skill-query";
import {
  Button,
  Combobox,
  Group,
  Select,
  Stack,
  TextInput,
  useCombobox,
} from "@mantine/core";

import { SkillLevel } from "@hh/types";

export const SkillSearch = ({
  catalog,
  takenTitles,
  onAdd,
}: {
  catalog: CatalogSkill[];
  takenTitles: string[];
  onAdd: (draft: {
    title: string;
    skillId?: string;
    level: SkillLevel;
  }) => void;
}) => {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string | null>(null);
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
    },
  });

  const open = availableSkills(catalog, takenTitles);
  const needle = query.trim();
  // Сверяем со всем каталогом, не только со свободными: «postgresql» это PostgreSQL.
  const known = findSkill(catalog, needle);
  const matches = matchingSkills(open, query).slice(0, 8);
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
        }}
      >
        <Combobox.Target>
          <TextInput
            label="Навык"
            description="Из каталога профиля. Если такого нет — добавим ваш вариант."
            placeholder="PostgreSQL"
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              combobox.openDropdown();
              combobox.updateSelectedOptionIndex();
            }}
            onClick={() => {
              combobox.openDropdown();
            }}
            onFocus={() => {
              combobox.openDropdown();
            }}
          />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            {matches.map((skill) => {
              return (
                <Combobox.Option key={skill.skillId} value={skill.skillId}>
                  {skill.title}
                </Combobox.Option>
              );
            })}
            {showCreate ? (
              <Combobox.Option value={needle}>
                Такого нет, добавим «{needle}»
              </Combobox.Option>
            ) : null}
            {already ? <Combobox.Empty>Уже в списке</Combobox.Empty> : null}
            {matches.length === 0 && !showCreate && !already ? (
              <Combobox.Empty>Ничего не нашли</Combobox.Empty>
            ) : null}
          </Combobox.Options>
        </Combobox.Dropdown>
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
  return (
    value === SkillLevel.Basic ||
    value === SkillLevel.Confident ||
    value === SkillLevel.Strong
  );
}
