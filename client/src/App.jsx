import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import RestaurantMenu from './pages/RestaurantMenu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import NotFound from './pages/NotFound';
import Search from './pages/Search';

// Admin imports
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Restaurants from './pages/admin/Restaurants';
import Categories from './pages/admin/Categories';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Coupons from './pages/admin/Coupons';
import CouponsTest from './pages/admin/CouponsTest';
import Media from './pages/admin/Media';
import Import from './pages/admin/Import';
import ReceiptTemplateEditor from './pages/admin/ReceiptTemplateEditor';

// Customer imports
import CustomerProtectedRoute from './components/customer/CustomerProtectedRoute';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import Profile from './pages/customer/Profile';
import OrderHistory from './pages/customer/OrderHistory';
import OrderDetail from './pages/customer/OrderDetail';
import Favorites from './pages/customer/Favorites';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<AppLayout><Home /></AppLayout>} />
      <Route path="/restaurant/:slug" element={<AppLayout><RestaurantMenu /></AppLayout>} />
      <Route path="/search" element={<AppLayout><Search /></AppLayout>} />
      <Route path="/cart" element={<AppLayout><Cart /></AppLayout>} />
      <Route 
        path="/checkout" 
        element={
          <CustomerProtectedRoute>
            <AppLayout><Checkout /></AppLayout>
          </CustomerProtectedRoute>
        } 
      />
      <Route path="/order-success/:orderNumber" element={<AppLayout><OrderSuccess /></AppLayout>} />

      {/* Customer Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/profile"
        element={
          <CustomerProtectedRoute>
            <Profile />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/my-orders"
        element={
          <CustomerProtectedRoute>
            <OrderHistory />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/my-orders/:orderNumber"
        element={
          <CustomerProtectedRoute>
            <OrderDetail />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <CustomerProtectedRoute>
            <Favorites />
          </CustomerProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Nested routes ÖNCE gelmeli (daha spesifik) */}
      <Route
        path="/admin/restaurants/:id/receipt-template"
        element={
          <ProtectedRoute>
            <ReceiptTemplateEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/restaurants"
        element={
          <ProtectedRoute>
            <Restaurants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coupons-test"
        element={<CouponsTest />}
      />
      <Route
        path="/admin/coupons"
        element={
          <ProtectedRoute>
            <Coupons />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/media"
        element={
          <ProtectedRoute>
            <Media />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/import"
        element={
          <ProtectedRoute>
            <Import />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
    </Routes>
  );
}

export default App;

