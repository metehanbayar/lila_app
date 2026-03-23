import { Home, Search, ShoppingBag, User2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import Footer from './Footer';
import Header from './Header';
import ScrollToTop from './ScrollToTop';
import AddToCartSuccessOverlay from './AddToCartSuccessOverlay';
import { cn } from './ui/primitives';

function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated } = useCustomerStore();
  const isCatalogMenu = /^\/menu\//.test(location.pathname);

  const showFooter = location.pathname === '/';
  const showBottomNav = !isCatalogMenu && !/^\/(cart|checkout|payment|order-success)/.test(location.pathname);

  const items = [
    { path: '/', label: 'Ana Sayfa', icon: Home },
    { path: '/search', label: 'Ara', icon: Search },
    { path: '/cart', label: 'Sepet', icon: ShoppingBag, badge: totalItems },
    { path: isAuthenticated ? '/profile' : '/login', label: isAuthenticated ? 'Hesabim' : 'Giris', icon: User2 },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 hidden gm-mesh opacity-90 md:block" />
      <ScrollToTop />
      <Header catalogMode={isCatalogMenu} />
      <AddToCartSuccessOverlay />

      <main className={cn('relative z-10 flex-1 animate-pageEnter', showBottomNav ? 'mobile-bottom-nav-offset lg:pb-0' : 'pb-8')}>
        {children}
      </main>

      {showFooter && <Footer />}

      {showBottomNav && (
        <nav className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
          <div className="mx-3 mb-2.5 rounded-[26px] border border-white/70 bg-white/92 p-1.5 shadow-card backdrop-blur-md safe-area-bottom sm:bg-white/88 sm:p-2 sm:shadow-premium sm:backdrop-blur-xl">
            <div className="grid grid-cols-4 gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={`${item.path}-${item.label}`}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[11px] font-semibold transition-all duration-200',
                      active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-dark-lighter',
                    )}
                  >
                    <div className={cn('relative flex h-10 w-10 items-center justify-center rounded-2xl', active ? 'bg-white/12' : 'bg-surface-muted')}>
                      <Icon className="h-4 w-4" />
                      {item.badge > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-lg">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}

export default AppLayout;
