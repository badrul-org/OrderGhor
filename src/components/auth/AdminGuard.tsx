import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminGuard() {
  const { isAdmin } = useAuthStore();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
