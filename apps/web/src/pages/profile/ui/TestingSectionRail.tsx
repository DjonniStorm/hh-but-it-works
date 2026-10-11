import type { ActiveAttempt } from "@/pages/profile/model/attempt";
import { Stack, Text } from "@mantine/core";

export const TestingSectionRail = ({
  sections,
  current,
}: {
  sections: ActiveAttempt["sections"];
  current: number;
}) => {
  return (
    // На телефоне список секций сдвигал вопрос за экран: там секция пишется строкой в TestingRun.
    <Stack
      gap={6}
      component="ol"
      visibleFrom="sm"
      style={{ listStyle: "none", margin: 0, padding: 0, minWidth: 160 }}
    >
      {sections.map((section, index) => {
        const state =
          index < current ? "done" : index === current ? "now" : "later";
        return (
          <Text
            key={section.skillId}
            component="li"
            c={state === "later" ? "dimmed" : undefined}
            fw={state === "now" ? 700 : 400}
          >
            {index + 1}. {section.title}
          </Text>
        );
      })}
    </Stack>
  );
};
