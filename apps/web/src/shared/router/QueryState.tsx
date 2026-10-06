import { NuqsAdapter } from "nuqs/adapters/react-router/v8";
import { Outlet } from "react-router";

// Адаптер nuqs должен быть внутри RouterProvider: хуки читают контекст роутера.
export const QueryState = () => {
  return (
    <NuqsAdapter>
      <Outlet />
    </NuqsAdapter>
  );
};
