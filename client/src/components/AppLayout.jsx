import Header from './Header';
import ScrollToTop from './ScrollToTop';
import { Home, ShoppingCart, User, Search, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';

function AppLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const totalItems = useCartStore((state) => state.getTotalItems());
    const { isAuthenticated } = useCustomerStore();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 via-white to-gray-50">
            <ScrollToTop />
            <Header />

            <main className="flex-grow animate-pageEnter pb-20 lg:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
                {/* Glass background */}
                <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" />

                {/* Safe area padding */}
                <div className="relative px-4 safe-area-bottom">
                    <div className="flex items-center justify-between h-16 max-w-md mx-auto">
                        <BottomNavButton
                            onClick={() => navigate('/')}
                            isActive={isActive('/')}
                            icon={<Home className="w-5 h-5" />}
                            label="Ana Sayfa"
                        />

                        <BottomNavButton
                            onClick={() => navigate('/search')}
                            isActive={isActive('/search')}
                            icon={<Search className="w-5 h-5" />}
                            label="Ara"
                        />

                        {/* Center Cart Button */}
                        <div className="relative -mt-5">
                            <button
                                onClick={() => navigate('/cart')}
                                className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isActive('/cart')
                                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-xl shadow-purple-500/40 scale-105'
                                    : 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 hover:scale-105'
                                    }`}
                            >
                                <ShoppingCart className="w-5 h-5 text-white" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/40 animate-scaleIn border-2 border-white">
                                        {totalItems > 9 ? '9+' : totalItems}
                                    </span>
                                )}
                            </button>
                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-500 whitespace-nowrap">
                                Sepet
                            </span>
                        </div>

                        <BottomNavButton
                            onClick={() => navigate('/favorites')}
                            isActive={isActive('/favorites')}
                            icon={<Heart className="w-5 h-5" />}
                            label="Favoriler"
                        />

                        <BottomNavButton
                            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
                            isActive={isActive('/profile') || isActive('/login')}
                            icon={<User className="w-5 h-5" />}
                            label={isAuthenticated ? 'Profil' : 'Giriş'}
                        />
                    </div>
                </div>
            </nav>
        </div>
    );
}

function BottomNavButton({ onClick, isActive, icon, label }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-all duration-300"
        >
            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-400 hover:text-gray-600'
                }`}>
                {icon}
            </div>
            <span className={`text-[10px] font-medium mt-0.5 transition-colors ${isActive ? 'text-purple-600' : 'text-gray-400'
                }`}>
                {label}
            </span>
        </button>
    );
}

export default AppLayout;
