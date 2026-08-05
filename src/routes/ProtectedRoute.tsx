import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken } from "@/api/axios";

export function ProtectedRoute() {
  const location = useLocation();
  return getAccessToken() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}
