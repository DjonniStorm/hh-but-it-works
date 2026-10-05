import { HomePage } from "@/pages/home/HomePage";
import { TestPage } from "@/pages/test/TestPage";
import { createBrowserRouter } from "react-router";

import { ROUTES } from "./routes";

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <HomePage />,
  },
  {
    path: ROUTES.TEST,
    element: <TestPage />,
  },
]);
