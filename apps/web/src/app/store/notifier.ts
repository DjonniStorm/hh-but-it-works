import { feedbackColor } from "@/shared/theme";
import { notifications } from "@mantine/notifications";

export class Notifier {
  showError(message: string): void {
    notifications.show({ message, color: feedbackColor.error });
  }

  showSuccess(message: string): void {
    notifications.show({ message, color: feedbackColor.success });
  }
}

export const notifier = new Notifier();
