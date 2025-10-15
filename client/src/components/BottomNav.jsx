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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom shadow-2xl">
      <div className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 transition-all ${
                active ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                {/* Aktif gösterge */}
                {active && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-600 rounded-full"></div>
                )}
                
                {/* İkon container */}
                <div className={`p-2 rounded-xl transition-all ${
                  active ? 'bg-purple-50 scale-110' : ''
                }`}>
                  <item.icon 
                    size={22} 
                    className={active ? 'stroke-[2.5]' : 'stroke-2'} 
                  />
                </div>
                
                {/* Badge */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-[10px] mt-0.5 font-medium transition-all ${
                active ? 'font-bold' : ''
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
