import { Navigate } from 'react-router-dom';
import useAdminStore from '../../store/adminStore';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminStore();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

