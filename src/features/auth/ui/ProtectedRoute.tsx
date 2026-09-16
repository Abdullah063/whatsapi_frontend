import { Navigate, Outlet, useLocation } from 'react-router';
import Spinner from 'src/views/spinner/Spinner';
import { useAuth } from '../model/auth-context';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
