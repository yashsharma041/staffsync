import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Loading } from "./ui";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, token, loading } = useSelector((s) => s.auth);
  const location = useLocation();

  if (loading) return <Loading />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
