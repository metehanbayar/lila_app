import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, User, Search, MapPin, ChevronRight } from 'lucide-react';
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
  const [userAddresses, setUserAddresses] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserAddresses();
    } else {
      // Giriş yapılmamışsa adresi temizle
      setSelectedAddress(null);
      setUserAddresses([]);
    }
  }, [isAuthenticated]);

  const loadUserAddresses = async () => {
    // Ekstra güvenlik kontrolü
    if (!isAuthenticated) {
      return;
    }
    
    try {
      const response = await getAddresses();
      if (response.success && response.data && response.data.length > 0) {
        setUserAddresses(response.data);
        const defaultAddress = response.data.find(addr => addr.isDefault);
        if (defaultAddress && defaultAddress.addressName && defaultAddress.fullAddress) {
          const addressParts = defaultAddress.fullAddress.split(',');
          const neighborhood = addressParts.length > 1 ? addressParts[1]?.trim() : defaultAddress.fullAddress;
          
          setSelectedAddress({
            formatted_address: `${defaultAddress.addressName} - ${neighborhood}`
          });
        }
      }
    } catch (err) {
      console.error('Adresler yüklenemedi:', err);
    }
  };

  const handleLocationSelect = (address) => {
    setSelectedAddress(address);
    setShowLocationModal(false);
  };

  const handleAddressSelect = (address) => {
    if (address) {
      let addressName = '';
      let fullAddress = '';
      
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
      
      setSelectedAddress({
        formatted_address: displayText
      });
    }
    setShowAddressManager(false);
  };

  console.log('Header render - selectedAddress:', selectedAddress);
  console.log('Header render - isAuthenticated:', isAuthenticated);

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Lila Group" 
                className="w-10 h-10 object-contain"
              />
            </Link>

            {/* Adres Seçici - Ortada */}
            <button
              onClick={() => {
                console.log('Adres butonu tıklandı');
                if (isAuthenticated) {
                  setShowAddressManager(true);
                } else {
                  setShowLocationModal(true);
                }
              }}
              className="flex items-center gap-2 flex-1 max-w-xs group bg-yellow-100 border-2 border-red-500"
              style={{ minHeight: '50px' }}
            >
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-[10px] text-gray-500 font-medium">Teslimat</div>
                <div className="font-semibold text-gray-900 text-xs truncate flex items-center gap-1">
                  {selectedAddress?.formatted_address || (isAuthenticated ? 'Adres seçin' : 'Konum seçin')}
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
              </div>
            </button>

            {/* Navigation */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                aria-label="Ana Sayfa"
              >
                <Home className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => navigate('/search')}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                aria-label="Ürün Ara"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                aria-label={isAuthenticated ? "Profil" : "Giriş Yap"}
              >
                <User className={`w-5 h-5 ${isAuthenticated ? 'text-primary' : 'text-gray-600'}`} />
              </button>

              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                aria-label="Sepet"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Konum Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationSelect}
      />

      {/* Adres Yöneticisi Modal */}
      <AddressManager
        isOpen={showAddressManager}
        onClose={() => setShowAddressManager(false)}
        onSelectAddress={handleAddressSelect}
      />
    </>
  );
}

export default Header;

