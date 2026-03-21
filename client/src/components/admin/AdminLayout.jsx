import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Download,
  FolderTree,
  Gift,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-react';
import useAdminStore from '../../store/adminStore';
import ScrollToTop from '../ScrollToTop';
import { Badge, cn } from '../ui/primitives';

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/restaurants', icon: Store, label: 'Restoranlar' },
  { path: '/admin/categories', icon: FolderTree, label: 'Kategoriler' },
  { path: '/admin/products', icon: Package, label: 'Urunler' },
  { path: '/admin/orders', icon: ShoppingBag, label: 'Siparisler' },
  { path: '/admin/coupons', icon: Gift, label: 'Kampanyalar' },
  { path: '/admin/media', icon: Image, label: 'Medya' },
  { path: '/admin/import', icon: Download, label: 'Ice aktarma' },
  { path: '/admin/users', icon: Users, label: 'Kullanicilar' },
];

function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => (path === '/admin' ? location.pathname === path : location.pathname.startsWith(path));
  const currentItem = menuItems.find((item) => isActive(item.path)) || menuItems[0];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdfc_0%,#f7efea_100%)]">
      <ScrollToTop />
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[308px] shrink-0 border-r border-white/60 bg-dark text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 p-6">
            <button onClick={() => navigate('/admin')} className="flex items-center gap-4 text-left">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-white/10">
                <img src="/logo.png" alt="Globalmenu" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">Globalmenu</p>
                <h1 className="font-display text-3xl leading-none text-white">Admin</h1>
              </div>
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <Badge className="border border-white/10 bg-white/10 text-white">Yetkili panel</Badge>
              <p className="mt-4 text-sm leading-7 text-white/72">Mobil drawer, desktop kalici sidebar ve ayni marka ailesi ile yeniden kuruldu.</p>
            </div>

            <nav className="grid gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold transition-all duration-200',
                      active ? 'bg-white text-dark shadow-lg shadow-black/10' : 'text-white/68 hover:bg-white/8 hover:text-white',
                    )}
                  >
                    <span className={cn('flex h-11 w-11 items-center justify-center rounded-[18px]', active ? 'bg-primary text-white' : 'bg-white/8')}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Oturum</p>
              <p className="mt-2 text-base font-bold text-white">{admin?.fullName}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-white/8 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/12"
                >
                  Siteyi gor
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-dark transition-all hover:-translate-y-0.5"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-dark/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
            <aside
              className="h-full w-[88vw] max-w-[340px] border-r border-white/10 bg-dark text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">Globalmenu</p>
                  <h2 className="font-display text-3xl leading-none">Admin</h2>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="rounded-2xl bg-white/8 p-3 text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="grid gap-2 p-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold transition-all duration-200',
                        active ? 'bg-white text-dark shadow-lg shadow-black/10' : 'text-white/68 hover:bg-white/8 hover:text-white',
                      )}
                    >
                      <span className={cn('flex h-11 w-11 items-center justify-center rounded-[18px]', active ? 'bg-primary text-white' : 'bg-white/8')}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/60 bg-white/84 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="rounded-2xl bg-white p-3 text-dark shadow-card lg:hidden">
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Admin panel</p>
                  <h2 className="truncate text-2xl font-bold text-dark sm:text-3xl">{currentItem.label}</h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-lighter">Aktif oturum</p>
                  <p className="text-sm font-bold text-dark">{admin?.fullName}</p>
                </div>
                <button onClick={handleLogout} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-dark shadow-card">
                  Cikis
                </button>
              </div>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
