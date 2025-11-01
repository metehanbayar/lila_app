import React, { useState, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import './utils/performance'; // Performance utilities'i yükle

// Layouts
import AppLayout from './components/AppLayout';
import SplashScreen from './components/SplashScreen';

// Public pages
import Home from './pages/Home';
import RestaurantMenu from './pages/RestaurantMenu';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import OrderSuccess from './pages/OrderSuccess';
import NotFound from './pages/NotFound';

// Admin
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Restaurants from './pages/admin/Restaurants';
import Categories from './pages/admin/Categories';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Coupons from './pages/admin/Coupons';
import Media from './pages/admin/Media';
import Import from './pages/admin/Import';
import ReceiptTemplateEditor from './pages/admin/ReceiptTemplateEditor';
import Loading from './components/Loading';

const Users = lazy(() => import('./pages/admin/Users'));

// Customer
import CustomerProtectedRoute from './components/customer/CustomerProtectedRoute';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import Profile from './pages/customer/Profile';
import OrderHistory from './pages/customer/OrderHistory';
import OrderDetail from './pages/customer/OrderDetail';
import Favorites from './pages/customer/Favorites';

const router = createBrowserRouter([
  // Public
  { path: '/', element: <AppLayout><Home /></AppLayout> },
  { path: '/restaurant/:slug', element: <AppLayout><RestaurantMenu /></AppLayout> },
  { path: '/search', element: <AppLayout><Search /></AppLayout> },
  { path: '/cart', element: <AppLayout><Cart /></AppLayout> },
  { path: '/checkout', element: <AppLayout><Checkout /></AppLayout> },
  { path: '/payment/success', element: <AppLayout><PaymentSuccess /></AppLayout> },
  { path: '/payment/failure', element: <AppLayout><PaymentFailure /></AppLayout> },
  { path: '/order-success/:orderNumber', element: <AppLayout><OrderSuccess /></AppLayout> },

  // Customer
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/profile', element: <CustomerProtectedRoute><Profile /></CustomerProtectedRoute> },
  { path: '/my-orders', element: <CustomerProtectedRoute><OrderHistory /></CustomerProtectedRoute> },
  { path: '/my-orders/:orderNumber', element: <CustomerProtectedRoute><OrderDetail /></CustomerProtectedRoute> },
  { path: '/favorites', element: <CustomerProtectedRoute><Favorites /></CustomerProtectedRoute> },

  // Admin
  { path: '/admin/login', element: <AdminLogin /> },
  // Spesifik route'lar önce (daha uzun path'ler)
  { path: '/admin/restaurants/:id/receipt-template', element: <ProtectedRoute><ReceiptTemplateEditor /></ProtectedRoute> },
  { path: '/admin/restaurants', element: <ProtectedRoute><Restaurants /></ProtectedRoute> },
  { path: '/admin/categories', element: <ProtectedRoute><Categories /></ProtectedRoute> },
  { path: '/admin/products', element: <ProtectedRoute><Products /></ProtectedRoute> },
  { path: '/admin/orders', element: <ProtectedRoute><Orders /></ProtectedRoute> },
  { path: '/admin/coupons', element: <ProtectedRoute><Coupons /></ProtectedRoute> },
  { path: '/admin/media', element: <ProtectedRoute><Media /></ProtectedRoute> },
  { path: '/admin/import', element: <ProtectedRoute><Import /></ProtectedRoute> },
  { path: '/admin/users', element: <ProtectedRoute><Suspense fallback={<Loading />}><Users /></Suspense></ProtectedRoute> },
  // Genel /admin route'u en son
  { path: '/admin', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },

  // 404
  { path: '*', element: <AppLayout><NotFound /></AppLayout> },
]);

function App() {
  // localStorage'dan daha önce splash ekranı gösterilip gösterilmediğini kontrol et
  const [showSplash, setShowSplash] = useState(() => {
    const lastSplashTime = localStorage.getItem('lastSplashTime');
    
    if (!lastSplashTime) {
      return true; // Hiç görülmemişse göster
    }
    
    // Son splash zamannından bu yana ne kadar süre geçti?
    const lastTime = parseInt(lastSplashTime);
    const now = Date.now();
    const hoursPassed = (now - lastTime) / (1000 * 60 * 60); // Saat cinsinden
    
    // Eğer 24 saat geçtiyse tekrar göster
    return hoursPassed >= 4;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    // localStorage'a şimdiki zamanı kaydet
    localStorage.setItem('lastSplashTime', Date.now().toString());
  };

  return (
    <React.StrictMode>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && (
        <RouterProvider
          router={router}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        />
      )}
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

