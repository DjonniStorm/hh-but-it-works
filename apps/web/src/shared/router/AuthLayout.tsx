import { RequestOverlay } from "@/app/store/request-overlay";
import { Outlet } from "react-router";

export const AuthLayout = () => {
  return (
    <RequestOverlay fullScreen>
      <Outlet />
    </RequestOverlay>
  );
};
