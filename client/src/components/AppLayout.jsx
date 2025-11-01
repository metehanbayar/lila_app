import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import LocationPickerModal from './LocationPickerModal';
import AddressManager from './AddressManager';
import ScrollToTop from './ScrollToTop';
import { ArrowLeft, MapPin, ChevronRight } from 'lucide-react';
import useCustomerStore from '../store/customerStore';
import { getAddresses } from '../services/customerApi';

function AppLayout({ children, showBottomNav = true, showBackButton = false, title = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const { isAuthenticated } = useCustomerStore();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserAddresses();
    } else {
      // Giriş yapılmamışsa adresi temizle
      setSelectedAddress(null);
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

  return (
    <div className={`min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50 flex flex-col ${!showBottomNav ? 'h-screen' : ''}`}>
      <ScrollToTop />
      {/* Unified Header - Sabit Layout */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/30 sticky top-0 z-40 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Sol Bölüm - Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Lila Group" 
              className="w-10 h-10 object-contain"
            />
          </Link>

          <div className="flex-1"></div>

          {/* Sağ Bölüm - Adres Seçici */}
          <button
            onClick={() => {
              if (isAuthenticated) {
                setShowAddressManager(true);
              } else {
                setShowLocationModal(true);
              }
            }}
            className="flex items-center gap-2 group flex-shrink-0"
          >
            <div className="p-1.5 bg-purple-50 rounded-lg flex-shrink-0">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-left min-w-0 max-w-[160px]">
              <div className="text-[10px] text-gray-500 font-medium">Teslimat</div>
              <div className="font-semibold text-gray-900 text-xs truncate flex items-center gap-1">
                <span className="truncate">
                  {selectedAddress?.formatted_address || (isAuthenticated ? 'Adres seçin' : 'Konum seçin')}
                </span>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 pb-16 lg:pb-0 ${!showBottomNav ? 'overflow-hidden' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation - Mobil için */}
      {showBottomNav && <BottomNav />}

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
    </div>
  );
}

export default AppLayout;
