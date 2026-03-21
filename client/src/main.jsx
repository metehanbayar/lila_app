import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import './utils/performance';

import AppLayout from './components/AppLayout';

import Home from './pages/Home';
import RestaurantMenu from './pages/RestaurantMenu';
import ViewMenu from './pages/ViewMenu';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import OrderSuccess from './pages/OrderSuccess';
import NotFound from './pages/NotFound';

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

import CustomerProtectedRoute from './components/customer/CustomerProtectedRoute';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import Profile from './pages/customer/Profile';
import OrderHistory from './pages/customer/OrderHistory';
import OrderDetail from './pages/customer/OrderDetail';
import Favorites from './pages/customer/Favorites';

const Users = lazy(() => import('./pages/admin/Users'));

const router = createBrowserRouter([
  { path: '/', element: <AppLayout><Home /></AppLayout> },
  { path: '/restaurant/:slug', element: <AppLayout><RestaurantMenu /></AppLayout> },
  { path: '/menu/:slug', element: <ViewMenu /> },
  { path: '/search', element: <AppLayout><Search /></AppLayout> },
  { path: '/cart', element: <AppLayout><Cart /></AppLayout> },
  { path: '/checkout', element: <AppLayout><Checkout /></AppLayout> },
  { path: '/payment/success', element: <AppLayout><PaymentSuccess /></AppLayout> },
  { path: '/payment/failure', element: <AppLayout><PaymentFailure /></AppLayout> },
  { path: '/order-success/:orderNumber', element: <AppLayout><OrderSuccess /></AppLayout> },

  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/profile', element: <CustomerProtectedRoute><AppLayout><Profile /></AppLayout></CustomerProtectedRoute> },
  { path: '/my-orders', element: <CustomerProtectedRoute><AppLayout><OrderHistory /></AppLayout></CustomerProtectedRoute> },
  { path: '/my-orders/:orderNumber', element: <CustomerProtectedRoute><AppLayout><OrderDetail /></AppLayout></CustomerProtectedRoute> },
  { path: '/favorites', element: <CustomerProtectedRoute><AppLayout><Favorites /></AppLayout></CustomerProtectedRoute> },

  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin/restaurants/:id/receipt-template', element: <ProtectedRoute><ReceiptTemplateEditor /></ProtectedRoute> },
  { path: '/admin/restaurants', element: <ProtectedRoute><Restaurants /></ProtectedRoute> },
  { path: '/admin/categories', element: <ProtectedRoute><Categories /></ProtectedRoute> },
  { path: '/admin/products', element: <ProtectedRoute><Products /></ProtectedRoute> },
  { path: '/admin/orders', element: <ProtectedRoute><Orders /></ProtectedRoute> },
  { path: '/admin/coupons', element: <ProtectedRoute><Coupons /></ProtectedRoute> },
  { path: '/admin/media', element: <ProtectedRoute><Media /></ProtectedRoute> },
  { path: '/admin/import', element: <ProtectedRoute><Import /></ProtectedRoute> },
  { path: '/admin/users', element: <ProtectedRoute><Suspense fallback={<Loading />}><Users /></Suspense></ProtectedRoute> },
  { path: '/admin', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },

  { path: '*', element: <AppLayout><NotFound /></AppLayout> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider
      router={router}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    />
  </React.StrictMode>,
);
