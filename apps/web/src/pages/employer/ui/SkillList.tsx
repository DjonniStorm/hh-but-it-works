import { Badge, Group, Stack, Text } from "@mantine/core";

export const SkillList = ({
  label,
  skills,
  variant = "light",
}: {
  label: string;
  skills: string[];
  variant?: "light" | "outline";
}) => {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Group gap={4}>
        {skills.map((skill) => {
          return (
            <Badge key={skill} variant={variant} tt="none">
              {skill}
            </Badge>
          );
        })}
      </Group>
    </Stack>
  );
};
