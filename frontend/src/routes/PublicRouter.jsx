const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore();

  return isAuthenticated
    ? <Navigate to="/dashboard" />
    : <Outlet />;
};

export default PublicRoute;