import { ConfirmPage } from "@/pages/auth/ConfirmPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { HomePage } from "@/pages/home/HomePage";
import { ProfilePage } from "@/pages/profile/ui/ProfilePage";
import { TestPage } from "@/pages/test/TestPage";
import { createBrowserRouter } from "react-router";

import { AuthLayout } from "./AuthLayout";
import { CandidateRoute } from "./CandidateRoute";
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
