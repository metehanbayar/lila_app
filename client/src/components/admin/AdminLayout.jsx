import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAdminStore from '../../store/adminStore';
import {
  LayoutDashboard,
  Store,
  FolderTree,
  Package,
  ShoppingBag,
  Image,
  Download,
  LogOut,
  Menu,
  X,
  Gift,
} from 'lucide-react';
import { useState } from 'react';

function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/restaurants', icon: Store, label: 'Restoranlar' },
    { path: '/admin/categories', icon: FolderTree, label: 'Kategoriler' },
    { path: '/admin/products', icon: Package, label: 'Ürünler' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Siparişler' },
    { path: '/admin/coupons', icon: Gift, label: 'Kampanyalar' },
    { path: '/admin/media', icon: Image, label: 'Görsel Kütüphanesi' },
    { path: '/admin/import', icon: Download, label: 'İçe Aktarma' },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-dark text-white">
        <div className="p-4 lg:p-6 border-b border-dark-light flex justify-center">
          <img 
            src="/logo.png" 
            alt="Lila Group" 
            className="w-10 h-10 object-contain"
          />
        </div>

        <nav className="flex-1 p-2 lg:p-4 space-y-1 lg:space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-dark-light'
              }`}
            >
              <item.icon size={18} className="lg:w-5 lg:h-5 flex-shrink-0" />
              <span className="text-sm lg:text-base truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-2 lg:p-4 border-t border-dark-light">
          <div className="mb-2 lg:mb-3 px-3 lg:px-4">
            <p className="text-xs text-gray-400">Hoşgeldin,</p>
            <p className="text-sm lg:text-base font-medium truncate">{admin?.fullName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 lg:gap-3 w-full px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base text-gray-300 hover:bg-dark-light rounded-lg transition-colors"
          >
            <LogOut size={18} className="lg:w-5 lg:h-5 flex-shrink-0" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" 
          onClick={() => setSidebarOpen(false)}
        >
          <aside 
            className="w-64 sm:w-80 bg-dark text-white h-full flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-dark-light flex justify-between items-center">
              <img 
                src="/logo.png" 
                alt="Lila Group" 
                className="w-10 h-10 object-contain"
              />
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="text-gray-400 hover:text-white p-2 -mr-2"
                aria-label="Menüyü Kapat"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-dark-light active:bg-dark-lighter'
                  }`}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  <span className="text-base">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-3 border-t border-dark-light">
              <div className="mb-3 px-4">
                <p className="text-xs text-gray-400">Hoşgeldin,</p>
                <p className="text-sm font-medium">{admin?.fullName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-dark-light active:bg-dark-lighter rounded-lg transition-colors"
              >
                <LogOut size={20} className="flex-shrink-0" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Mobile Friendly */}
        <header className="bg-white shadow-sm px-3 sm:px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 -ml-2 active:bg-gray-100 rounded-lg"
              aria-label="Menüyü Aç"
            >
              <Menu size={24} />
            </button>
            <span className="lg:hidden text-sm font-medium text-gray-900 truncate max-w-[150px]">
              {admin?.fullName}
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              target="_blank"
              className="text-xs sm:text-sm text-gray-600 hover:text-primary whitespace-nowrap"
            >
              Siteyi Görüntüle
            </Link>
            <button
              onClick={handleLogout}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 active:bg-gray-100 rounded-lg"
              aria-label="Çıkış Yap"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content - Mobile Friendly */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

