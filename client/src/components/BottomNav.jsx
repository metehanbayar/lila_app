import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, Package } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';

function BottomNav() {
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated } = useCustomerStore();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { id: 'home', path: '/', icon: Home, label: 'Ana Sayfa' },
    { id: 'cart', path: '/cart', icon: ShoppingCart, label: 'Sepet', badge: totalItems },
    { 
      id: 'orders',
      path: isAuthenticated ? '/my-orders' : '/login', 
      icon: Package, 
      label: 'Siparişler' 
    },
    { 
      id: 'profile',
      path: isAuthenticated ? '/profile' : '/login', 
      icon: User, 
      label: 'Profil' 
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 supports-[backdrop-filter]:backdrop-blur-2xl border-t border-white/30 z-50 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around px-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 transition-all ${
                active ? 'text-purple-600' : 'text-gray-700'
              }`}
            >
              <div className="relative">
                {/* İkon container */}
                <div className={`p-1.5 rounded-xl transition-all ${
                  active ? 'bg-gradient-to-br from-purple-50 to-pink-50' : 'hover:bg-gray-100'
                }`}>
                  <item.icon 
                    size={20} 
                    className="transition-all"
                    style={{
                      strokeWidth: active ? 2.5 : 2
                    }}
                  />
                </div>
                
                {/* Badge */}
                {item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-md border border-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-[10px] mt-0.5 font-semibold transition-all ${
                active ? 'scale-105' : ''
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
