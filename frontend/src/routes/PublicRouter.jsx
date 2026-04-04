import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore();

  return isAuthenticated
    ? <Navigate to="/dashboard" />
    : <Outlet />;
};

export default PublicRoute;