import { Navigate, useLocation } from 'react-router-dom';
import useCustomerStore from '../../store/customerStore';

function CustomerProtectedRoute({ children }) {
  const { isAuthenticated } = useCustomerStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Hangi sayfadan geldiğini ve mesajı URL'ye ekle
    const from = location.pathname;
    let message = '';

    if (from === '/favorites') {
      message = 'Favorilerinizi görmek için giriş yapın';
    } else if (from === '/profile') {
      message = 'Profilinizi görmek için giriş yapın';
    } else if (from.startsWith('/my-orders')) {
      message = 'Siparişlerinizi görmek için giriş yapın';
    }

    return <Navigate to={`/login?redirect=${from}&message=${encodeURIComponent(message)}`} replace />;
  }

  return children;
}

export default CustomerProtectedRoute;
