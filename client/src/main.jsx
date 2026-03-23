import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import './utils/performance';

import AppLayout from './components/AppLayout';
import Home from './pages/Home';

import ProtectedRoute from './components/admin/ProtectedRoute';
import Loading from './components/Loading';

import CustomerProtectedRoute from './components/customer/CustomerProtectedRoute';

const RestaurantMenu = lazy(() => import('./pages/RestaurantMenu'));
const Search = lazy(() => import('./pages/Search'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('./pages/PaymentFailure'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Restaurants = lazy(() => import('./pages/admin/Restaurants'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const Products = lazy(() => import('./pages/admin/Products'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Coupons = lazy(() => import('./pages/admin/Coupons'));
const Media = lazy(() => import('./pages/admin/Media'));
const Import = lazy(() => import('./pages/admin/Import'));
const ReceiptTemplateEditor = lazy(() => import('./pages/admin/ReceiptTemplateEditor'));
const Users = lazy(() => import('./pages/admin/Users'));
const Login = lazy(() => import('./pages/customer/Login'));
const Register = lazy(() => import('./pages/customer/Register'));
const Profile = lazy(() => import('./pages/customer/Profile'));
const OrderHistory = lazy(() => import('./pages/customer/OrderHistory'));
const OrderDetail = lazy(() => import('./pages/customer/OrderDetail'));
const Favorites = lazy(() => import('./pages/customer/Favorites'));

const withSuspense = (element) => <Suspense fallback={<Loading />}>{element}</Suspense>;

const router = createBrowserRouter([
  { path: '/', element: <AppLayout><Home /></AppLayout> },
  { path: '/restaurant/:slug', element: <AppLayout>{withSuspense(<RestaurantMenu />)}</AppLayout> },
  { path: '/menu/:slug', element: <AppLayout>{withSuspense(<RestaurantMenu viewOnly />)}</AppLayout> },
  { path: '/search', element: <AppLayout>{withSuspense(<Search />)}</AppLayout> },
  { path: '/cart', element: <AppLayout>{withSuspense(<Cart />)}</AppLayout> },
  { path: '/checkout', element: <CustomerProtectedRoute><AppLayout>{withSuspense(<Checkout />)}</AppLayout></CustomerProtectedRoute> },
  { path: '/payment/success', element: <AppLayout>{withSuspense(<PaymentSuccess />)}</AppLayout> },
  { path: '/payment/failure', element: <AppLayout>{withSuspense(<PaymentFailure />)}</AppLayout> },
  { path: '/order-success/:orderNumber', element: <AppLayout>{withSuspense(<OrderSuccess />)}</AppLayout> },

  { path: '/login', element: withSuspense(<Login />) },
  { path: '/register', element: withSuspense(<Register />) },
  { path: '/profile', element: <CustomerProtectedRoute><AppLayout>{withSuspense(<Profile />)}</AppLayout></CustomerProtectedRoute> },
  { path: '/my-orders', element: <CustomerProtectedRoute><AppLayout>{withSuspense(<OrderHistory />)}</AppLayout></CustomerProtectedRoute> },
  { path: '/my-orders/:orderNumber', element: <CustomerProtectedRoute><AppLayout>{withSuspense(<OrderDetail />)}</AppLayout></CustomerProtectedRoute> },
  { path: '/favorites', element: <CustomerProtectedRoute><AppLayout>{withSuspense(<Favorites />)}</AppLayout></CustomerProtectedRoute> },

  { path: '/admin/login', element: withSuspense(<AdminLogin />) },
  { path: '/admin/restaurants/:id/receipt-template', element: <ProtectedRoute>{withSuspense(<ReceiptTemplateEditor />)}</ProtectedRoute> },
  { path: '/admin/restaurants', element: <ProtectedRoute>{withSuspense(<Restaurants />)}</ProtectedRoute> },
  { path: '/admin/categories', element: <ProtectedRoute>{withSuspense(<Categories />)}</ProtectedRoute> },
  { path: '/admin/products', element: <ProtectedRoute>{withSuspense(<Products />)}</ProtectedRoute> },
  { path: '/admin/orders', element: <ProtectedRoute>{withSuspense(<Orders />)}</ProtectedRoute> },
  { path: '/admin/coupons', element: <ProtectedRoute>{withSuspense(<Coupons />)}</ProtectedRoute> },
  { path: '/admin/media', element: <ProtectedRoute>{withSuspense(<Media />)}</ProtectedRoute> },
  { path: '/admin/import', element: <ProtectedRoute>{withSuspense(<Import />)}</ProtectedRoute> },
  { path: '/admin/users', element: <ProtectedRoute>{withSuspense(<Users />)}</ProtectedRoute> },
  { path: '/admin', element: <ProtectedRoute>{withSuspense(<Dashboard />)}</ProtectedRoute> },

  { path: '*', element: <AppLayout>{withSuspense(<NotFound />)}</AppLayout> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider
      router={router}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    />
  </React.StrictMode>,
);
