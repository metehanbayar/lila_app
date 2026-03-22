import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, ShoppingBag, User2 } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { getAddresses } from '../services/customerApi';
import { getRestaurantBySlug } from '../services/api';
import { Badge, Button, cn } from './ui/primitives';

const AddressManager = lazy(() => import('./AddressManager'));
const LocationPickerModal = lazy(() => import('./LocationPickerModal'));

const desktopLinks = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/search', label: 'Ara' },
];

function Header({ catalogMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const restaurantMatch = matchPath('/restaurant/:slug', location.pathname) || matchPath('/menu/:slug', location.pathname);
  const activeRestaurantSlug = restaurantMatch?.params?.slug || null;
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated } = useCustomerStore();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [activeRestaurantName, setActiveRestaurantName] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const headerElement = headerRef.current;
    if (!headerElement) {
      return undefined;
    }

    const updateHeaderHeight = () => {
      const height = Math.ceil(headerElement.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--gm-header-height', `${height}px`);
    };

    updateHeaderHeight();

    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(headerElement);
    window.addEventListener('resize', updateHeaderHeight, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [activeRestaurantName, isAuthenticated, selectedAddress?.formatted_address]);

  useEffect(() => {
    let isCancelled = false;

    if (!activeRestaurantSlug) {
      setActiveRestaurantName('');
      return undefined;
    }

    const loadRestaurantName = async () => {
      try {
        const response = await getRestaurantBySlug(activeRestaurantSlug);

        if (!isCancelled) {
          setActiveRestaurantName(response.success ? response.data?.Name || '' : '');
        }
      } catch {
        if (!isCancelled) {
          setActiveRestaurantName('');
        }
      }
    };

    loadRestaurantName();

    return () => {
      isCancelled = true;
    };
  }, [activeRestaurantSlug]);

  useEffect(() => {
    if (catalogMode || !isAuthenticated) {
      setSelectedAddress(null);
      return;
    }

    const loadUserAddresses = async () => {
      try {
        const response = await getAddresses();
        if (response.success && response.data?.length) {
          const defaultAddress = response.data.find((item) => item.isDefault || item.IsDefault);
          if (defaultAddress?.addressName && defaultAddress?.fullAddress) {
            const addressParts = defaultAddress.fullAddress.split(',');
            const neighborhood = addressParts.length > 1 ? addressParts[1]?.trim() : defaultAddress.fullAddress;
            setSelectedAddress({
              formatted_address: `${defaultAddress.addressName} - ${neighborhood}`,
            });
          } else if (defaultAddress?.AddressName && defaultAddress?.FullAddress) {
            const addressParts = defaultAddress.FullAddress.split(',');
            const neighborhood = addressParts.length > 1 ? addressParts[1]?.trim() : defaultAddress.FullAddress;
            setSelectedAddress({
              formatted_address: `${defaultAddress.AddressName} - ${neighborhood}`,
            });
          }
        }
      } catch {
        setSelectedAddress(null);
      }
    };

    loadUserAddresses();
  }, [catalogMode, isAuthenticated]);

  const handleLocationSelect = (address) => {
    setSelectedAddress(typeof address === 'string' ? { formatted_address: address } : address);
    setShowLocationModal(false);
  };

  const handleAddressSelect = (address) => {
    if (address) {
      const addressName = address.addressName || address.AddressName || '';
      const fullAddress = address.fullAddress || address.FullAddress || address;
      const addressParts = fullAddress.split(',');
      const neighborhood = addressParts.length > 1 ? addressParts[1]?.trim() : fullAddress;
      setSelectedAddress({
        formatted_address: addressName ? `${addressName} - ${neighborhood}` : neighborhood,
      });
    }

    setShowAddressManager(false);
  };

  const openLocation = () => {
    if (isAuthenticated) {
      setShowAddressManager(true);
      return;
    }

    setShowLocationModal(true);
  };

  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-40">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-2 sm:px-6 sm:pt-2.5 lg:px-8">
          <div
            className={cn(
              'rounded-[28px] border border-white/70 bg-white/90 px-3 py-2.5 shadow-card backdrop-blur-md transition-all duration-300 sm:bg-white/82 sm:px-4 sm:py-2.5 sm:backdrop-blur-xl',
              isScrolled && 'shadow-card sm:shadow-premium',
            )}
          >
            <div className="flex items-center justify-between gap-2.5">
              <button onClick={() => navigate('/')} className="flex min-w-0 items-center gap-2.5 text-left">
                <div className="relative">
                  <div className="absolute inset-0 hidden rounded-[26px] bg-primary/20 blur-xl sm:block" />
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-lg shadow-primary/10">
                    <img src="/logo.png" alt="Globalmenu" className="h-full w-full object-cover" />
                  </div>
                </div>
                {activeRestaurantName && (
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-black tracking-tight text-dark sm:text-lg">{activeRestaurantName}</h1>
                  </div>
                )}
              </button>

              {!catalogMode && (
                <>
                  <nav className="hidden items-center gap-2 lg:flex">
                    {desktopLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                          isActive(link.to)
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-dark-lighter hover:bg-surface-muted hover:text-dark',
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={openLocation}
                      className="hidden max-w-[280px] items-center gap-2 rounded-full border border-surface-border bg-surface-muted px-4 py-3 text-left text-sm font-medium text-dark transition-all duration-200 hover:border-primary/20 hover:bg-white lg:flex"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{selectedAddress?.formatted_address || 'Teslimat konumu secin'}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-dark-lighter" />
                    </button>

                    <button
                      onClick={() => navigate('/cart')}
                      data-cart-target="header"
                      className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-dark transition-all duration-200 hover:bg-white hover:shadow-card"
                      aria-label="Sepete git"
                    >
                      <ShoppingBag data-cart-icon="true" className="h-5 w-5" />
                      {totalItems > 0 && (
                        <span data-cart-badge="true" className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-lg">
                          {totalItems > 9 ? '9+' : totalItems}
                        </span>
                      )}
                    </button>

                    <Button
                      variant="secondary"
                      className="hidden px-4 py-3 lg:inline-flex"
                      onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
                    >
                      <User2 className="h-4 w-4" />
                      {isAuthenticated ? 'Hesabim' : 'Giris'}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {!catalogMode && (
              <button
                onClick={openLocation}
                className="mt-2 flex w-full items-center gap-2 rounded-[20px] border border-surface-border bg-surface-muted px-4 py-2.5 text-left text-sm font-medium text-dark transition-all duration-200 hover:border-primary/20 hover:bg-white lg:hidden"
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 truncate">{selectedAddress?.formatted_address || 'Teslimat konumu secin'}</span>
                <Badge tone="primary" className="hidden sm:inline-flex">
                  Lokasyon
                </Badge>
                <ChevronDown className="h-4 w-4 shrink-0 text-dark-lighter" />
              </button>
            )}
          </div>
        </div>
      </header>

      {!catalogMode && (
        <>
          {showLocationModal && (
            <Suspense fallback={null}>
              <LocationPickerModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onConfirm={handleLocationSelect}
              />
            </Suspense>
          )}

          {showAddressManager && (
            <Suspense fallback={null}>
              <AddressManager
                isOpen={showAddressManager}
                onClose={() => setShowAddressManager(false)}
                onSelectAddress={handleAddressSelect}
              />
            </Suspense>
          )}
        </>
      )}
    </>
  );
}

export default Header;
