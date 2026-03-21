import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  ShoppingCart,
  Store,
  Wallet,
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LocationPickerModal from '../components/LocationPickerModal';
import AddressManager from '../components/AddressManager';
import {
  createOrder,
  initializePayment,
  setOfflinePayment,
} from '../services/api';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import {
  Badge,
  Field,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  StickyActionBar,
  SurfaceCard,
  TextAreaField,
  TextInput,
  cn,
} from '../components/ui/primitives';

const toNum = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizePhone = (phone) => {
  let normalized = (phone || '').replace(/[^\d]/g, '');
  if (normalized.startsWith('90') && normalized.length === 12) normalized = normalized.slice(2);
  if (normalized.startsWith('0') && normalized.length === 11) normalized = normalized.slice(1);
  return normalized;
};

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} TL`;

function StepMarker({ step, label, active, complete, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition-all',
        active || complete
          ? 'border-primary/20 bg-white text-dark shadow-card'
          : 'border-surface-border bg-surface-muted text-dark-lighter',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-[16px] text-sm font-black',
          active || complete ? 'bg-primary text-white' : 'bg-white text-dark-lighter',
        )}
      >
        {step}
      </div>
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs">{complete ? 'Hazir' : active ? 'Bu adimda' : 'Sirada'}</p>
      </div>
    </button>
  );
}

function OrderSummary({ items, subtotal, discountAmount, totalAmount, restaurantCount, paymentMethod }) {
  const paymentLabel =
    paymentMethod === 'card_on_delivery'
      ? 'Kapida kart'
      : paymentMethod === 'pickup'
        ? 'Gel al'
        : paymentMethod === 'online'
          ? 'Online odeme'
          : 'Kapida nakit';

  return (
    <SurfaceCard tone="muted" className="space-y-4 p-4 sm:p-5">
      <div className="space-y-2">
        <span className="gm-eyebrow">Siparis ozeti</span>
        <h2 className="text-2xl font-bold text-dark sm:text-3xl">Toplam net</h2>
        <p className="text-sm leading-6 text-dark-lighter">
          Odeme turu, restoran dagilimi ve toplam tutar tek panelde kalir.
        </p>
      </div>

      <div className="rounded-[24px] border border-white/70 bg-white px-4 py-4 shadow-card">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-dark-lighter">Urun</span>
            <span className="font-bold text-dark">{items.length}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-dark-lighter">Restoran</span>
            <span className="font-bold text-dark">{restaurantCount}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-dark-lighter">Odeme</span>
            <span className="font-bold text-dark">{paymentLabel}</span>
          </div>
          <div className="h-px bg-surface-border" />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-dark-lighter">Ara toplam</span>
            <span className="font-bold text-dark">{formatPrice(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between gap-3 text-sm text-green-700">
              <span>Indirim</span>
              <span className="font-bold">-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="h-px bg-surface-border" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-dark">Genel toplam</span>
            <span className="text-2xl font-black text-primary-dark">{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.slice(0, 3).map((item) => (
          <div key={`${item.Id}:${item.selectedVariant?.Id ?? 0}`} className="flex items-start gap-3 rounded-[22px] border border-surface-border bg-white px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-surface-muted">
              {item.ImageUrl ? (
                <img src={item.ImageUrl} alt={item.Name} className="h-full w-full object-cover" />
              ) : (
                <ShoppingCart className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-bold text-dark">{item.Name}</p>
              <p className="text-sm text-dark-lighter">
                {item.quantity} x {formatPrice(item.effectivePrice)}
              </p>
            </div>
          </div>
        ))}

        {items.length > 3 && (
          <div className="rounded-[22px] border border-dashed border-surface-border bg-white px-4 py-3 text-sm text-dark-lighter">
            +{items.length - 3} urun daha
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalAmount, clearCart, appliedCoupon: storeAppliedCoupon } = useCartStore();
  const { customer, isAuthenticated } = useCustomerStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
  });
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardHolderName: '',
    installmentCount: 0,
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [formErrors, setFormErrors] = useState({});

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Ad soyad gereklidir';
    }

    const phone = normalizePhone(formData.customerPhone);
    if (!phone) {
      errors.customerPhone = 'Telefon numarasi gereklidir';
    } else if (!/^\\d{10}$/.test(phone)) {
      errors.customerPhone = 'Gecerli bir telefon numarasi girin';
    }

    const addressString =
      typeof formData.customerAddress === 'string'
        ? formData.customerAddress
        : formData.customerAddress?.fullAddress || formData.customerAddress?.FullAddress || '';

    if (!addressString.trim()) {
      errors.customerAddress = 'Adres gereklidir';
    } else if (addressString.trim().length < 10) {
      errors.customerAddress = 'Lutfen detayli adres girin';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLocationConfirm = (address) => {
    const addressString =
      typeof address === 'string'
        ? address
        : address?.fullAddress || address?.FullAddress || String(address);

    setFormData((prev) => ({ ...prev, customerAddress: addressString }));
    if (formErrors.customerAddress) {
      setFormErrors((prev) => ({ ...prev, customerAddress: '' }));
    }
  };

  const handleAddressSelect = (address) => {
    const addressString =
      typeof address === 'string'
        ? address
        : address?.fullAddress || address?.FullAddress || '';

    setFormData((prev) => ({ ...prev, customerAddress: addressString }));
    if (formErrors.customerAddress) {
      setFormErrors((prev) => ({ ...prev, customerAddress: '' }));
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.replace(/\\s/g, '').length > 16) {
        formattedValue = formattedValue.replace(/\\s/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
      }
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\\D/g, '').substring(0, 4);
    } else if (name === 'expiryMonth') {
      formattedValue = value.replace(/\\D/g, '').substring(0, 2);
      if (formattedValue && parseInt(formattedValue, 10) > 12) {
        formattedValue = '12';
      }
    } else if (name === 'expiryYear') {
      formattedValue = value.replace(/\\D/g, '').substring(0, 2);
    }

    setPaymentData((prev) => ({ ...prev, [name]: formattedValue }));
    if (paymentErrors[name]) {
      setPaymentErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePayment = () => {
    const errors = {};

    if (!paymentData.cardNumber.replace(/\\s/g, '')) {
      errors.cardNumber = 'Kart numarasi gereklidir';
    } else if (paymentData.cardNumber.replace(/\\s/g, '').length < 16) {
      errors.cardNumber = 'Kart numarasi 16 haneli olmalidir';
    }

    if (!paymentData.expiryMonth) {
      errors.expiryMonth = 'Ay gereklidir';
    } else if (parseInt(paymentData.expiryMonth, 10) < 1 || parseInt(paymentData.expiryMonth, 10) > 12) {
      errors.expiryMonth = '01-12 arasinda bir ay girin';
    }

    if (!paymentData.expiryYear) {
      errors.expiryYear = 'Yil gereklidir';
    } else if (paymentData.expiryYear.length < 2) {
      errors.expiryYear = 'YY formatinda yil girin';
    }

    if (!paymentData.cvv) {
      errors.cvv = 'CVV gereklidir';
    } else if (paymentData.cvv.length < 3) {
      errors.cvv = 'CVV en az 3 haneli olmali';
    }

    if (!paymentData.cardHolderName.trim()) {
      errors.cardHolderName = 'Kart sahibi adi gereklidir';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setCurrentStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
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

      const subtotalAmount = getTotalAmount();
      const activeCoupon = storeAppliedCoupon;
      const appliedDiscount = activeCoupon?.calculatedDiscount || activeCoupon?.discountAmount || 0;
      const payableTotal = Math.max(0, Number(subtotalAmount) - Number(appliedDiscount || 0));
      const addressString =
        typeof formData.customerAddress === 'string'
          ? formData.customerAddress
          : formData.customerAddress?.fullAddress || formData.customerAddress?.FullAddress || '';
      const normalizedPhone = normalizePhone(formData.customerPhone);

      const orderData = {
        ...formData,
        customerPhone: normalizedPhone,
        customerAddress: addressString,
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
        setError(orderResponse.message || 'Siparis olusturulamadi');
        return;
      }

      const firstOrderId =
        orderResponse.data.orders[0]?.orderId || orderResponse.data.orders[0]?.Id;

      if (isOffline) {
        const offlineResp = await setOfflinePayment(firstOrderId, paymentMethod);
        if (offlineResp.success) {
          clearCart();
          navigate(`/payment/success?orderId=${firstOrderId}&offline=1`);
          return;
        }
        setError(offlineResp.message || 'Offline odeme ayarlanamadi');
        return;
      }

      const paymentResponse = await initializePayment({
        orderId: firstOrderId,
        amount: payableTotal,
        cardNumber: paymentData.cardNumber.replace(/\s/g, ''),
        expiryMonth: paymentData.expiryMonth.padStart(2, '0'),
        expiryYear: paymentData.expiryYear,
        cvv: paymentData.cvv,
        clientIp: '0.0.0.0',
        installmentCount: Number(paymentData.installmentCount || 0),
      });

      if (paymentResponse.success) {
        if (paymentResponse.requires3DSecure && paymentResponse.enrolled) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = paymentResponse.acsUrl;
          form.target = '_self';
          form.setAttribute('accept-charset', 'UTF-8');

          [
            { name: 'TermUrl', value: paymentResponse.termUrl || '' },
            { name: 'MD', value: paymentResponse.md || '' },
            { name: 'PaReq', value: paymentResponse.paReq || '' },
          ].forEach((item) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = item.name;
            input.value = item.value;
            form.appendChild(input);
          });

          document.body.appendChild(form);

          setTimeout(() => {
            try {
              form.submit();
            } catch {
              setError('3D Secure yonlendirmesi basarisiz oldu. Lutfen tekrar deneyin.');
            }
          }, 100);
        } else {
          clearCart();
          const orderNumber = paymentResponse.paymentResult?.transactionId || 'SUCCESS';
          navigate(`/order-success/${orderNumber}`, {
            state: {
              orderData: {
                orders: [{ orderNumber }],
                paymentResult: paymentResponse.paymentResult,
              },
            },
          });
        }
      } else {
        const errorMessage = paymentResponse.message || 'Odeme baslatilamadi';
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
      let errorMessage =
        errorResponse?.message ||
        'Odeme islemi sirasinda bir hata olustu. Lutfen tekrar deneyin.';

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
        title="Sepetiniz Bos"
        message="Siparis vermek icin once sepetinize urun eklemelisiniz."
        actionText="Menuye Git"
        actionPath="/"
      />
    );
  }

  const restaurantIds = [
    ...new Set(
      items
        .map((item) => toNum(item.RestaurantId))
        .filter((num) => num !== null),
    ),
  ];
  const hasMultipleRestaurants = restaurantIds.length > 1;
  const subtotal = getTotalAmount();
  const discountAmount =
    storeAppliedCoupon?.calculatedDiscount || storeAppliedCoupon?.discountAmount || 0;
  const totalAmount = Math.max(0, Number(subtotal) - Number(discountAmount || 0));

  const paymentOptions = [
    { id: 'cash_on_delivery', label: 'Kapida nakit', description: 'Teslimatta nakit odeme alin.', icon: Wallet },
    { id: 'card_on_delivery', label: 'Kapida kart', description: 'Pos ile teslimatta odeme alin.', icon: CreditCard },
    { id: 'pickup', label: 'Gel al', description: 'Musteri restorandan teslim alir.', icon: Store },
  ];

  return (
    <div className="pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-4 sm:pt-6 lg:pb-12">
      <PageShell width="full" className="space-y-6">
        <SurfaceCard tone="hero" className="overflow-hidden p-6 sm:p-7 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px] lg:items-end">
            <div className="space-y-4">
              <Badge className="border border-white/20 bg-white/10 text-white">Checkout</Badge>
              <div className="space-y-3">
                <h1 className="font-display text-4xl leading-none sm:text-5xl lg:text-6xl">
                  Teslimat ve odeme ayni akista.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
                  Mobile first form yapisi, desktopta sag tarafta sabit siparis ozeti ile yeniden kuruldu.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/62">Urun</p>
                <p className="mt-2 text-3xl font-black">{items.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/62">Restoran</p>
                <p className="mt-2 text-3xl font-black">{restaurantIds.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/62">Toplam</p>
                <p className="mt-2 text-3xl font-black">{formatPrice(totalAmount)}</p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        {hasMultipleRestaurants && (
          <SurfaceCard className="border border-amber-200 bg-amber-50 p-4 shadow-none">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-950">Birden fazla restoran secildi</p>
                <p className="text-sm leading-6 text-amber-900/82">
                  Checkout sonunda {restaurantIds.length} ayri siparis olusturulacak.
                </p>
              </div>
            </div>
          </SurfaceCard>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <StepMarker
            step={1}
            label="Teslimat"
            active={currentStep === 1}
            complete={currentStep > 1}
            onClick={() => setCurrentStep(1)}
          />
          <StepMarker
            step={2}
            label="Odeme"
            active={currentStep === 2}
            complete={false}
            onClick={() => {
              if (currentStep >= 2) setCurrentStep(2);
            }}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),360px] xl:items-start">
          <div className="space-y-5">
            {error && (
              <SurfaceCard className="border border-red-200 bg-red-50 p-4 shadow-none">
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </SurfaceCard>
            )}

            {currentStep === 1 ? (
              <form onSubmit={handleStep1Submit} className="space-y-5">
                <SurfaceCard className="space-y-5 p-5 sm:p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">1. adim</p>
                    <h2 className="mt-2 text-2xl font-bold text-dark">Teslimat bilgileri</h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Ad soyad" error={formErrors.customerName}>
                      <TextInput
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        placeholder="Adiniz ve soyadiniz"
                      />
                    </Field>

                    <Field label="Telefon" error={formErrors.customerPhone}>
                      <TextInput
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleChange}
                        placeholder="0555 123 45 67"
                      />
                    </Field>
                  </div>

                  <Field label="Teslimat adresi" error={formErrors.customerAddress}>
                    <div className="space-y-3">
                      <div className="rounded-[24px] border border-surface-border bg-surface-muted p-4">
                        {formData.customerAddress ? (
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-primary text-white shadow-lg shadow-primary/20">
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-dark">Secilen adres</p>
                              <p className="mt-1 text-sm leading-6 text-dark-lighter">
                                {typeof formData.customerAddress === 'string'
                                  ? formData.customerAddress
                                  : formData.customerAddress?.fullAddress ||
                                    formData.customerAddress?.FullAddress ||
                                    String(formData.customerAddress)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[20px] border border-dashed border-primary/20 bg-primary/5 p-4 text-sm text-primary-dark">
                            Henuz adres secilmedi. Harita veya kayitli adreslerden devam edin.
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <PrimaryButton type="button" className="justify-center sm:flex-1" onClick={() => setShowLocationModal(true)}>
                          <MapPin className="h-4 w-4" />
                          Haritadan sec
                        </PrimaryButton>
                        {isAuthenticated && (
                          <SecondaryButton type="button" className="justify-center sm:flex-1" onClick={() => setShowAddressManager(true)}>
                            <BookOpen className="h-4 w-4" />
                            Adreslerim
                          </SecondaryButton>
                        )}
                      </div>
                    </div>
                  </Field>

                  <Field label="Siparis notu">
                    <TextAreaField
                      name="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Kurye icin ek yonlendirme yazabilirsiniz."
                    />
                  </Field>
                </SurfaceCard>

                <StickyActionBar>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <SecondaryButton type="button" className="justify-center" onClick={() => navigate('/cart')}>
                      <ArrowLeft className="h-4 w-4" />
                      Sepete don
                    </SecondaryButton>
                    <PrimaryButton type="submit" className="justify-center" disabled={loading}>
                      Devam et
                      <ArrowRight className="h-4 w-4" />
                    </PrimaryButton>
                  </div>
                </StickyActionBar>
              </form>
            ) : (
              <form onSubmit={handleStep2Submit} className="space-y-5">
                <SurfaceCard className="space-y-5 p-5 sm:p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">2. adim</p>
                    <h2 className="mt-2 text-2xl font-bold text-dark">Odeme yontemi</h2>
                  </div>

                  <div className="grid gap-3">
                    {paymentOptions.map((option) => {
                      const Icon = option.icon;
                      const active = paymentMethod === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setPaymentMethod(option.id)}
                          className={cn(
                            'flex items-start gap-4 rounded-[24px] border p-4 text-left transition-all',
                            active
                              ? 'border-primary/20 bg-white shadow-card'
                              : 'border-surface-border bg-surface-muted hover:border-primary/15 hover:bg-white',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]',
                              active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-dark',
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-dark">{option.label}</p>
                            <p className="mt-1 text-sm leading-6 text-dark-lighter">{option.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'online' && (
                    <>
                      <SurfaceCard tone="muted" className="border border-blue-200 bg-blue-50 p-4 shadow-none">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-blue-600 text-white">
                            <Lock className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-semibold text-blue-900">256-bit SSL ile korunur.</p>
                        </div>
                      </SurfaceCard>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Kart sahibi" error={paymentErrors.cardHolderName}>
                          <TextInput
                            name="cardHolderName"
                            value={paymentData.cardHolderName}
                            onChange={handlePaymentChange}
                            placeholder="Kart uzerindeki isim"
                          />
                        </Field>

                        <Field label="Kart numarasi" error={paymentErrors.cardNumber}>
                          <TextInput
                            name="cardNumber"
                            value={paymentData.cardNumber}
                            onChange={handlePaymentChange}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Ay" error={paymentErrors.expiryMonth}>
                          <TextInput
                            name="expiryMonth"
                            value={paymentData.expiryMonth}
                            onChange={handlePaymentChange}
                            placeholder="MM"
                            maxLength={2}
                          />
                        </Field>

                        <Field label="Yil" error={paymentErrors.expiryYear}>
                          <TextInput
                            name="expiryYear"
                            value={paymentData.expiryYear}
                            onChange={handlePaymentChange}
                            placeholder="YY"
                            maxLength={2}
                          />
                        </Field>

                        <Field label="CVV" error={paymentErrors.cvv}>
                          <TextInput
                            name="cvv"
                            value={paymentData.cvv}
                            onChange={handlePaymentChange}
                            placeholder="123"
                            maxLength={4}
                          />
                        </Field>
                      </div>
                    </>
                  )}
                </SurfaceCard>

                <StickyActionBar>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SecondaryButton type="button" className="justify-center" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="h-4 w-4" />
                      Teslimata don
                    </SecondaryButton>
                    <PrimaryButton type="submit" className="justify-center" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Islemler suruyor
                        </>
                      ) : (
                        <>
                          {paymentMethod === 'online' && <Lock className="h-4 w-4" />}
                          {paymentMethod === 'online'
                            ? `Odeme yap • ${formatPrice(totalAmount)}`
                            : `Onayla • ${formatPrice(totalAmount)}`}
                        </>
                      )}
                    </PrimaryButton>
                  </div>
                </StickyActionBar>
              </form>
            )}
          </div>

          <div className="xl:sticky xl:top-24">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              discountAmount={discountAmount}
              totalAmount={totalAmount}
              restaurantCount={restaurantIds.length}
              paymentMethod={paymentMethod}
            />
          </div>
        </div>
      </PageShell>

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationConfirm}
      />

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
