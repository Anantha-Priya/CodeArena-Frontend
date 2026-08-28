import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AdminRoute() {
  const { token, user } = useAuth();

  // ProtectedRoute already guarantees a token exists by the time this renders.
  // While the profile is still being fetched (token set, user not yet loaded),
  // hold off on redirecting so a real admin isn't briefly bounced away.
  const isCheckingProfile = token !== null && user === null;

  if (isCheckingProfile) {
    return <p>Checking access…</p>;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
