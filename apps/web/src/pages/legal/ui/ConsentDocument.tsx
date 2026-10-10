import { consentSections, consentTitle } from "@/pages/legal/model/consent";
import { Stack, Text, Title } from "@mantine/core";

export const ConsentDocument = () => {
  return (
    <Stack gap="md">
      <Title order={3}>{consentTitle}</Title>
      <Text>
        Регистрируясь в сервисе, пользователь даёт это согласие по Федеральному
        закону от 27.07.2006 № 152-ФЗ «О персональных данных». Галочка при
        регистрации — форма согласия.
      </Text>
      {consentSections.map((section) => {
        return (
          <Stack key={section.heading} gap={4}>
            <Text fw={600}>{section.heading}</Text>
            {section.paragraphs.map((paragraph) => {
              return <Text key={paragraph}>{paragraph}</Text>;
            })}
          </Stack>
        );
      })}
    </Stack>
  );
};
