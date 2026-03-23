import { Navigate, useLocation } from 'react-router-dom';
import useCustomerStore from '../../store/customerStore';

function getRedirectMessage(from) {
  if (from === '/favorites') {
    return 'Favorilerinizi gormek icin giris yapin';
  }

  if (from === '/profile') {
    return 'Profilinizi gormek icin giris yapin';
  }

  if (from.startsWith('/my-orders')) {
    return 'Siparislerinizi gormek icin giris yapin';
  }

  if (from.startsWith('/checkout')) {
    return 'Checkout icin once giris yapin';
  }

  return '';
}

function CustomerProtectedRoute({ children }) {
  const { isAuthenticated } = useCustomerStore();
  const location = useLocation();

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    const message = getRedirectMessage(from);
    const params = new URLSearchParams();

    params.set('redirect', from);
    if (message) {
      params.set('message', message);
    }

    return <Navigate to={`/login?${params.toString()}`} replace state={{ from, message }} />;
  }

  return children;
}

export default CustomerProtectedRoute;
