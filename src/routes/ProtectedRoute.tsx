import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { selectCurrentUser } from "../features/auth/authSlice";
import { ForbiddenPage } from "../pages/ForbiddenPage";
import type { Role } from "../types/auth";

interface ProtectedRouteProps {
  // Sans `allowedRoles`, tout utilisateur connecté passe.
  allowedRoles?: readonly Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();

  // Non authentifié -> /login (en mémorisant la page demandée).
  if (user === null) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authentifié mais rôle non autorisé -> écran "Accès refusé".
  if (allowedRoles !== undefined && !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}