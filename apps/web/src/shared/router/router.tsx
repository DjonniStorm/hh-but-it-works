import { ConfirmPage } from "@/pages/auth/ConfirmPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { CompanyPage } from "@/pages/employer/ui/CompanyPage";
import { EmployerLayout } from "@/pages/employer/ui/EmployerLayout";
import { InvitationsPage } from "@/pages/employer/ui/InvitationsPage";
import { NeedNewPage } from "@/pages/employer/ui/NeedNewPage";
import { NeedPage } from "@/pages/employer/ui/NeedPage";
import { NeedsPage } from "@/pages/employer/ui/NeedsPage";
import { HomePage } from "@/pages/home/HomePage";
import { ProfilePage } from "@/pages/profile/ui/ProfilePage";
import { TestPage } from "@/pages/test/TestPage";
import { Navigate, createBrowserRouter } from "react-router";

import { AuthLayout } from "./AuthLayout";
import { CandidateRoute } from "./CandidateRoute";
import { EmployerRoute } from "./EmployerRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { RouteError } from "./RouteError";
import { ROUTES } from "./routes";

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <HomePage /> },
          {
            element: <CandidateRoute />,
            children: [{ path: ROUTES.PROFILE, element: <ProfilePage /> }],
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
                  { path: ROUTES.EMPLOYER.NEEDS, element: <NeedsPage /> },
                  { path: ROUTES.EMPLOYER.NEED_NEW, element: <NeedNewPage /> },
                  { path: ROUTES.EMPLOYER.NEED, element: <NeedPage /> },
                  {
                    path: ROUTES.EMPLOYER.INVITATIONS,
                    element: <InvitationsPage />,
                  },
                  { path: ROUTES.EMPLOYER.COMPANY, element: <CompanyPage /> },
                ],
              },
            ],
          },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.AUTH.LOGIN, element: <LoginPage /> },
          { path: ROUTES.AUTH.REGISTER, element: <RegisterPage /> },
          { path: ROUTES.AUTH.CONFIRM, element: <ConfirmPage /> },
        ],
      },
      { path: ROUTES.TEST, element: <TestPage /> },
    ],
  },
]);
