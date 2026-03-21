import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, ShoppingCart } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { getAddresses } from '../services/customerApi';
import LocationPickerModal from './LocationPickerModal';
import AddressManager from './AddressManager';

function Header() {
  const navigate = useNavigate();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated } = useCustomerStore();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserAddresses();
    } else {
      setSelectedAddress(null);
    }
  }, [isAuthenticated]);

  const loadUserAddresses = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await getAddresses();
      if (response.success && response.data && response.data.length > 0) {
        const defaultAddress = response.data.find(addr => addr.isDefault);
        if (defaultAddress && defaultAddress.addressName && defaultAddress.fullAddress) {
          const addressParts = defaultAddress.fullAddress.split(',');
          const neighborhood = addressParts.length > 1 ? addressParts[1]?.trim() : defaultAddress.fullAddress;
          setSelectedAddress({
            formatted_address: `${defaultAddress.addressName} - ${neighborhood}`
          });
        }
      }
    } catch (err) { }
  };

  const handleLocationSelect = (address) => {
    setSelectedAddress(address);
    setShowLocationModal(false);
  };

  const handleAddressSelect = (address) => {
    if (address) {
      let fullAddress = '';
      let addressName = '';
      if (typeof address === 'string') {
        fullAddress = address;
      } else if (address.addressName && address.fullAddress) {
        addressName = address.addressName;
        fullAddress = address.fullAddress;
      } else if (address.FullAddress) {
        fullAddress = address.FullAddress;
      }
      const addressParts = fullAddress.split(',');
      const neighborhood = addressParts.length > 1 ? addressParts[1]?.trim() : fullAddress;
      const displayText = addressName ? `${addressName} - ${neighborhood}` : neighborhood;
      setSelectedAddress({ formatted_address: displayText });
    }
    setShowAddressManager(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 overflow-visible ${isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-sm'
            : 'bg-white'
          }`}
      >
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between h-12 gap-4">

            {/* Sol: Konum Seçici */}
            <button
              onClick={() => isAuthenticated ? setShowAddressManager(true) : setShowLocationModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors max-w-[140px] sm:max-w-xs"
            >
              <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700 truncate">
                {selectedAddress?.formatted_address || 'Konum seçin'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
            </button>

            {/* Orta: Logo - Büyük ve taşan */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 z-50">
              <button
                onClick={() => navigate('/')}
                className="relative group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Logo container - taşan efekt */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 -mt-1 rounded-full bg-white shadow-xl shadow-purple-500/20 border-4 border-white overflow-hidden transform transition-transform duration-300 group-hover:scale-105">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
            </div>

            {/* Sağ: Sepet */}
            <button
              onClick={() => navigate('/cart')}
              className="relative flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Sepet</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Logo için ekstra boşluk */}
      <div className="h-6 sm:h-8" />

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationSelect}
      />

      <AddressManager
        isOpen={showAddressManager}
        onClose={() => setShowAddressManager(false)}
        onSelectAddress={handleAddressSelect}
      />
    </>
  );
}

export default Header;
