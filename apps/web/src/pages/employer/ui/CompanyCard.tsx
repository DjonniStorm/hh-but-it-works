import { telegramUrl } from "@/pages/employer/model/company";
import { ContactLine } from "@/pages/employer/ui/ContactLine";
import {
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import type { CompanyProfile } from "@hh/contracts";

export const CompanyCard = ({
  company,
  onEdit,
}: {
  company: CompanyProfile;
  onEdit: () => void;
}) => {
  return (
    <Paper withBorder radius="md" p={{ base: "md", sm: "xl" }}>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          {/* На телефоне кнопка уходит под название, а не обрезается рядом с ним. */}
          <Stack gap={6} style={{ flex: "1 1 14rem", minWidth: 0 }}>
            <Text size="xs" c="dimmed">
              Так кандидат увидит компанию в приглашении
            </Text>
            <Title order={3}>{company.name}</Title>
            <Badge
              variant="light"
              tt="none"
              style={{ alignSelf: "flex-start" }}
            >
              {company.industry}
            </Badge>
          </Stack>
          <Button variant="default" onClick={onEdit} style={{ flexShrink: 0 }}>
            Редактировать
          </Button>
        </Group>

        {/* Переносы строк из описания сохраняем, как их написал работодатель. */}
        <Text size="sm" style={{ whiteSpace: "pre-line" }}>
          {company.description}
        </Text>

        <Divider />

        <Stack gap={6}>
          <ContactLine
            label="Сайт"
            value={company.website}
            href={company.website}
            external
          />
          <ContactLine
            label="Почта"
            value={company.contactEmail}
            href={`mailto:${company.contactEmail}`}
          />
          <ContactLine
            label="Telegram"
            value={company.contactTelegram}
            href={telegramUrl(company.contactTelegram)}
            external
          />
        </Stack>
      </Stack>
    </Paper>
  );
};
