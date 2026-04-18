import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

const HomeRedirect = () => {
  const { isAuthenticated } = useAuthStore();

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/login" replace />;
};

export default HomeRedirect;
