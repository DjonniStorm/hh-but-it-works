import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { Button } from "@mantine/core";

export const ProfileDownload = () => {
  const profiles = useStore(StoreKey.Profile);

  return (
    <Button
      type="button"
      variant="default"
      onClick={() => {
        void profiles.downloadPdf();
      }}
    >
      Скачать профиль
    </Button>
  );
};
