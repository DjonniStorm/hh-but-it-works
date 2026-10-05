import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ROUTES } from "@/shared/router/routes";
import { observer } from "mobx-react-lite";
import { Navigate, Outlet } from "react-router";

export const ProtectedRoute = observer(() => {
  const auth = useStore(StoreKey.Auth);
  if (!auth.accessToken) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }
  return <Outlet />;
});
