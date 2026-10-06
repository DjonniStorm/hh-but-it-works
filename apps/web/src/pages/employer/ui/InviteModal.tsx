import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { CompanyRequired } from "@/pages/employer/ui/CompanyRequired";
import { InviteForm } from "@/pages/employer/ui/InviteForm";
import { Modal } from "@mantine/core";
import { observer } from "mobx-react-lite";

import type { CandidateSnapshot, HiringNeed } from "@hh/contracts";

type Props = {
  // Кандидат остаётся заданным и после закрытия: модалка доигрывает анимацию с тем же содержимым.
  candidate: CandidateSnapshot | null;
  opened: boolean;
  need: HiringNeed;
  onClose: () => void;
};

export const InviteModal = observer(
  ({ candidate, opened, need, onClose }: Props) => {
    const employer = useStore(StoreKey.Employer);

    return (
      <Modal
        opened={opened && candidate !== null}
        onClose={onClose}
        title={candidate ? `Приглашение: ${candidate.alias}` : ""}
        size="lg"
      >
        {candidate && !employer.company ? <CompanyRequired /> : null}
        {candidate && employer.company ? (
          <InviteForm
            candidate={candidate}
            need={need}
            company={employer.company}
            onDone={onClose}
          />
        ) : null}
      </Modal>
    );
  },
);
