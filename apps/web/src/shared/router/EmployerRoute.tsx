import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { observer } from "mobx-react-lite";
import { Navigate, Outlet } from "react-router";

import { Role } from "@hh/types";

import { ROUTES } from "./routes";

export const EmployerRoute = observer(() => {
  const auth = useStore(StoreKey.Auth);
  if (auth.user?.role !== Role.Employer) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return <Outlet />;
});
