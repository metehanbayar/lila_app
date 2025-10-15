import { Navigate } from 'react-router-dom';
import useCustomerStore from '../../store/customerStore';

function CustomerProtectedRoute({ children }) {
  const { isAuthenticated } = useCustomerStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default CustomerProtectedRoute;

