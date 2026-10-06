import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { CompanyRequired } from "@/pages/employer/ui/CompanyRequired";
import { InviteForm } from "@/pages/employer/ui/InviteForm";
import { Modal } from "@mantine/core";
import { observer } from "mobx-react-lite";

import type { CandidateSnapshot, HiringNeed } from "@hh/contracts";

type Props = {
  candidate: CandidateSnapshot | null;
  need: HiringNeed;
  onClose: () => void;
};

export const InviteModal = observer(({ candidate, need, onClose }: Props) => {
  const employer = useStore(StoreKey.Employer);

  return (
    <Modal
      opened={candidate !== null}
      onClose={onClose}
      title={candidate ? `Приглашение: ${candidate.alias}` : ""}
      size="lg"
    >
      {candidate && employer.company ? (
        <InviteForm
          candidate={candidate}
          need={need}
          company={employer.company}
          onDone={onClose}
        />
      ) : (
        <CompanyRequired />
      )}
    </Modal>
  );
});
