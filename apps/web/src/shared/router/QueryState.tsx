import { Suspense } from "react";

import { NuqsAdapter } from "nuqs/adapters/react-router/v8";
import { Outlet } from "react-router";

import { RouteFallback } from "./RouteFallback";

// Адаптер nuqs должен быть внутри RouterProvider: хуки читают контекст роутера.
// Suspense здесь ловит /test и любой маршрут без своей границы. Кабинет ближе, в оболочке.
export const QueryState = () => {
  return (
    <NuqsAdapter>
      <Suspense fallback={<RouteFallback fullScreen />}>
        <Outlet />
      </Suspense>
    </NuqsAdapter>
  );
};
