import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { useAuthorization } from "@/hooks/useAuthorization";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requirePermissions?: Array<{ action: string; subject: string }>;
  requireAny?: boolean;
  allowRoles?: string[];
}

export function ProtectedRoute({
  children,
  requirePermissions,
  requireAny = true,
  allowRoles,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { token, user } = useAppSelector((state) => state.auth);
  const { can, isLoading: isAuthzLoading } = useAuthorization();

  const isAuthed = Boolean(token || user);
  const roleName = user?.role;
  const roleAllowed = Boolean(allowRoles?.length && roleName && allowRoles.includes(roleName));

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requirePermissions?.length) {
    if (roleAllowed) return children;
    if (isAuthzLoading) return null;
    const allowed = requireAny
      ? requirePermissions.some((perm) => can(perm.action, perm.subject))
      : requirePermissions.every((perm) => can(perm.action, perm.subject));
    if (!allowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
