import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { SalaryFields } from "@/pages/employer/ui/SalaryFields";
import {
  Button,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { observer } from "mobx-react-lite";

import {
  type CandidateSnapshot,
  type CompanyProfile,
  type HiringNeed,
  type InvitationInput,
  invitationInputSchema,
} from "@hh/contracts";

type Props = {
  candidate: CandidateSnapshot;
  need: HiringNeed;
  company: CompanyProfile;
  onDone: () => void;
};

// Модалка монтирует форму при каждом открытии, поэтому начальные значения свежие.
export const InviteForm = observer(
  ({ candidate, need, company, onDone }: Props) => {
    const invitations = useStore(StoreKey.Invitations);
    const form = useForm({
      initialValues: {
        candidateId: candidate.id,
        needId: need.id as string | null,
        message: [
          `Здравствуйте! ${company.name} ищет специалиста: ${need.title}.`,
          need.description,
        ]
          .filter(Boolean)
          .join("\n\n"),
        contact: company.contactTelegram || company.contactEmail,
        salaryFrom: need.salaryFrom as number | "",
        salaryTo: need.salaryTo as number | "",
      },
      validate: schemaResolver(invitationInputSchema, { sync: true }),
    });

    const onSubmit = form.onSubmit((values) => {
      // Резолвер уже проверил вилку. В типе формы пустое поле шире, чем ждёт send.
      void invitations.send(values as InvitationInput, {
        onSuccess: () => {
          notifier.showSuccess("Приглашение отправлено");
          onDone();
        },
      });
    });

    return (
      <form onSubmit={onSubmit}>
        <Stack>
          <Text size="sm" c="dimmed">
            Кандидат увидит условия до начала общения. Его контакт откроется
            после того, как он примет приглашение.
          </Text>
          <Textarea
            label="Предложение"
            autosize
            minRows={4}
            {...form.getInputProps("message")}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <SalaryFields
              fromProps={form.getInputProps("salaryFrom")}
              toProps={form.getInputProps("salaryTo")}
            />
          </SimpleGrid>
          <TextInput
            label="Как с вами связаться"
            {...form.getInputProps("contact")}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onDone}>
              Отмена
            </Button>
            <Button type="submit">Отправить приглашение</Button>
          </Group>
        </Stack>
      </form>
    );
  },
);
