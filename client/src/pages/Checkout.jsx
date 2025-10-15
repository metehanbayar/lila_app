import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, FileText, Loader2, Tag, X, Navigation, BookOpen } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { createOrder, validateCoupon } from '../services/api';
import EmptyState from '../components/EmptyState';
import { ShoppingCart } from 'lucide-react';
import LocationPickerModal from '../components/LocationPickerModal';
import AddressManager from '../components/AddressManager';

function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalAmount, clearCart } = useCartStore();
  const { customer, isAuthenticated } = useCustomerStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Kupon durumu
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Konum durumu
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
  });

  // Kayıtlı kullanıcı bilgilerini otomatik doldur
  useEffect(() => {
    if (isAuthenticated && customer) {
      setFormData({
        customerName: customer.fullName || '',
        customerPhone: customer.phone || '',
        customerAddress: customer.address || '',
        notes: '',
      });
    }
  }, [isAuthenticated, customer]);

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Ad Soyad gereklidir';
    }

    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Telefon numarası gereklidir';
    } else if (!/^[0-9]{10,11}$/.test(formData.customerPhone.replace(/\s/g, ''))) {
      errors.customerPhone = 'Geçerli bir telefon numarası girin';
    }

    if (!formData.customerAddress.trim()) {
      errors.customerAddress = 'Adres gereklidir';
    } else if (formData.customerAddress.trim().length < 10) {
      errors.customerAddress = 'Lütfen detaylı adres girin';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const subtotal = getTotalAmount();
      const response = await validateCoupon(couponCode.trim(), subtotal);
      
      if (response.success) {
        setAppliedCoupon(response.data);
        setCouponError('');
      }
    } catch (err) {
      console.error('Kupon hatası:', err);
      setCouponError(err.response?.data?.message || 'Kupon doğrulanamadı');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleLocationConfirm = (address) => {
    setFormData((prev) => ({ ...prev, customerAddress: address }));
    
    // Hata varsa temizle
    if (formErrors.customerAddress) {
      setFormErrors((prev) => ({ ...prev, customerAddress: '' }));
    }
  };

  const handleAddressSelect = (address) => {
    setFormData((prev) => ({ ...prev, customerAddress: address }));
    
    // Hata varsa temizle
    if (formErrors.customerAddress) {
      setFormErrors((prev) => ({ ...prev, customerAddress: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Bu sayfaya sadece giriş yapmış kullanıcılar ulaşabilir
      if (!isAuthenticated || !customer) {
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }

      const orderData = {
        ...formData,
        customerId: customer.id,
        couponCode: appliedCoupon?.code || null,
        items: items.map((item) => ({
          productId: item.Id,
          quantity: item.quantity,
          variantId: item.selectedVariant?.Id || null,
          variantName: item.selectedVariant?.Name || null,
        })),
      };

      const response = await createOrder(orderData);

      if (response.success) {
        clearCart();
        navigate(`/order-success/${response.data.orderNumber}`);
      } else {
        setError(response.message || 'Sipariş oluşturulamadı');
      }
    } catch (err) {
      console.error('Sipariş hatası:', err);
      setError('Sipariş gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Sepetiniz Boş"
        message="Sipariş vermek için önce sepetinize ürün eklemelisiniz."
        actionText="Menüye Git"
        actionPath="/"
      />
    );
  }

  const subtotal = getTotalAmount();
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const totalAmount = appliedCoupon?.finalAmount || subtotal;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-3 sm:mb-4 transition-colors active:text-primary-dark"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base">Sepete Dön</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Sipariş Bilgileri</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                {/* Ad Soyad */}
                <div>
                  <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Ad Soyad *</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.customerName
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-primary'
                    }`}
                    placeholder="Adınız ve Soyadınız"
                  />
                  {formErrors.customerName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customerName}</p>
                  )}
                </div>

                {/* Telefon */}
                <div>
                  <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>Telefon *</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.customerPhone
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-primary'
                    }`}
                    placeholder="0555 123 45 67"
                  />
                  {formErrors.customerPhone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customerPhone}</p>
                  )}
                </div>

                {/* Adres */}
                <div>
                  <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>Teslimat Adresi *</span>
                  </label>
                  
                  {formData.customerAddress ? (
                    <div className="space-y-3">
                      <div className={`w-full px-4 py-3 border rounded-lg bg-gray-50 ${
                        formErrors.customerAddress
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {formData.customerAddress}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {isAuthenticated && (
                          <button
                            type="button"
                            onClick={() => setShowAddressManager(true)}
                            className="flex items-center justify-center space-x-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Kayıtlı Adresler</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowLocationModal(true)}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2 text-sm text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Yeni Adres</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-4 border-2 border-dashed rounded-lg transition-colors ${
                          formErrors.customerAddress
                            ? 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                            : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                        }`}
                      >
                        <MapPin className="w-5 h-5" />
                        <span className="font-medium">Haritadan Adres Seç</span>
                      </button>
                      
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => setShowAddressManager(true)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <BookOpen className="w-5 h-5" />
                          <span className="font-medium">Kayıtlı Adreslerimden Seç</span>
                        </button>
                      )}
                    </div>
                  )}
                  
                  {formErrors.customerAddress && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customerAddress}</p>
                  )}
                </div>

                {/* Not */}
                <div>
                  <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>Not (İsteğe Bağlı)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
                    placeholder="Siparişinizle ilgili özel bir notunuz varsa..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-primary to-primary-dark text-white py-3.5 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:shadow-lg active:shadow-md transform hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <span>Siparişi Tamamla</span>
                )}
              </button>
            </form>
          </div>

          {/* Sipariş Özeti */}
          <div className="lg:col-span-1 mb-20 lg:mb-0">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
                Sipariş Özeti
              </h2>
              
              {/* Ürünler */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.Id}-${item.selectedVariant?.Id || 'default'}`} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.Name} {item.selectedVariant && item.variants && item.variants.length > 1 && `(${item.selectedVariant.Name})`} x{item.quantity}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {(item.effectivePrice * item.quantity).toFixed(2)} ₺
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Kupon Kodu */}
              <div className="border-t pt-4 mb-4">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <Tag className="w-4 h-4 text-primary" />
                    <span>Kupon Kodu</span>
                  </label>
                  
                  {appliedCoupon ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-sm font-semibold text-green-800">{appliedCoupon.code}</p>
                            {appliedCoupon.description && (
                              <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-green-600 hover:text-green-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Kupon kodunu girin"
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={couponLoading}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="flex-shrink-0 px-3 sm:px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uygula'}
                      </button>
                    </div>
                  )}
                  
                  {couponError && (
                    <p className="text-xs text-red-600">{couponError}</p>
                  )}
                </div>
              </div>

              {/* Fiyat Özeti */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Ara Toplam</span>
                  <span>{subtotal.toFixed(2)} ₺</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>İndirim</span>
                    <span>-{discountAmount.toFixed(2)} ₺</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                  <span>Toplam</span>
                  <span className="text-primary">{totalAmount.toFixed(2)} ₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationConfirm}
      />

      {/* Address Manager Modal */}
      {isAuthenticated && (
        <AddressManager
          isOpen={showAddressManager}
          onClose={() => setShowAddressManager(false)}
          onSelectAddress={handleAddressSelect}
        />
      )}
    </div>
  );
}

export default Checkout;

