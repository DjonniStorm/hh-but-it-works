import { useRef } from "react";

import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { draftHasFields } from "@/pages/profile/model/apply-resume-draft";
import { Button, FileButton } from "@mantine/core";

export const ResumeUpload = () => {
  const profiles = useStore(StoreKey.Profile);
  const resetRef = useRef<() => void>(null);

  return (
    <FileButton
      resetRef={resetRef}
      accept="application/pdf"
      onChange={(file) => {
        resetRef.current?.();
        if (!file) {
          return;
        }
        void profiles.parseResume(file, {
          onSuccess: (draft) => {
            if (!draftHasFields(draft)) {
              notifier.showError("В тексте не нашлось полей анкеты");
              return;
            }
            notifier.showSuccess(
              "Черновик в форме. В профиль попадёт после сохранения.",
            );
          },
        });
      }}
    >
      {(props) => {
        return (
          <Button variant="default" {...props} type="button">
            Разобрать PDF
          </Button>
        );
      }}
    </FileButton>
  );
};
