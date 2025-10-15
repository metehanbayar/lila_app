import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart, Gift, X, Check, Tag } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import EmptyState from '../components/EmptyState';
import { useEffect, useState } from 'react';
import { getActivePromotions } from '../services/api';

function Cart() {
  const navigate = useNavigate();
  const { items, increaseQuantity, decreaseQuantity, removeItem, getTotalAmount } = useCartStore();
  const { isAuthenticated } = useCustomerStore();
  const [promotions, setPromotions] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const totalAmount = getTotalAmount();

  useEffect(() => {
    loadPromotions();
  }, []);

  // Sepet değiştiğinde kupon indirimini yeniden hesapla
  useEffect(() => {
    if (appliedCoupon) {
      // Minimum tutar kontrolü
      if (totalAmount < (appliedCoupon.MinimumAmount || 0)) {
        setAppliedCoupon(null);
        return;
      }
      
      // İndirim tutarını yeniden hesapla
      let newDiscount = 0;
      if (appliedCoupon.DiscountType === 'percentage') {
        newDiscount = (totalAmount * appliedCoupon.DiscountValue) / 100;
        if (appliedCoupon.MaxDiscount && newDiscount > appliedCoupon.MaxDiscount) {
          newDiscount = appliedCoupon.MaxDiscount;
        }
      } else {
        newDiscount = appliedCoupon.DiscountValue;
      }
      
      if (newDiscount > totalAmount) {
        newDiscount = totalAmount;
      }
      
      // Hesaplanan indirim değiştiyse güncelle
      if (newDiscount !== appliedCoupon.calculatedDiscount) {
        setAppliedCoupon(prev => ({
          ...prev,
          calculatedDiscount: newDiscount,
        }));
      }
    }
  }, [totalAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPromotions = async () => {
    try {
      const response = await getActivePromotions();
      if (response.success) {
        setPromotions(response.data);
      }
    } catch (err) {
      console.error('Kampanyalar yüklenemedi:', err);
    }
  };

  // Sepet tutarına uygun kampanyaları filtrele
  const eligiblePromotions = promotions.filter(promo => 
    totalAmount >= (promo.MinimumAmount || 0)
  );

  // Kupon uygula
  const applyCoupon = (coupon) => {
    let discountAmount = 0;
    
    if (coupon.DiscountType === 'percentage') {
      discountAmount = (totalAmount * coupon.DiscountValue) / 100;
      if (coupon.MaxDiscount && discountAmount > coupon.MaxDiscount) {
        discountAmount = coupon.MaxDiscount;
      }
    } else {
      discountAmount = coupon.DiscountValue;
    }

    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    setAppliedCoupon({
      ...coupon,
      calculatedDiscount: discountAmount,
    });
  };

  // Kupon kaldır
  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const discountAmount = appliedCoupon?.calculatedDiscount || 0;
  const finalAmount = totalAmount - discountAmount;

  // Sipariş tamamlama fonksiyonu
  const handleContinue = () => {
    if (!isAuthenticated) {
      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Sepetiniz Boş"
        message="Henüz sepetinize ürün eklemediniz. Lezzetli menümüze göz atın!"
        actionText="Menüye Git"
        actionPath="/"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky App Bar */}
      <div className="sticky top-0 z-30 bg-white/90 supports-[backdrop-filter]:bg-white/70 backdrop-blur border-b">
        <div className="container mx-auto px-4 max-w-4xl py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full text-gray-700 hover:bg-gray-100 active:bg-gray-200"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Sepetim</h1>
        </div>
      </div>

      {/* İçerik alanı */}
      <div
        className="container mx-auto px-4 max-w-4xl pt-4"
        style={{ paddingBottom: 'calc(56px + 120px + env(safe-area-inset-bottom))' }}
      >
        <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-3 sm:p-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.Id}-${item.selectedVariant?.Id || 'default'}`}
                className="flex items-center gap-3 pb-4 border-b last:border-b-0"
              >
                {/* Ürün adı/fiyat */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 mb-0.5 leading-snug break-words">{item.Name}</h3>
                  {/* Açıklama ve ekstra metinler kaldırıldı */}
                  <p className="text-sm text-primary font-bold">{item.effectivePrice.toFixed(2)} ₺</p>
                </div>

                {/* Stepper + satır toplamı + sil */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQuantity(item.Id, item.selectedVariant?.Id)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      aria-label="Miktarı azalt"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <span className="font-semibold text-base min-w-[2rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => increaseQuantity(item.Id, item.selectedVariant?.Id)}
                      className="w-8 h-8 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center"
                      aria-label="Miktarı artır"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-bold text-base text-gray-900 whitespace-nowrap tabular-nums">
                    {(item.effectivePrice * item.quantity).toFixed(2)} ₺
                  </span>
                  <button
                    onClick={() => removeItem(item.Id, item.selectedVariant?.Id)}
                    className="p-2 text-red-500 hover:text-red-600"
                    aria-label="Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kampanyalar Bölümü */}
        {eligiblePromotions.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-gray-900">Sepetinize Uygun Kampanyalar</h2>
            </div>

            <div className="space-y-3">
              {eligiblePromotions.map((promo) => {
                const isApplied = appliedCoupon?.Id === promo.Id;
                const discountText = promo.DiscountType === 'percentage' 
                  ? `%${promo.DiscountValue}` 
                  : `${promo.DiscountValue} ₺`;

                return (
                  <div
                    key={promo.Id}
                    className={`bg-white rounded-xl p-4 border-2 transition-all ${
                      isApplied 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-purple-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isApplied ? 'bg-green-100' : 'bg-purple-100'}`}>
                        <Tag className={`w-5 h-5 ${isApplied ? 'text-green-600' : 'text-purple-600'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <h3 className="font-bold text-sm text-gray-900 mb-0.5">
                              {promo.DisplayTitle || promo.Code}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {promo.DisplaySubtitle || promo.Description}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-lg font-black ${isApplied ? 'text-green-600' : 'text-purple-600'}`}>
                              {discountText}
                            </div>
                            <div className="text-[10px] text-gray-500">İndirim</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-100 px-2 py-1 rounded text-[10px] font-mono font-bold text-gray-700">
                              {promo.Code}
                            </div>
                            {promo.MinimumAmount > 0 && (
                              <div className="text-[10px] text-gray-500">
                                Min: {promo.MinimumAmount} ₺
                              </div>
                            )}
                          </div>

                          {isApplied ? (
                            <button
                              onClick={removeCoupon}
                              className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              Kaldır
                            </button>
                          ) : (
                            <button
                              onClick={() => applyCoupon(promo)}
                              className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              Uygula
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sabit alt bar: ara toplam + indirim + devam */}
      <div className="fixed left-0 right-0 bottom-above-nav z-50 safe-area-bottom">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur border-t border-gray-200 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] rounded-none">
            <div className="py-3">
              {/* Uygulanan kupon varsa göster */}
              {appliedCoupon && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Ara Toplam</span>
                    <span className="font-semibold text-gray-900">{totalAmount.toFixed(2)} ₺</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <Tag className="w-4 h-4" />
                      <span className="font-medium">{appliedCoupon.Code}</span>
                    </div>
                    <span className="font-semibold text-green-600">-{discountAmount.toFixed(2)} ₺</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs text-gray-500">
                    {appliedCoupon ? 'Toplam' : 'Ara Toplam'}
                  </div>
                  <div className="text-xl font-bold text-gray-900 tabular-nums whitespace-nowrap">
                    {finalAmount.toFixed(2)} ₺
                  </div>
                </div>
                <button
                  onClick={handleContinue}
                  className="flex-[2] bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-xl font-semibold shadow-lg active:scale-[0.99] whitespace-nowrap"
                >
                  {isAuthenticated ? 'Devam Et' : 'Giriş Yap'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;

