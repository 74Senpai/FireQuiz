import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import { useAuthStore } from "./stores/authStore";

export default function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUser().catch(() => {
        useAuthStore.setState({ isLoading: false });
      });
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

