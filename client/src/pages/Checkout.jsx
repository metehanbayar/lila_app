import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, FileText, Loader2, BookOpen, CreditCard, Lock, Wallet, Store } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { createOrder, validateCoupon, initializePayment, setOfflinePayment } from '../services/api';
import EmptyState from '../components/EmptyState';
import { ShoppingCart } from 'lucide-react';
import LocationPickerModal from '../components/LocationPickerModal';
import AddressManager from '../components/AddressManager';

// Güvenli sayı dönüşümü - NaN kontrolü ve 0 korunur
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Türk telefon numarası normalizasyonu
const normalizePhone = (p) => {
  let s = (p||'').replace(/[^\d]/g,'');
  if (s.startsWith('90') && s.length===12) s = s.slice(2); // 90xxxxxxxxxx -> xxxxxxxxxx
  if (s.startsWith('0')  && s.length===11) s = s.slice(1);
  return s;
};

function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalAmount, clearCart, appliedCoupon: storeAppliedCoupon } = useCartStore();
  const { customer, isAuthenticated } = useCustomerStore();
  
  // Adım yönetimi
  const [currentStep, setCurrentStep] = useState(1); // 1: Bilgiler, 2: Ödeme
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Kupon durumu (local kupon input'u için)
  const [couponCode, setCouponCode] = useState('');
  const [localAppliedCoupon, setLocalAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Konum durumu
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);

  // Müşteri bilgileri
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
  });

  // Ödeme bilgileri
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardHolderName: '',
    installmentCount: 0,
  });

  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('online'); // online | cash_on_delivery | card_on_delivery | pickup

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

  // Adım değiştiğinde yukarı scroll
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, [currentStep]);

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

    const phone = normalizePhone(formData.customerPhone);
    if (!phone) {
      errors.customerPhone = 'Telefon numarası gereklidir';
    } else if (!/^\d{10}$/.test(phone)) {
      errors.customerPhone = 'Geçerli bir telefon numarası girin';
    }

    // customerAddress string olmalı, obje ise fullAddress al
    const addressString = typeof formData.customerAddress === 'string' 
      ? formData.customerAddress 
      : formData.customerAddress?.fullAddress || formData.customerAddress?.FullAddress || '';
    
    if (!addressString.trim()) {
      errors.customerAddress = 'Adres gereklidir';
    } else if (addressString.trim().length < 10) {
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
        setLocalAppliedCoupon(response.data);
        setCouponError('');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Kupon doğrulanamadı');
      setLocalAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setLocalAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleLocationConfirm = (address) => {
    // Address string olmalı ama güvenlik için kontrol edelim
    const addressString = typeof address === 'string' 
      ? address 
      : address?.fullAddress || address?.FullAddress || String(address);
    
    setFormData((prev) => ({ ...prev, customerAddress: addressString }));
    
    // Hata varsa temizle
    if (formErrors.customerAddress) {
      setFormErrors((prev) => ({ ...prev, customerAddress: '' }));
    }
  };

  const handleAddressSelect = (address) => {
    // Address bir obje olabilir {addressName, fullAddress} veya string olabilir
    const addressString = typeof address === 'string' 
      ? address 
      : address?.fullAddress || address?.FullAddress || '';
    
    setFormData((prev) => ({ ...prev, customerAddress: addressString }));
    
    // Hata varsa temizle
    if (formErrors.customerAddress) {
      setFormErrors((prev) => ({ ...prev, customerAddress: '' }));
    }
  };

  // Ödeme bilgileri değişikliği
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Kart numarası formatla (16 haneli, 4'erli gruplar)
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.replace(/\s/g, '').length > 16) {
        formattedValue = formattedValue.replace(/\s/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
      }
    }
    // CVV formatla (max 4 karakter)
    else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }
    // Ay/Yıl formatla
    else if (name === 'expiryMonth') {
      formattedValue = value.replace(/\D/g, '').substring(0, 2);
      if (formattedValue && parseInt(formattedValue) > 12) {
        formattedValue = '12';
      }
    }
    else if (name === 'expiryYear') {
      formattedValue = value.replace(/\D/g, '').substring(0, 2);
    }

    setPaymentData((prev) => ({ ...prev, [name]: formattedValue }));
    
    // Hata varsa temizle
    if (paymentErrors[name]) {
      setPaymentErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Ödeme bilgileri validasyonu
  const validatePayment = () => {
    const errors = {};

    if (!paymentData.cardNumber.replace(/\s/g, '')) {
      errors.cardNumber = 'Kart numarası gereklidir';
    } else if (paymentData.cardNumber.replace(/\s/g, '').length < 16) {
      errors.cardNumber = 'Kart numarası 16 haneli olmalıdır';
    }

    if (!paymentData.expiryMonth) {
      errors.expiryMonth = 'Son kullanma ayı gereklidir';
    } else if (parseInt(paymentData.expiryMonth) < 1 || parseInt(paymentData.expiryMonth) > 12) {
      errors.expiryMonth = 'Geçerli bir ay girin (01-12)';
    }

    if (!paymentData.expiryYear) {
      errors.expiryYear = 'Son kullanma yılı gereklidir';
    } else if (paymentData.expiryYear.length < 2) {
      errors.expiryYear = 'Geçerli bir yıl girin (YY formatında)';
    }

    if (!paymentData.cvv) {
      errors.cvv = 'CVV gereklidir';
    } else if (paymentData.cvv.length < 3) {
      errors.cvv = 'CVV en az 3 haneli olmalıdır';
    }

    if (!paymentData.cardHolderName.trim()) {
      errors.cardHolderName = 'Kart sahibi adı gereklidir';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // İlk adım tamamlandı - Sadece validasyon, sipariş oluşturma Step2'de
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Validasyon başarılı - Ödeme adımına geç (sipariş henüz oluşturulmadı)
    setCurrentStep(2);
  };

  // Ödeme adımı - Ödeme işlemini başlat
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    // Offline yöntem seçildiyse kart validasyonu yapma
    const isOffline = paymentMethod !== 'online';
    if (!isOffline && !validatePayment()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!isAuthenticated || !customer) {
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }

      const subtotal = getTotalAmount();
      const activeCoupon = storeAppliedCoupon || localAppliedCoupon;
      const discountAmount = activeCoupon?.calculatedDiscount || activeCoupon?.discountAmount || 0;
      const totalAmount = Math.max(0, Number(subtotal) - Number(discountAmount || 0));

      // customerAddress string olmalı, obje ise fullAddress al
      const addressString = typeof formData.customerAddress === 'string' 
        ? formData.customerAddress 
        : formData.customerAddress?.fullAddress || formData.customerAddress?.FullAddress || '';
      
      // Telefon numarasını normalize et
      const normalizedPhone = normalizePhone(formData.customerPhone);
      
      // Siparişi oluştur (henüz ödeme yapılmadı, PaymentStatus = Pending)
      const orderData = {
        ...formData,
        customerPhone: normalizedPhone,
        customerAddress: addressString, // String olarak gönder
        customerId: customer.id,
        couponCode: activeCoupon?.Code || activeCoupon?.code || null,
        items: items.map((item) => ({
          productId: item.Id,
          quantity: item.quantity,
          variantId: item.selectedVariant?.Id || null,
          variantName: item.selectedVariant?.Name || null,
          restaurantId: toNum(item.RestaurantId),
        })),
      };

      const orderResponse = await createOrder(orderData);

      if (!orderResponse.success) {
        setError(orderResponse.message || 'Sipariş oluşturulamadı');
        return;
      }

      // İlk siparişin ID'sini kaydet (çoklu sipariş durumunda)
      const firstOrderId = orderResponse.data.orders[0]?.orderId || orderResponse.data.orders[0]?.Id;
      

      if (isOffline) {
        // Offline ödeme seçildi: kapıda/gel-al
        const offlineResp = await setOfflinePayment(firstOrderId, paymentMethod);
        if (offlineResp.success) {
          clearCart();
          navigate(`/payment/success?orderId=${firstOrderId}&offline=1`);
          return;
        } else {
          setError(offlineResp.message || 'Offline ödeme ayarlanamadı');
          return;
        }
      }

      // Online ödeme akışı (kart)
      const clientIp = '0.0.0.0'; // Gerçek IP sunucudan alınabilir
      const paymentResponse = await initializePayment({
        orderId: firstOrderId,
        amount: totalAmount,
        cardNumber: paymentData.cardNumber.replace(/\s/g, ''),
        expiryMonth: paymentData.expiryMonth.padStart(2, '0'),
        expiryYear: paymentData.expiryYear,
        cvv: paymentData.cvv,
        clientIp: clientIp,
        installmentCount: Number(paymentData.installmentCount || 0),
      });

      if (paymentResponse.success) {
        if (paymentResponse.requires3DSecure && paymentResponse.enrolled) {
          // 3D Secure gerekli - ACS'e yönlendir
          // Form oluştur ve otomatik gönder
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = paymentResponse.acsUrl;
          form.target = '_self'; // Aynı pencerede aç

          // Form charset
          form.setAttribute('accept-charset', 'UTF-8');

          // TermUrl (zorunlu - boş gelirse de alanı gönder)
          const termUrlInput = document.createElement('input');
          termUrlInput.type = 'hidden';
          termUrlInput.name = 'TermUrl';
          termUrlInput.value = paymentResponse.termUrl || '';
          form.appendChild(termUrlInput);

          // MD (zorunlu - Troy kartlarda mutlaka alan gönder)
          const mdInput = document.createElement('input');
          mdInput.type = 'hidden';
          mdInput.name = 'MD';
          mdInput.value = paymentResponse.md || '';
          form.appendChild(mdInput);

          // PaReq - Vakıf Bankası örnek kodunda her zaman gönderiliyor (boş olsa bile)
          // Troy kartlarda bazen boş gelebilir ama parametre yine de gönderilmeli
          const paReqInput = document.createElement('input');
          paReqInput.type = 'hidden';
          paReqInput.name = 'PaReq';
          paReqInput.value = paymentResponse.paReq || ''; // Boş olsa bile gönder
          form.appendChild(paReqInput);

          // Form'u body'ye ekle ve gönder
          document.body.appendChild(form);
          
          // Form submit'i gecikmeyle yap (bazı tarayıcılarda sorun çıkarabiliyor)
          setTimeout(() => {
            try {
              form.submit();
            } catch (error) {
              setError('3D Secure yönlendirmesi başarısız. Lütfen tekrar deneyin.');
            }
          }, 100);
        } else {
          // Ödeme başarılı (3D Secure gerekmedi)
          clearCart();
          const orderNumber = paymentResponse.paymentResult?.transactionId || 'SUCCESS';
          navigate(`/order-success/${orderNumber}`, {
            state: { 
              orderData: { 
                orders: [{ orderNumber: orderNumber }],
                paymentResult: paymentResponse.paymentResult
              }
            }
          });
        }
      } else {
        // Detaylı hata mesajı
        const errorMessage = paymentResponse.message || 'Ödeme başlatılamadı';
        const errorCode = paymentResponse.errorCode || paymentResponse.errorDetails?.errorCode;
        const errorDetails = paymentResponse.errorDetails;
        
        let fullErrorMessage = errorMessage;
        if (errorCode) {
          fullErrorMessage += ` (Hata Kodu: ${errorCode})`;
        }
        if (errorDetails?.errorMessage && errorDetails.errorMessage !== errorMessage) {
          fullErrorMessage += ` - ${errorDetails.errorMessage}`;
        }
        
        setError(fullErrorMessage);
      }
    } catch (err) {
      const errorResponse = err.response?.data;
      let errorMessage = errorResponse?.message || 'Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (errorResponse?.errorCode) {
        errorMessage += ` (Hata Kodu: ${errorResponse.errorCode})`;
      }
      if (errorResponse?.errorDetails?.errorMessage) {
        errorMessage += ` - ${errorResponse.errorDetails.errorMessage}`;
      }
      
      setError(errorMessage);
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

  // Farklı restoranlar kontrolü (NaN ve 0 korunur)
  const restaurantIds = [...new Set(
    items
      .map(i => toNum(i.RestaurantId))
      .filter(n => n !== null) // 0 dahil, sadece null değil
  )];
  const hasMultipleRestaurants = restaurantIds.length > 1;

  const subtotal = getTotalAmount();
  const discountAmount = storeAppliedCoupon?.calculatedDiscount || localAppliedCoupon?.calculatedDiscount || localAppliedCoupon?.discountAmount || 0;
  const totalAmount = Math.max(0, Number(subtotal) - Number(discountAmount || 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
        {/* Farklı Restoran Uyarısı */}
        {hasMultipleRestaurants && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-amber-900 font-medium">
                  {restaurantIds.length} farklı restorandan <strong>{restaurantIds.length} ayrı sipariş</strong> oluşturulacak
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Adım Göstergesi */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <button
            onClick={() => currentStep >= 1 && setCurrentStep(1)}
            disabled={currentStep < 1}
            className={`flex items-center gap-2 transition-all disabled:cursor-not-allowed ${
              currentStep >= 1 ? 'text-primary cursor-pointer hover:opacity-80' : 'text-gray-400'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              currentStep >= 1 ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Teslimat</span>
          </button>
          <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          <button
            onClick={() => currentStep >= 2 && setCurrentStep(2)}
            disabled={currentStep < 2}
            className={`flex items-center gap-2 transition-all disabled:cursor-not-allowed ${
              currentStep >= 2 ? 'text-primary cursor-pointer hover:opacity-80' : 'text-gray-400'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              currentStep >= 2 ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Ödeme</span>
          </button>
        </div>

        {/* Kompakt Sipariş Özeti - Üstte */}
        <div className="mb-5 bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <ShoppingCart className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 truncate">
                  {items.length} ürün
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{Math.max(0, totalAmount).toFixed(2)} ₺</p>
                {discountAmount > 0 && (
                  <p className="text-xs text-green-600 line-through">{Math.max(0, subtotal).toFixed(2)} ₺</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div>
            {currentStep === 1 ? (
              <form onSubmit={handleStep1Submit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Ad Soyad */}
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-1.5">
                    <User className="w-4 h-4 text-primary" />
                    <span>Ad Soyad</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.customerName
                        ? 'border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                    }`}
                    placeholder="Adınız ve Soyadınız"
                  />
                  {formErrors.customerName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.customerName}</p>
                  )}
                </div>

                {/* Telefon */}
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-1.5">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>Telefon</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.customerPhone
                        ? 'border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                    }`}
                    placeholder="0555 123 45 67"
                  />
                  {formErrors.customerPhone && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.customerPhone}</p>
                  )}
                </div>

                {/* Adres */}
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Teslimat Adresi</span>
                  </label>
                  
                  <div className="flex gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className={`flex-1 min-w-0 flex items-center justify-start gap-2 px-4 py-2.5 border-2 border-dashed rounded-lg transition-colors text-sm ${
                        formErrors.customerAddress
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : formData.customerAddress
                          ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                          : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                      }`}
                    >
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium text-left flex-1 min-w-0 truncate">
                        {formData.customerAddress 
                          ? (typeof formData.customerAddress === 'string' 
                              ? formData.customerAddress 
                              : formData.customerAddress?.fullAddress || formData.customerAddress?.FullAddress || String(formData.customerAddress))
                          : 'Haritadan Seç'}
                      </span>
                    </button>
                    
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => setShowAddressManager(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Adreslerim</span>
                      </button>
                    )}
                  </div>
                  
                  {formErrors.customerAddress && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.customerAddress}</p>
                  )}
                </div>

                {/* Not */}
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Not (İsteğe Bağlı)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                    placeholder="Siparişinizle ilgili özel bir notunuz varsa..."
                  />
                </div>
              </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-5 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Devam Et</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleStep2Submit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Ödeme Yöntemi Seçimi */}
                <div className="mb-5">
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-md transition-all ${
                        paymentMethod === 'online'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'online' ? 'text-primary' : ''}`} />
                      <span className="text-xs font-medium">Online</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash_on_delivery')}
                      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-md transition-all ${
                        paymentMethod === 'cash_on_delivery'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Wallet className={`w-5 h-5 ${paymentMethod === 'cash_on_delivery' ? 'text-primary' : ''}`} />
                      <span className="text-xs font-medium">Kapıda Nakit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card_on_delivery')}
                      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-md transition-all ${
                        paymentMethod === 'card_on_delivery'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'card_on_delivery' ? 'text-primary' : ''}`} />
                      <span className="text-xs font-medium">Kapıda Kart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pickup')}
                      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-md transition-all ${
                        paymentMethod === 'pickup'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Store className={`w-5 h-5 ${paymentMethod === 'pickup' ? 'text-primary' : ''}`} />
                      <span className="text-xs font-medium">Gel Al</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'online' && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-blue-900 font-medium">256-bit SSL ile güvenle korunuyor</p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'online' && (
                <div className="space-y-4">
                  {/* Kart Sahibi Adı */}
                  <div>
                    <label className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-1.5">
                      <User className="w-4 h-4 text-primary" />
                      <span>Kart Sahibi</span>
                    </label>
                    <input
                      type="text"
                      name="cardHolderName"
                      value={paymentData.cardHolderName}
                      onChange={handlePaymentChange}
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        paymentErrors.cardHolderName
                          ? 'border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                      }`}
                      placeholder="Kart üzerindeki isim"
                    />
                    {paymentErrors.cardHolderName && (
                      <p className="mt-1 text-xs text-red-600">{paymentErrors.cardHolderName}</p>
                    )}
                  </div>

                  {/* Kart Numarası */}
                  <div>
                    <label className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-1.5">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span>Kart Numarası</span>
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={handlePaymentChange}
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors font-mono ${
                        paymentErrors.cardNumber
                          ? 'border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                      }`}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                    {paymentErrors.cardNumber && (
                      <p className="mt-1 text-xs text-red-600">{paymentErrors.cardNumber}</p>
                    )}
                  </div>

                  {/* Son Kullanma Tarihi ve CVV */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-gray-700 font-medium text-sm mb-1.5">
                        Ay
                      </label>
                      <input
                        type="text"
                        name="expiryMonth"
                        value={paymentData.expiryMonth}
                        onChange={handlePaymentChange}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors text-center font-mono ${
                          paymentErrors.expiryMonth
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                        }`}
                        placeholder="MM"
                        maxLength="2"
                      />
                      {paymentErrors.expiryMonth && (
                        <p className="mt-1 text-xs text-red-600">{paymentErrors.expiryMonth}</p>
                      )}
                    </div>
                    <div className="col-span-1">
                      <label className="block text-gray-700 font-medium text-sm mb-1.5">
                        Yıl
                      </label>
                      <input
                        type="text"
                        name="expiryYear"
                        value={paymentData.expiryYear}
                        onChange={handlePaymentChange}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors text-center font-mono ${
                          paymentErrors.expiryYear
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                        }`}
                        placeholder="YY"
                        maxLength="2"
                      />
                      {paymentErrors.expiryYear && (
                        <p className="mt-1 text-xs text-red-600">{paymentErrors.expiryYear}</p>
                      )}
                    </div>
                    <div className="col-span-1">
                      <label className="block text-gray-700 font-medium text-sm mb-1.5">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentData.cvv}
                        onChange={handlePaymentChange}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors text-center font-mono ${
                          paymentErrors.cvv
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                        }`}
                        placeholder="123"
                        maxLength="4"
                      />
                      {paymentErrors.cvv && (
                        <p className="mt-1 text-xs text-red-600">{paymentErrors.cvv}</p>
                      )}
                    </div>
                  </div>
                </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-5 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{paymentMethod === 'online' ? 'İşleniyor...' : 'Onaylanıyor...'}</span>
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'online' && <Lock className="w-4 h-4" />}
                      <span>
                        {paymentMethod === 'online' ? `Ödeme Yap • ${Math.max(0, totalAmount).toFixed(2)} ₺` : `Onayla • ${Math.max(0, totalAmount).toFixed(2)} ₺`}
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}
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

