import { useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Gift,
  X,
  Check,
  Tag,
  Package,
} from 'lucide-react';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import EmptyState from '../components/EmptyState';
import ProductDetailModal from '../components/ProductDetailModal';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getActivePromotions, getCrossSellProducts, checkMinimumOrder } from '../services/api';

// Güvenli fiyat formatlama - her türlü edge case'i handle eder
const formatPrice = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

// Güvenli sayı dönüşümü - NaN kontrolü ve 0 korunur
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function Cart() {
  const navigate = useNavigate();
  const { items, increaseQuantity, decreaseQuantity, removeItem, getTotalAmount, addItem, appliedCoupon, applyCoupon: storeApplyCoupon, removeCoupon: storeRemoveCoupon } = useCartStore();
  const { isAuthenticated } = useCustomerStore();
  const [promotions, setPromotions] = useState([]);
  const [crossSellProducts, setCrossSellProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [showPromotionsModal, setShowPromotionsModal] = useState(false);
  const [minimumOrderIssues, setMinimumOrderIssues] = useState([]);
  const [showCouponToast, setShowCouponToast] = useState(false);

  const totalAmount = getTotalAmount();
  
  // Farklı restoranlar var mı kontrol et - useMemo ile optimize et
  // ⚠️ KRİTİK: RestaurantId'leri normalize et (string/number karışıklığı, NaN ve 0 korunur)
  const allRestaurantIds = useMemo(() => {
    return [...new Set(
      items
        .map(i => toNum(i.RestaurantId))
        .filter(n => n !== null) // 0 dahil, sadece null değil
    )];
  }, [items]);
  
  const hasMultipleRestaurants = useMemo(() => allRestaurantIds.length > 1, [allRestaurantIds]);
  
  // Performance optimization: hasMinimumOrderIssue'yu useMemo ile hesapla
  const hasMinimumOrderIssue = useMemo(() => minimumOrderIssues.length > 0, [minimumOrderIssues]);

  // Minimum sipariş butonu metni
  const minimumOrderButtonText = useMemo(() => {
    if (!hasMinimumOrderIssue) {
      return isAuthenticated ? 'Devam Et' : 'Giriş Yap';
    }
    
    const firstIssue = minimumOrderIssues[0];
    const minOrderText = `Minimum ${formatPrice(firstIssue.MinOrder)} ₺ olmalı`;
    const remainingCount = minimumOrderIssues.length - 1;
    
    return remainingCount > 0 
      ? `${minOrderText} (+ ${remainingCount} daha)`
      : minOrderText;
  }, [hasMinimumOrderIssue, minimumOrderIssues, isAuthenticated]);

  // Sepet içeriği için anlamsal hash oluştur
  const itemsHash = useMemo(() => {
    return items.map(item =>
      `${item.Id}:${item.selectedVariant?.Id ?? 0}-${item.quantity}-${Number(item.effectivePrice || 0).toFixed(2)}`
    ).join('|');
  }, [items]);

  // Load fonksiyonları - useEffect'ten ÖNCE tanımlanmalı
  const loadPromotions = useCallback(async () => {
    try {
      const response = await getActivePromotions();
      if (response && response.success && Array.isArray(response.data)) {
        setPromotions(response.data);
      } else {
        setPromotions([]);
      }
    } catch (err) {
      setPromotions([]);
    }
  }, []);

  const loadRestaurantInfo = useCallback(async () => {
    try {
      // ⚠️ KRİTİK: RestaurantId'leri normalize et (NaN ve 0 korunur)
      const restaurantIds = [...new Set(
        items
          .map(i => toNum(i.RestaurantId))
          .filter(n => n !== null) // 0 dahil, sadece null değil
      )];
      if (restaurantIds.length > 0) {
        const response = await checkMinimumOrder(restaurantIds);
        if (response && response.success && Array.isArray(response.data)) {
          setRestaurants(response.data);
        } else {
          setRestaurants([]);
        }
      }
    } catch (err) {
      // Restoran yükleme hatası
      setRestaurants([]);
    }
  }, [items]);

  const loadCrossSellProducts = useCallback(async () => {
    try {
      // Sepetteki restoranları, kategorileri ve ürün ID'lerini al (sadece geçerli ID'ler)
      const validRestaurantIds = items
        .map(item => item.RestaurantId)
        .filter(id => id != null && id !== undefined);
      
      const categoryIds = [...new Set(items.map(item => item.CategoryId).filter(id => id != null && id !== undefined))];
      const productIds = items.map(item => item.Id).filter(id => id != null && id !== undefined);
      
      // En çok ürünü olan restoranı bul (veya ilk restoranı)
      const restaurantCounts = {};
      validRestaurantIds.forEach(id => {
        const nId = toNum(id);
        if (nId !== null) {
          restaurantCounts[nId] = (restaurantCounts[nId] || 0) + 1;
        }
      });
      
      const sortedRestaurants = Object.entries(restaurantCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => toNum(id))
        .filter(n => n !== null); // NaN'ları filtrele
      
      const restaurantIds = sortedRestaurants.length > 0 ? [sortedRestaurants[0]] : [];
      
      
      // Eğer restaurantIds boşsa ama ürün varsa, o ürünlerin RestaurantId'sini backend'den çek
      if (restaurantIds.length === 0 && productIds.length > 0) {
        // Boş cross-sell göster
        setCrossSellProducts([]);
        return;
      }
      
      const response = await getCrossSellProducts(restaurantIds, productIds, categoryIds);
      if (response && response.success && Array.isArray(response.data)) {
        setCrossSellProducts(response.data);
      } else {
        setCrossSellProducts([]);
      }
    } catch (err) {
      setCrossSellProducts([]);
    }
  }, [items]);

  // Kampanyalar - Sadece 1 kere yükle (sepet içeriği değişikliğinden bağımsız)
  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  // Sepet içeriği değiştiğinde yükle (cross-sell ve restoran bilgisi)
  useEffect(() => {
    loadCrossSellProducts();
    loadRestaurantInfo();
  }, [itemsHash, loadCrossSellProducts, loadRestaurantInfo]); // items içeriği ve fonksiyonlar değiştiğinde çalış

  // Restaurants ve items değiştiğinde minimum sipariş kontrolü
  useEffect(() => {
    if (restaurants.length === 0 || items.length === 0) {
      setMinimumOrderIssues([]);
      return;
    }

    // Her restoran için ürün miktarı ve toplam hesapla
    // ⚠️ KRİTİK: RestaurantId'yi normalize et (NaN ve 0 korunur)
    const restaurantTotals = {};
    items.forEach(item => {
      const nId = toNum(item.RestaurantId);
      if (nId !== null) {
        if (!restaurantTotals[nId]) {
          restaurantTotals[nId] = 0;
        }
        restaurantTotals[nId] += (Number(item.effectivePrice) || 0) * (Number(item.quantity) || 0);
      }
    });

    // Her restoranın minimum sipariş kontrolü
    // ⚠️ KRİTİK: restaurant.Id'yi normalize et
    const issues = [];
    restaurants.forEach(restaurant => {
      const minOrderNum = Number(restaurant.MinOrder) || 0;
      if (minOrderNum > 0) {
        const normalizedId = toNum(restaurant.Id);
        const restaurantTotal = normalizedId !== null ? (restaurantTotals[normalizedId] || 0) : 0;
        if (restaurantTotal < minOrderNum) {
          issues.push({
            ...restaurant,
            currentTotal: restaurantTotal,
            MinOrder: minOrderNum
          });
        }
      }
    });

    
    setMinimumOrderIssues(issues);
  }, [restaurants, items]);

  // Sepet değiştiğinde kupon indirimini yeniden hesapla
  useEffect(() => {
    if (appliedCoupon) {
      // Minimum tutar kontrolü
      if (totalAmount < (appliedCoupon.MinimumAmount || 0)) {
        storeRemoveCoupon();
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
      
      // Hesaplanan indirim değiştiyse güncelle (float dalgalanması için tolerans)
      if (Math.abs((appliedCoupon.calculatedDiscount || 0) - newDiscount) > 0.005) {
        storeApplyCoupon({
          ...appliedCoupon,
          calculatedDiscount: newDiscount,
        });
      }
    }
  }, [totalAmount, appliedCoupon, storeApplyCoupon, storeRemoveCoupon]); // ✅ appliedCoupon değiştiğinde de hesapla

  // Modal açıkken body scroll'u engelle
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (showPromotionsModal || showProductModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup
    return () => {
      if (typeof document !== 'undefined') document.body.style.overflow = '';
    };
  }, [showPromotionsModal, showProductModal]);

  // Toast otomatik kapanma
  useEffect(() => {
    if (showCouponToast) {
      const timer = setTimeout(() => {
        setShowCouponToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCouponToast]);

  // Kupon kaldırıldığında toast'ı kapat (race condition guard)
  useEffect(() => {
    if (!appliedCoupon) setShowCouponToast(false);
  }, [appliedCoupon]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCrossSellAddToCart = (e, product) => {
    e.stopPropagation();
    
    // Product formatını kontrol et
    if (!product || !product.Id || !product.Price) {
      return;
    }

    // En çok ürünü olan restoranı bul (veya ilk restoranı)
    const validRestaurantIds = items
      .map(item => toNum(item.RestaurantId))
      .filter(n => n !== null);
    
    const restaurantCounts = {};
    validRestaurantIds.forEach(nId => {
      restaurantCounts[nId] = (restaurantCounts[nId] || 0) + 1;
    });
    
    const sortedRestaurants = Object.entries(restaurantCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => toNum(id))
      .filter(n => n !== null);

    // ⚠️ KRİTİK: Cross-sell ürünlerinde RestaurantId yoksa sepetteki en yaygın restoranı kullan
    const normalizedProduct = {
      ...product,
      effectivePrice: product.effectivePrice ?? product.Price, // effectivePrice yoksa Price kullan
      RestaurantId: product.RestaurantId ?? sortedRestaurants[0] ?? null, // RestaurantId yoksa fallback
    };
    
    addItem(normalizedProduct);
  };

  const handleCrossSellClick = (product) => {
    handleProductClick(product);
  };

  // Sepet tutarına uygun kampanyaları filtrele
  const eligiblePromotions = useMemo(
    () => promotions.filter(promo => totalAmount >= (Number(promo.MinimumAmount) || 0)),
    [promotions, totalAmount]
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

    storeApplyCoupon({
      ...coupon,
      calculatedDiscount: discountAmount,
    });
    
    // Toast göster
    setShowCouponToast(true);
  };

  // Kupon kaldır
  const removeCoupon = () => {
    storeRemoveCoupon();
  };

  const discountAmount = appliedCoupon?.calculatedDiscount || 0;
  const finalAmount = Math.max(0, Number(totalAmount) - Number(discountAmount || 0));

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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50">
      {/* İçerik alanı */}
      <div
        className="w-full max-w-full sm:max-w-[95%] lg:max-w-[90%] xl:max-w-4xl mx-auto px-2 sm:px-3 lg:px-4 pb-24 sm:pb-28 relative z-10 pt-2 sm:pt-3 lg:pt-4"
      >
        {/* Minimum Sipariş Uyarısı */}
        {hasMinimumOrderIssue && (
          <div className="mb-2 sm:mb-3 flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl bg-orange-500/10 border border-orange-400/30 p-2 sm:p-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-[13px] leading-snug text-orange-800 flex-1 min-w-0">
              <div className="font-semibold text-orange-800 mb-1">Minimum sipariş tutarına ulaşılmadı</div>
              {minimumOrderIssues.map((restaurant, idx) => (
                <div key={idx} className="text-orange-700/80">
                  {restaurant.Name}: Min {formatPrice(restaurant.MinOrder)} ₺ · Eksik {formatPrice(Math.max(0, Number(restaurant.MinOrder) - Number(restaurant.currentTotal || 0)))} ₺
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Farklı Restoran Uyarısı */}
        {hasMultipleRestaurants && (
          <div className="mb-2 sm:mb-3 flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl bg-yellow-500/10 border border-yellow-400/30 p-2 sm:p-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-[11px] sm:text-xs leading-snug text-yellow-900">
              <div className="font-semibold text-yellow-900 mb-0.5 sm:mb-1">Farklı restorandan ürünleriniz var</div>
              <div className="text-[10px] text-yellow-800/80">
                Sepetinizde <strong>{allRestaurantIds.length} farklı restoran</strong> var. Sipariş tamamlandığında her restoran için ayrı sipariş oluşturulacaktır.
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-2 sm:p-3 lg:p-4">
          <div className="space-y-2 sm:space-y-3">
            {items.map((item) => (
              <div
                key={`${item.Id}:${item.selectedVariant?.Id ?? 0}`}
                className="bg-gray-50/70 rounded-lg sm:rounded-xl border border-gray-200 p-2 sm:p-3 flex items-start gap-2 sm:gap-3 shadow-sm"
              >
                {/* Görsel kutusu */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.ImageUrl ? (
                    <img
                      src={item.ImageUrl}
                      alt={item.Name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                {/* Ürün bilgisi */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                    {item.Name}
                  </div>

                  <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                    {formatPrice(item.effectivePrice)} ₺ / adet
                  </div>

                  <div className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums mt-0.5 sm:mt-1">
                    {formatPrice(item.effectivePrice * item.quantity)} ₺
                  </div>
                </div>

                {/* Stepper + sil */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center bg-white rounded-full border border-gray-200 px-2 py-1 shadow-sm">
                    <button
                      onClick={() => decreaseQuantity(item.Id, item.selectedVariant?.Id)}
                      disabled={item.quantity <= 1}
                      className="p-1 active:scale-95 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      aria-label="Miktarı azalt"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="text-[13px] font-bold text-gray-900 w-6 text-center tabular-nums">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increaseQuantity(item.Id, item.selectedVariant?.Id)}
                      disabled={item.quantity >= 10}
                      className="p-1 active:scale-95 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      aria-label="Miktarı artır"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.Id, item.selectedVariant?.Id)}
                    className="text-[12px] text-red-500 hover:text-red-600 active:scale-95"
                    aria-label="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross Sell Bölümü */}
        {crossSellProducts.length > 0 && (
          <div className="mt-4 sm:mt-6 lg:mt-8">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 px-1">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <h2 className="text-xs sm:text-sm font-semibold text-gray-800">Bir de bunlar gider 📦</h2>
            </div>

            <div className="flex gap-2 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 sm:-mx-4 px-2 sm:px-4 scrollbar-hide">
              {crossSellProducts.map((product) => (
                <div
                  key={product.Id}
                  onClick={() => handleCrossSellClick(product)}
                  className="snap-start w-[28%] sm:w-[140px] flex-shrink-0 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-md p-2 sm:p-3 active:scale-[0.98] transition cursor-pointer"
                >
                  <div className="relative w-full h-[70px] sm:h-[90px] rounded-lg bg-gray-50 border border-gray-200 overflow-hidden mb-1.5 sm:mb-2 flex items-center justify-center">
                    {product.ImageUrl ? (
                      <img
                        src={product.ImageUrl}
                        alt={product.Name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
                    )}

                    <button
                      onClick={(e) => handleCrossSellAddToCart(e, product)}
                      className="absolute bottom-1 right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-600 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shadow-lg active:scale-95"
                      aria-label="Ekle"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  <div className="text-[10px] sm:text-xs font-medium text-gray-900 leading-tight line-clamp-2 min-h-[28px] sm:min-h-[32px]">
                    {product.Name}
                  </div>

                  <div className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums mt-0.5 sm:mt-1">
                    {formatPrice(product.effectivePrice ?? product.Price)} ₺
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Kampanyalar Modal - Tamamen Yeni Tasarım */}
      {showPromotionsModal && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
          <div className="h-full flex flex-col">
            {/* Header - Gradient */}
            <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white px-4 pt-12 pb-6">
              <button
                onClick={() => setShowPromotionsModal(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 supports-[backdrop-filter]:backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white/20 supports-[backdrop-filter]:backdrop-blur-sm flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black leading-tight">Kampanyalar</h2>
                  <p className="text-sm text-white/80">{eligiblePromotions.length} fırsat seni bekliyor</p>
                </div>
              </div>
            </div>

            {/* Kampanya Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 -mt-4">
              <div className="grid grid-cols-2 gap-3">
                {eligiblePromotions.map((promo) => {
                  const isApplied = appliedCoupon?.Id === promo.Id;
                  const discountText = promo.DiscountType === 'percentage' 
                    ? `%${promo.DiscountValue}` 
                    : `${promo.DiscountValue} ₺`;

                  return (
                    <button
                      key={promo.Id}
                      onClick={() => {
                        if (!isApplied) {
                          applyCoupon(promo);
                          setShowPromotionsModal(false);
                        }
                      }}
                      className={`group relative overflow-hidden rounded-3xl aspect-square p-4 flex flex-col justify-between text-left transition-all active:scale-95 ${
                        isApplied 
                          ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-2xl' 
                          : 'bg-white shadow-lg border border-gray-200'
                      }`}
                    >
                      {/* Corner Badge */}
                      {isApplied && (
                        <div className="absolute top-2 right-2">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 flex flex-col">
                        <div className={`text-4xl font-black mb-3 ${isApplied ? 'text-white' : 'text-purple-600'}`}>
                          {discountText}
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-end">
                          <div className={`text-sm font-bold mb-1 line-clamp-2 ${isApplied ? 'text-white' : 'text-gray-900'}`} style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {promo.DisplayTitle || promo.Code}
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom Code */}
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <div className={`text-[10px] font-black font-mono ${isApplied ? 'text-white/80' : 'text-gray-600'}`}>
                          {promo.Code}
                        </div>
                      </div>
                      
                      {/* Glow Effect */}
                      {!isApplied && (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-pink-400/0 to-orange-400/0 group-hover:from-purple-400/20 group-hover:via-pink-400/10 group-hover:to-orange-400/20 transition-all pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kampanya Uygulandı Toast */}
      {showCouponToast && appliedCoupon && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-2xl border-2 border-green-400 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="w-12 h-12 rounded-full bg-white/20 supports-[backdrop-filter]:backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-black text-base mb-0.5">Kampanya Uygulandı!</div>
                <div className="text-sm text-white/90 font-semibold">{appliedCoupon.Code}</div>
                {appliedCoupon.calculatedDiscount && (
                  <div className="text-xs text-white/80 mt-0.5">
                    {formatPrice(appliedCoupon.calculatedDiscount)} ₺ indirim
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowCouponToast(false)}
                className="w-8 h-8 rounded-full bg-white/20 supports-[backdrop-filter]:backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all flex-shrink-0"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sabit alt bar: ara toplam + indirim + devam - Modal açıkken gizle */}
      {!showProductModal && !showPromotionsModal && (
        <div className="fixed left-0 right-0 bottom-0 z-50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
        <div className="mx-auto w-full max-w-full sm:max-w-[95%] lg:max-w-[90%] xl:max-w-4xl px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200">
            <div className="p-2 sm:p-3 lg:p-4">
              {/* Uygulanan kupon varsa göster */}
              {appliedCoupon && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-0.5 sm:mb-1">
                    <span className="text-gray-600">Ara Toplam</span>
                    <span className="font-semibold text-gray-900">{formatPrice(totalAmount)} ₺</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="font-medium">{appliedCoupon.Code}</span>
                    </div>
                    <span className="font-semibold text-green-600">-{formatPrice(discountAmount)} ₺</span>
                  </div>
                </div>
              )}

              {/* Kampanya Butonu */}
              {eligiblePromotions.length > 0 && (
                <button
                  onClick={() => setShowPromotionsModal(true)}
                  className="w-full py-2 sm:py-2.5 lg:py-3 mb-2 sm:mb-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg active:scale-[0.98] transition-all duration-150 font-bold text-xs sm:text-sm hover:from-purple-600 hover:to-purple-700"
                >
                  <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Kampanyaları Gör ({eligiblePromotions.length})
                </button>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    {appliedCoupon ? 'Toplam' : 'Ara Toplam'}
                  </div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 tabular-nums whitespace-nowrap">
                    {formatPrice(finalAmount)} ₺
                  </div>
                </div>
                <button
                  onClick={handleContinue}
                  disabled={hasMinimumOrderIssue}
                  className={`flex-1 py-2.5 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-5 rounded-full flex items-center justify-center active:scale-[0.98] transition-all duration-150 min-w-0 font-black text-xs sm:text-sm lg:text-base ${
                    hasMinimumOrderIssue
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.6)]'
                  }`}
                >
                  {minimumOrderButtonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default Cart;

