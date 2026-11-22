import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Bungkus route yang wajib login. Kalo `roles` diisi, cuma role itu yang boleh masuk.
 * Belum login -> ke /auth (abis login balik lagi ke halaman tadi).
 */
function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="wrap muted">⏳ Memuat…</div>;
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/home" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
