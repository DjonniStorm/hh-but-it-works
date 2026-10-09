import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ResumeTemplateMenu } from "@/shared/resume/ui/ResumeTemplateMenu";

export const ProfileDownload = () => {
  const profiles = useStore(StoreKey.Profile);

  return (
    <ResumeTemplateMenu
      label="Скачать профиль"
      onPick={(template) => {
        void profiles.downloadPdf(template);
      }}
    />
  );
};
