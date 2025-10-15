import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

// Layouts
import AppLayout from './components/AppLayout';

// Public pages
import Home from './pages/Home';
import RestaurantMenu from './pages/RestaurantMenu';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
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
  { path: '/admin', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: '/admin/restaurants/:id/receipt-template', element: <ProtectedRoute><ReceiptTemplateEditor /></ProtectedRoute> },
  { path: '/admin/restaurants', element: <ProtectedRoute><Restaurants /></ProtectedRoute> },
  { path: '/admin/categories', element: <ProtectedRoute><Categories /></ProtectedRoute> },
  { path: '/admin/products', element: <ProtectedRoute><Products /></ProtectedRoute> },
  { path: '/admin/orders', element: <ProtectedRoute><Orders /></ProtectedRoute> },
  { path: '/admin/coupons', element: <ProtectedRoute><Coupons /></ProtectedRoute> },
  { path: '/admin/media', element: <ProtectedRoute><Media /></ProtectedRoute> },
  { path: '/admin/import', element: <ProtectedRoute><Import /></ProtectedRoute> },

  // 404
  { path: '*', element: <AppLayout><NotFound /></AppLayout> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider
      router={router}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    />
  </React.StrictMode>
);

