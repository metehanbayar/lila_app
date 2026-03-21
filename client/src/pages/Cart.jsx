import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Gift,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ProductDetailModal from '../components/ProductDetailModal';
import {
  getActivePromotions,
  getCrossSellProducts,
  checkMinimumOrder,
} from '../services/api';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import {
  Badge,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  StickyActionBar,
  SurfaceCard,
  cn,
} from '../components/ui/primitives';

const formatPrice = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

const toNum = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

function SummaryPanel({
  totalAmount,
  discountAmount,
  finalAmount,
  eligiblePromotions,
  appliedCoupon,
  onOpenPromotions,
  onRemoveCoupon,
  showContinue,
  onContinue,
  hasMinimumOrderIssue,
  minimumOrderButtonText,
}) {
  return (
    <SurfaceCard tone="muted" className="space-y-4 p-4 sm:p-5">
      <div className="space-y-2">
        <span className="gm-eyebrow">Siparis ozeti</span>
        <h2 className="text-2xl font-bold text-dark sm:text-3xl">Toplam akisi net</h2>
        <p className="text-sm leading-6 text-dark-lighter">
          Kupon, indirim ve devam aksiyonu ayni blokta toplandi.
        </p>
      </div>

      {eligiblePromotions.length > 0 && (
        <button
          onClick={onOpenPromotions}
          className="group flex w-full items-center justify-between rounded-[24px] border border-primary/15 bg-white px-4 py-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary text-white shadow-lg shadow-primary/20">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-dark">Uygun kampanyalar</p>
              <p className="text-sm text-dark-lighter">{eligiblePromotions.length} secenek aktif</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      <div className="rounded-[24px] border border-white/70 bg-white px-4 py-4 shadow-card">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-dark-lighter">Ara toplam</span>
            <span className="font-bold text-dark">{formatPrice(totalAmount)} TL</span>
          </div>

          {appliedCoupon && (
            <>
              <div className="flex items-center justify-between gap-3 text-green-700">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-semibold">{appliedCoupon.Code}</span>
                </div>
                <span className="font-bold">-{formatPrice(discountAmount)} TL</span>
              </div>
              <button
                onClick={onRemoveCoupon}
                className="text-xs font-bold text-dark-lighter transition-colors hover:text-dark"
              >
                Kuponu kaldir
              </button>
            </>
          )}

          <div className="h-px bg-surface-border" />

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-dark">Genel toplam</span>
            <span className="text-2xl font-black text-primary-dark">{formatPrice(finalAmount)} TL</span>
          </div>
        </div>
      </div>

      {showContinue && (
        <PrimaryButton
          className={cn('w-full justify-center', hasMinimumOrderIssue && 'cursor-not-allowed opacity-60')}
          onClick={onContinue}
          disabled={hasMinimumOrderIssue}
        >
          {minimumOrderButtonText}
          {!hasMinimumOrderIssue && <ArrowRight className="h-4 w-4" />}
        </PrimaryButton>
      )}
    </SurfaceCard>
  );
}

function Cart() {
  const navigate = useNavigate();
  const {
    items,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    getTotalAmount,
    addItem,
    appliedCoupon,
    applyCoupon: storeApplyCoupon,
    removeCoupon: storeRemoveCoupon,
  } = useCartStore();
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

  const allRestaurantIds = useMemo(
    () =>
      [
        ...new Set(
          items
            .map((item) => toNum(item.RestaurantId))
            .filter((num) => num !== null),
        ),
      ],
    [items],
  );

  const hasMultipleRestaurants = useMemo(() => allRestaurantIds.length > 1, [allRestaurantIds]);
  const hasMinimumOrderIssue = useMemo(() => minimumOrderIssues.length > 0, [minimumOrderIssues]);

  const minimumOrderButtonText = useMemo(() => {
    if (!hasMinimumOrderIssue) {
      return isAuthenticated ? 'Checkouta devam et' : 'Giris yap';
    }

    const firstIssue = minimumOrderIssues[0];
    const minOrderText = `Minimum ${formatPrice(firstIssue.MinOrder)} TL olmali`;
    const remainingCount = minimumOrderIssues.length - 1;

    return remainingCount > 0 ? `${minOrderText} (+${remainingCount})` : minOrderText;
  }, [hasMinimumOrderIssue, minimumOrderIssues, isAuthenticated]);

  const itemsHash = useMemo(
    () =>
      items
        .map(
          (item) =>
            `${item.Id}:${item.selectedVariant?.Id ?? 0}-${item.quantity}-${Number(
              item.effectivePrice || 0,
            ).toFixed(2)}`,
        )
        .join('|'),
    [items],
  );

  const loadPromotions = useCallback(async () => {
    try {
      const response = await getActivePromotions();
      setPromotions(response?.success && Array.isArray(response.data) ? response.data : []);
    } catch {
      setPromotions([]);
    }
  }, []);

  const loadRestaurantInfo = useCallback(async () => {
    try {
      const restaurantIds = [
        ...new Set(
          items
            .map((item) => toNum(item.RestaurantId))
            .filter((num) => num !== null),
        ),
      ];

      if (restaurantIds.length > 0) {
        const response = await checkMinimumOrder(restaurantIds);
        if (response?.success && Array.isArray(response.data)) {
          setRestaurants(response.data);
        } else {
          setRestaurants([]);
        }
      }
    } catch {
      setRestaurants([]);
    }
  }, [items]);

  const loadCrossSellProducts = useCallback(async () => {
    try {
      const validRestaurantIds = items
        .map((item) => item.RestaurantId)
        .filter((id) => id != null && id !== undefined);
      const categoryIds = [...new Set(items.map((item) => item.CategoryId).filter((id) => id != null && id !== undefined))];
      const productIds = items.map((item) => item.Id).filter((id) => id != null && id !== undefined);

      const restaurantCounts = {};
      validRestaurantIds.forEach((id) => {
        const normalizedId = toNum(id);
        if (normalizedId !== null) {
          restaurantCounts[normalizedId] = (restaurantCounts[normalizedId] || 0) + 1;
        }
      });

      const sortedRestaurants = Object.entries(restaurantCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => toNum(id))
        .filter((num) => num !== null);

      const restaurantIds = sortedRestaurants.length > 0 ? [sortedRestaurants[0]] : [];

      if (restaurantIds.length === 0 && productIds.length > 0) {
        setCrossSellProducts([]);
        return;
      }

      const response = await getCrossSellProducts(restaurantIds, productIds, categoryIds);
      setCrossSellProducts(response?.success && Array.isArray(response.data) ? response.data : []);
    } catch {
      setCrossSellProducts([]);
    }
  }, [items]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  useEffect(() => {
    loadCrossSellProducts();
    loadRestaurantInfo();
  }, [itemsHash, loadCrossSellProducts, loadRestaurantInfo]);

  useEffect(() => {
    if (restaurants.length === 0 || items.length === 0) {
      setMinimumOrderIssues([]);
      return;
    }

    const restaurantTotals = {};
    items.forEach((item) => {
      const normalizedId = toNum(item.RestaurantId);
      if (normalizedId !== null) {
        if (!restaurantTotals[normalizedId]) {
          restaurantTotals[normalizedId] = 0;
        }
        restaurantTotals[normalizedId] += (Number(item.effectivePrice) || 0) * (Number(item.quantity) || 0);
      }
    });

    const issues = [];
    restaurants.forEach((restaurant) => {
      const minOrderNum = Number(restaurant.MinOrder) || 0;
      if (minOrderNum > 0) {
        const normalizedId = toNum(restaurant.Id);
        const restaurantTotal = normalizedId !== null ? restaurantTotals[normalizedId] || 0 : 0;
        if (restaurantTotal < minOrderNum) {
          issues.push({
            ...restaurant,
            currentTotal: restaurantTotal,
            MinOrder: minOrderNum,
          });
        }
      }
    });

    setMinimumOrderIssues(issues);
  }, [restaurants, items]);

  useEffect(() => {
    if (appliedCoupon) {
      if (totalAmount < (appliedCoupon.MinimumAmount || 0)) {
        storeRemoveCoupon();
        return;
      }

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

      if (Math.abs((appliedCoupon.calculatedDiscount || 0) - newDiscount) > 0.005) {
        storeApplyCoupon({
          ...appliedCoupon,
          calculatedDiscount: newDiscount,
        });
      }
    }
  }, [totalAmount, appliedCoupon, storeApplyCoupon, storeRemoveCoupon]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.style.overflow =
      showPromotionsModal || showProductModal ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [showPromotionsModal, showProductModal]);

  useEffect(() => {
    if (!showCouponToast) return undefined;
    const timer = setTimeout(() => {
      setShowCouponToast(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showCouponToast]);

  useEffect(() => {
    if (!appliedCoupon) {
      setShowCouponToast(false);
    }
  }, [appliedCoupon]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCrossSellAddToCart = (e, product) => {
    e.stopPropagation();

    if (!product || !product.Id || !product.Price) {
      return;
    }

    const validRestaurantIds = items
      .map((item) => toNum(item.RestaurantId))
      .filter((num) => num !== null);

    const restaurantCounts = {};
    validRestaurantIds.forEach((num) => {
      restaurantCounts[num] = (restaurantCounts[num] || 0) + 1;
    });

    const sortedRestaurants = Object.entries(restaurantCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => toNum(id))
      .filter((num) => num !== null);

    addItem(
      {
        ...product,
        effectivePrice: product.effectivePrice ?? product.Price,
        RestaurantId: product.RestaurantId ?? sortedRestaurants[0] ?? null,
      },
      null,
      1,
    );
  };

  const eligiblePromotions = useMemo(
    () => promotions.filter((promo) => totalAmount >= (Number(promo.MinimumAmount) || 0)),
    [promotions, totalAmount],
  );

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

    setShowCouponToast(true);
  };

  const discountAmount = appliedCoupon?.calculatedDiscount || 0;
  const finalAmount = Math.max(0, Number(totalAmount) - Number(discountAmount || 0));

  const handleContinue = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Sepetiniz Bos"
        message="Henuz sepetinize urun eklemediniz. Lezzetli menuye goz atin."
        actionText="Menuye Git"
        actionPath="/"
      />
    );
  }

  return (
    <div className="pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] pt-4 sm:pt-6 lg:pb-12">
      <PageShell width="full" className="space-y-6 sm:space-y-7">
        <SurfaceCard tone="hero" className="overflow-hidden p-6 sm:p-7 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px] lg:items-end">
            <div className="space-y-4">
              <Badge className="border border-white/20 bg-white/10 text-white">
                <Sparkles className="h-3 w-3" />
                Sepetiniz hazir
              </Badge>
              <div className="space-y-3">
                <h1 className="font-display text-4xl leading-none sm:text-5xl lg:text-6xl">
                  Siparisinizi son kez gozden gecirin.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
                  Mobile first sepet akisi; net uyarilar, ferah kartlar ve desktopta sticky ozet panel ile yeniden kuruldu.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/62">Kalem</p>
                <p className="mt-2 text-3xl font-black">{items.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/62">Restoran</p>
                <p className="mt-2 text-3xl font-black">{allRestaurantIds.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/62">Toplam</p>
                <p className="mt-2 text-3xl font-black">{formatPrice(finalAmount)} TL</p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-3">
          {hasMinimumOrderIssue && (
            <SurfaceCard className="border border-amber-200 bg-amber-50 p-4 shadow-none">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-950">Minimum siparis tutarina ulasilmadi</p>
                  {minimumOrderIssues.map((restaurant) => (
                    <p key={restaurant.Id} className="text-sm leading-6 text-amber-900/82">
                      {restaurant.Name}: min {formatPrice(restaurant.MinOrder)} TL, eksik{' '}
                      {formatPrice(Math.max(0, Number(restaurant.MinOrder) - Number(restaurant.currentTotal || 0)))} TL
                    </p>
                  ))}
                </div>
              </div>
            </SurfaceCard>
          )}

          {hasMultipleRestaurants && (
            <SurfaceCard className="border border-blue-200 bg-blue-50 p-4 shadow-none">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <Store className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-950">Farkli restoranlardan urun var</p>
                  <p className="text-sm leading-6 text-blue-900/82">
                    Bu sepet icin {allRestaurantIds.length} farkli restoran adina ayri siparis kaydi olusturulacak.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          )}
        </div>

        <div className="xl:hidden">
          <SummaryPanel
            totalAmount={totalAmount}
            discountAmount={discountAmount}
            finalAmount={finalAmount}
            eligiblePromotions={eligiblePromotions}
            appliedCoupon={appliedCoupon}
            onOpenPromotions={() => setShowPromotionsModal(true)}
            onRemoveCoupon={storeRemoveCoupon}
            showContinue={false}
            onContinue={handleContinue}
            hasMinimumOrderIssue={hasMinimumOrderIssue}
            minimumOrderButtonText={minimumOrderButtonText}
          />
        </div>
      </PageShell>
      <PageShell width="full" className="mt-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),360px] xl:items-start">
          <div className="space-y-5">
            <SurfaceCard className="overflow-hidden p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Sepettekiler</p>
                  <h2 className="mt-2 text-2xl font-bold text-dark">Secimleriniz</h2>
                </div>
                <Badge tone="primary">{items.length} kalem</Badge>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={`${item.Id}:${item.selectedVariant?.Id ?? 0}`}
                    className="rounded-[26px] border border-surface-border bg-surface-muted p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[22px] bg-white shadow-sm">
                        {item.ImageUrl ? (
                          <img src={item.ImageUrl} alt={item.Name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]">
                            <Package className="h-7 w-7 text-primary/40" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="space-y-1">
                          <h3 className="line-clamp-2 text-base font-bold text-dark">{item.Name}</h3>
                          {item.selectedVariant?.Name && (
                            <p className="text-sm text-dark-lighter">{item.selectedVariant.Name}</p>
                          )}
                          <p className="text-sm font-medium text-dark-lighter">
                            {formatPrice(item.effectivePrice)} TL / adet
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white px-2 py-2 shadow-sm">
                            <button
                              onClick={() => decreaseQuantity(item.Id, item.selectedVariant?.Id)}
                              disabled={item.quantity <= 1}
                              className="rounded-full p-1.5 text-dark transition-all hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Miktari azalt"
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <span className="w-7 text-center text-sm font-black text-dark">{item.quantity}</span>

                            <button
                              onClick={() => increaseQuantity(item.Id, item.selectedVariant?.Id)}
                              disabled={item.quantity >= 10}
                              className="rounded-full p-1.5 text-dark transition-all hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Miktari artir"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-primary-dark">
                              {formatPrice(item.effectivePrice * item.quantity)} TL
                            </span>
                            <button
                              onClick={() => removeItem(item.Id, item.selectedVariant?.Id)}
                              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition-all hover:bg-red-100"
                              aria-label="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                              Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </SurfaceCard>

            {crossSellProducts.length > 0 && (
              <SurfaceCard tone="muted" className="overflow-hidden p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Tamamlayici secimler</p>
                    <h2 className="mt-2 text-2xl font-bold text-dark">Bir de bunlar gider</h2>
                  </div>
                  <Badge tone="warning">{crossSellProducts.length} onerilen</Badge>
                </div>

                <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                  {crossSellProducts.map((product) => (
                    <button
                      key={product.Id}
                      onClick={() => handleProductClick(product)}
                      className="group w-[220px] shrink-0 overflow-hidden rounded-[28px] border border-white/70 bg-white text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                    >
                      <div className="relative h-36 overflow-hidden bg-surface-muted">
                        {product.ImageUrl ? (
                          <img
                            src={product.ImageUrl}
                            alt={product.Name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]">
                            <Package className="h-7 w-7 text-primary/40" />
                          </div>
                        )}

                        <button
                          onClick={(e) => handleCrossSellAddToCart(e, product)}
                          className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 transition-transform hover:scale-105"
                          aria-label="Urunu ekle"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-2 p-4">
                        <p className="line-clamp-2 text-sm font-bold leading-6 text-dark">{product.Name}</p>
                        <p className="text-lg font-black text-primary-dark">
                          {formatPrice(product.effectivePrice ?? product.Price)} TL
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </SurfaceCard>
            )}
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <SummaryPanel
                totalAmount={totalAmount}
                discountAmount={discountAmount}
                finalAmount={finalAmount}
                eligiblePromotions={eligiblePromotions}
                appliedCoupon={appliedCoupon}
                onOpenPromotions={() => setShowPromotionsModal(true)}
                onRemoveCoupon={storeRemoveCoupon}
                showContinue
                onContinue={handleContinue}
                hasMinimumOrderIssue={hasMinimumOrderIssue}
                minimumOrderButtonText={minimumOrderButtonText}
              />

              <SurfaceCard className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Not</p>
                <p className="mt-3 text-sm leading-6 text-dark-lighter">
                  Farkli restoranli sepetler checkoutta ayri siparislere donusur. Minimum siparis uyarilari burada sabit kalir.
                </p>
              </SurfaceCard>
            </div>
          </div>
        </div>
      </PageShell>
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

      {showPromotionsModal && (
        <div className="fixed inset-0 z-[100] bg-dark/70 backdrop-blur-md">
          <button
            className="absolute inset-0 cursor-default"
            onClick={() => setShowPromotionsModal(false)}
            aria-label="Kampanya modali kapat"
          />

          <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-none border border-white/10 bg-[#f8f2ee] shadow-premium sm:mt-8 sm:h-[calc(100vh-4rem)] sm:rounded-[32px]">
            <div className="border-b border-surface-border bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="gm-eyebrow">Kampanyalar</span>
                  <div>
                    <h3 className="gm-display text-3xl sm:text-4xl">Size uygun teklifler</h3>
                    <p className="mt-2 text-sm leading-6 text-dark-lighter">
                      Sepet tutarina gore aktif olan kampanyalari tek grid icinde gosteriyoruz.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPromotionsModal(false)}
                  className="rounded-2xl bg-surface-muted p-3 text-dark transition-all hover:bg-white hover:shadow-card"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {eligiblePromotions.map((promo) => {
                  const isApplied = appliedCoupon?.Id === promo.Id;
                  const discountText =
                    promo.DiscountType === 'percentage'
                      ? `%${promo.DiscountValue}`
                      : `${promo.DiscountValue} TL`;

                  return (
                    <button
                      key={promo.Id}
                      onClick={() => {
                        if (!isApplied) {
                          applyCoupon(promo);
                          setShowPromotionsModal(false);
                        }
                      }}
                      className={cn(
                        'group relative overflow-hidden rounded-[30px] border p-5 text-left transition-all duration-200',
                        isApplied
                          ? 'border-primary/20 bg-primary text-white shadow-[0_26px_70px_rgba(109,54,95,0.24)]'
                          : 'border-white/70 bg-white shadow-card hover:-translate-y-0.5 hover:shadow-card-hover',
                      )}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_26%)]" />
                      <div className="relative flex h-full flex-col justify-between gap-5">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <Badge className={isApplied ? 'border border-white/20 bg-white/12 text-white' : ''}>
                              {isApplied ? 'Uygulandi' : 'Aktif teklif'}
                            </Badge>
                            {isApplied && <Check className="h-5 w-5" />}
                          </div>

                          <div>
                            <p className={cn('text-4xl font-black', isApplied ? 'text-white' : 'text-primary-dark')}>
                              {discountText}
                            </p>
                            <p className={cn('mt-3 text-base font-bold', isApplied ? 'text-white' : 'text-dark')}>
                              {promo.DisplayTitle || promo.Code}
                            </p>
                            <p className={cn('mt-2 text-sm leading-6', isApplied ? 'text-white/76' : 'text-dark-lighter')}>
                              {promo.Description || 'Sepet tutarina uygun aninda kullanilabilir indirim.'}
                            </p>
                          </div>
                        </div>

                        <div className={cn('text-[11px] font-black uppercase tracking-[0.22em]', isApplied ? 'text-white/70' : 'text-primary')}>
                          {promo.Code}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCouponToast && appliedCoupon && (
        <div className="fixed left-1/2 top-4 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div className="rounded-[26px] border border-green-200 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-green-600 text-white shadow-lg shadow-green-600/20">
                <Check className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-dark">Kampanya uygulandi</p>
                <p className="mt-1 text-sm text-dark-lighter">{appliedCoupon.Code}</p>
                <p className="mt-1 text-sm font-semibold text-green-700">
                  {formatPrice(appliedCoupon.calculatedDiscount)} TL indirim
                </p>
              </div>
              <button
                onClick={() => setShowCouponToast(false)}
                className="rounded-full p-1 text-dark-lighter transition-colors hover:text-dark"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!showProductModal && !showPromotionsModal && (
        <div className="fixed inset-x-0 bottom-0 z-50 xl:hidden">
          <PageShell width="full" className="pb-3">
            <StickyActionBar>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {eligiblePromotions.length > 0 && (
                  <SecondaryButton className="w-full justify-center sm:w-auto" onClick={() => setShowPromotionsModal(true)}>
                    <Gift className="h-4 w-4" />
                    Kampanyalar
                  </SecondaryButton>
                )}

                <div className="flex flex-1 items-center justify-between gap-4 rounded-[20px] bg-white/72 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Toplam</p>
                    <p className="text-xl font-black text-primary-dark">{formatPrice(finalAmount)} TL</p>
                  </div>

                  <PrimaryButton
                    className={cn('justify-center', hasMinimumOrderIssue && 'cursor-not-allowed opacity-60')}
                    onClick={handleContinue}
                    disabled={hasMinimumOrderIssue}
                  >
                    {minimumOrderButtonText}
                    {!hasMinimumOrderIssue && <ArrowRight className="h-4 w-4" />}
                  </PrimaryButton>
                </div>
              </div>
            </StickyActionBar>
          </PageShell>
        </div>
      )}
    </div>
  );
}

export default Cart;
