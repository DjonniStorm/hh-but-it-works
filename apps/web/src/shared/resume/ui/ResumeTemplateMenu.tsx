import { resumeTemplateOptions } from "@/shared/resume/model/templates";
import { Button, type ButtonProps, Menu, Text } from "@mantine/core";

import type { ResumeTemplate } from "@hh/types";

type Props = {
  label: string;
  size?: ButtonProps["size"];
  onPick: (template: ResumeTemplate) => void;
};

// Кнопка скачивания PDF с выбором оформления. Общая для кандидата и работодателя.
export const ResumeTemplateMenu = ({ label, size, onPick }: Props) => {
  return (
    <Menu position="bottom-start" shadow="md" width={280} withinPortal>
      <Menu.Target>
        <Button type="button" variant="default" size={size}>
          {label}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Оформление PDF</Menu.Label>
        {resumeTemplateOptions.map((option) => {
          return (
            <Menu.Item
              key={option.value}
              onClick={() => {
                onPick(option.value);
              }}
            >
              <Text size="sm" fw={600}>
                {option.label}
              </Text>
              <Text size="xs" c="dimmed">
                {option.description}
              </Text>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
};
