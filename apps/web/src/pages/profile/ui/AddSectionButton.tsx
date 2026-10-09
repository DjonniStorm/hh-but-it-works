import { type SectionKey, sectionLabels } from "@/pages/profile/model/sections";
import { Button, Menu } from "@mantine/core";

export const AddSectionButton = ({
  available,
  onAdd,
}: {
  available: SectionKey[];
  onAdd: (key: SectionKey) => void;
}) => {
  return (
    <Menu position="bottom-start" shadow="md">
      <Menu.Target>
        <Button variant="default">Добавить раздел</Button>
      </Menu.Target>
      <Menu.Dropdown>
        {available.map((key) => {
          return (
            <Menu.Item
              key={key}
              onClick={() => {
                onAdd(key);
              }}
            >
              {sectionLabels[key]}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
};
