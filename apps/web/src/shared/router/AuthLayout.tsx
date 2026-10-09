import { Suspense } from "react";

import { RequestOverlay } from "@/app/store/request-overlay";
import { Outlet } from "react-router";

import { RouteFallback } from "./RouteFallback";

export const AuthLayout = () => {
  return (
    <RequestOverlay fullScreen>
      <Suspense fallback={<RouteFallback fullScreen />}>
        <Outlet />
      </Suspense>
    </RequestOverlay>
  );
};
