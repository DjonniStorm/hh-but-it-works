import type { ComponentType } from "react";

import { EmployerLayout } from "@/pages/employer/ui/EmployerLayout";
import { Navigate, createBrowserRouter } from "react-router";

import { AuthLayout } from "./AuthLayout";
import { CandidateRoute } from "./CandidateRoute";
import { EmployerRoute } from "./EmployerRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { QueryState } from "./QueryState";
import { RouteError } from "./RouteError";
import { RouteFallback } from "./RouteFallback";
import { ROUTES } from "./routes";

// observer() возвращает React.memo: у него $$typeof, а typeof — "object".
function isPageComponent(value: unknown): value is ComponentType {
  if (typeof value === "function") {
    return true;
  }
  return typeof value === "object" && value !== null && "$$typeof" in value;
}

// Литерал import() остаётся на вызове: Vite видит путь и кладёт страницу в свой чанк.
function lazyPage<T extends Record<string, unknown>>(
  load: () => Promise<T>,
  exportName: keyof T & string,
) {
  return async () => {
    const module = await load();
    const Component = module[exportName];
    if (!isPageComponent(Component)) {
      throw new Error(`В модуле маршрута нет компонента ${exportName}`);
    }
    return { Component };
  };
}

const pageFallback = <RouteFallback />;
const screenFallback = <RouteFallback fullScreen />;

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    element: <QueryState />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            lazy: lazyPage(() => import("@/pages/home/HomePage"), "HomePage"),
            hydrateFallbackElement: pageFallback,
          },
          {
            element: <CandidateRoute />,
            children: [
              {
                path: ROUTES.PROFILE,
                lazy: lazyPage(
                  () => import("@/pages/profile/ui/ProfilePage"),
                  "ProfilePage",
                ),
                hydrateFallbackElement: pageFallback,
              },
              {
                path: ROUTES.INVITATIONS,
                lazy: lazyPage(
                  () =>
                    import("@/pages/invitations/ui/CandidateInvitationsPage"),
                  "CandidateInvitationsPage",
                ),
                hydrateFallbackElement: pageFallback,
              },
            ],
          },
          {
            element: <EmployerRoute />,
            children: [
              {
                path: ROUTES.EMPLOYER.ROOT,
                element: <EmployerLayout />,
                children: [
                  {
                    index: true,
                    element: <Navigate to={ROUTES.EMPLOYER.NEEDS} replace />,
                  },
                  {
                    path: ROUTES.EMPLOYER.NEEDS,
                    lazy: lazyPage(
                      () => import("@/pages/employer/ui/NeedsPage"),
                      "NeedsPage",
                    ),
                    hydrateFallbackElement: pageFallback,
                  },
                  {
                    path: ROUTES.EMPLOYER.NEED_NEW,
                    lazy: lazyPage(
                      () => import("@/pages/employer/ui/NeedNewPage"),
                      "NeedNewPage",
                    ),
                    hydrateFallbackElement: pageFallback,
                  },
                  {
                    path: ROUTES.EMPLOYER.NEED,
                    lazy: lazyPage(
                      () => import("@/pages/employer/ui/NeedPage"),
                      "NeedPage",
                    ),
                    hydrateFallbackElement: pageFallback,
                  },
                  {
                    path: ROUTES.EMPLOYER.INVITATIONS,
                    lazy: lazyPage(
                      () => import("@/pages/employer/ui/InvitationsPage"),
                      "InvitationsPage",
                    ),
                    hydrateFallbackElement: pageFallback,
                  },
                  {
                    path: ROUTES.EMPLOYER.COMPANY,
                    lazy: lazyPage(
                      () => import("@/pages/employer/ui/CompanyPage"),
                      "CompanyPage",
                    ),
                    hydrateFallbackElement: pageFallback,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          {
            path: ROUTES.AUTH.LOGIN,
            lazy: lazyPage(() => import("@/pages/auth/LoginPage"), "LoginPage"),
            hydrateFallbackElement: screenFallback,
          },
          {
            path: ROUTES.AUTH.REGISTER,
            lazy: lazyPage(
              () => import("@/pages/auth/RegisterPage"),
              "RegisterPage",
            ),
            hydrateFallbackElement: screenFallback,
          },
          {
            path: ROUTES.AUTH.CONFIRM,
            lazy: lazyPage(
              () => import("@/pages/auth/ConfirmPage"),
              "ConfirmPage",
            ),
            hydrateFallbackElement: screenFallback,
          },
        ],
      },
      {
        path: ROUTES.TEST,
        lazy: lazyPage(() => import("@/pages/test/TestPage"), "TestPage"),
        hydrateFallbackElement: screenFallback,
      },
    ],
  },
]);
