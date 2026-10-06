import { AuthedShell } from "@/app/shell/ui/AuthedShell";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ROUTES } from "@/shared/router/routes";
import { currentPath, returnTo } from "@/shared/router/use-return-path";
import { observer } from "mobx-react-lite";
import { Navigate, useLocation } from "react-router";

export const ProtectedRoute = observer(() => {
  const auth = useStore(StoreKey.Auth);
  const location = useLocation();
  if (!auth.accessToken) {
    return (
      <Navigate
        to={ROUTES.AUTH.LOGIN}
        replace
        state={returnTo(currentPath(location))}
      />
    );
  }
  return <AuthedShell />;
});
