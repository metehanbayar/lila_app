import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Minus, Package, Plus, ShoppingCart, Store, Tag } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import ProductDetailModal from '../components/ProductDetailModal';
import Reveal from '../components/ui/Reveal';
import { checkMinimumOrder, getActivePromotions, getCrossSellProducts } from '../services/api';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { showSingleAddSuccess } from '../utils/addToCartFeedback';
import { getProductListImage } from '../utils/imageVariants';
import { preloadImages } from '../utils/pagePreload';
import { Badge, Chip, PageShell, PrimaryButton, StickyActionBar, SurfaceCard, cn } from '../components/ui/primitives';

const formatPrice = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

const toNum = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

function CartItemCard({ item, increaseQuantity, decreaseQuantity, removeItem }) {
  const itemImageUrl = getProductListImage(item);

  return (
    <article className="w-full max-w-full overflow-hidden rounded-[24px] border border-surface-border bg-surface-muted p-3 sm:p-4">
      <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-white shadow-sm sm:h-[92px] sm:w-[92px]">
          {itemImageUrl ? (
            <img src={itemImageUrl} alt={item.Name} className="h-full w-full object-cover" loading="eager" decoding="async" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]">
              <Package className="h-6 w-6 text-primary/40" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="space-y-1">
            <h3 className="break-words text-sm font-bold leading-6 text-dark sm:text-base">{item.Name}</h3>
            {item.selectedVariant?.Name && <p className="break-words text-sm leading-5 text-dark-lighter">{item.selectedVariant.Name}</p>}
            <p className="text-sm font-medium text-dark-lighter">{formatPrice(item.effectivePrice)} TL / adet</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid w-full max-w-full gap-3 rounded-[20px] border border-surface-border/70 bg-white/72 px-3 py-3">
        <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-white/80 bg-white px-2 py-2 shadow-sm">
            <button
              type="button"
              onClick={() => decreaseQuantity(item.Id, item.selectedVariant?.Id)}
              disabled={item.quantity <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-full text-dark disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-7 text-center text-sm font-black text-dark">{item.quantity}</span>
            <button
              type="button"
              onClick={() => increaseQuantity(item.Id, item.selectedVariant?.Id)}
              disabled={item.quantity >= 10}
              className="flex h-10 w-10 items-center justify-center rounded-full text-dark disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </button>
        </div>

        <span className="text-xl font-black text-primary-dark">{formatPrice(item.effectivePrice * item.quantity)} TL</span>

        <button
          type="button"
          onClick={() => removeItem(item.Id, item.selectedVariant?.Id)}
          className="mt-3 inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-[#c84747] px-3 py-2.5 text-sm font-bold tracking-[0.01em] text-white transition-transform duration-200 hover:-translate-y-0.5"
          style={{ WebkitTextFillColor: '#ffffff' }}
        >
          Sepetten kaldir
        </button>
      </div>
    </article>
  );
}

function SummaryPanel({
  totalAmount,
  discountAmount,
  finalAmount,
  eligiblePromotions,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  showButton,
  onContinue,
  disabled,
  buttonText,
}) {
  return (
    <SurfaceCard className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Toplam</p>
          <p className="mt-1 text-2xl font-black text-dark">{formatPrice(finalAmount)} TL</p>
        </div>
        {appliedCoupon && <Badge tone="success">{appliedCoupon.Code}</Badge>}
      </div>

      <div className="rounded-[22px] bg-surface-muted px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-dark-lighter">Ara toplam</span>
          <span className="font-bold text-dark">{formatPrice(totalAmount)} TL</span>
        </div>
        {discountAmount > 0 && (
          <div className="mt-2 flex items-center justify-between gap-3 text-green-700">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Tag className="h-4 w-4" />
              Indirim
            </span>
            <span className="font-bold">-{formatPrice(discountAmount)} TL</span>
          </div>
        )}
      </div>

      {eligiblePromotions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-dark-lighter">Uygun kampanyalar</p>
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {eligiblePromotions.slice(0, 4).map((promo) => {
              const active = appliedCoupon?.Id === promo.Id;
              return (
                <Chip
                  key={promo.Id}
                  active={active}
                  className={cn('shrink-0 px-4 py-2.5', active && 'text-white')}
                  onClick={() => {
                    if (active) {
                      onRemoveCoupon();
                    } else {
                      onApplyCoupon(promo);
                    }
                  }}
                >
                  {promo.Code}
                </Chip>
              );
            })}
          </div>
        </div>
      )}

      {showButton && (
        <PrimaryButton className={cn('w-full justify-center', disabled && 'cursor-not-allowed opacity-60')} onClick={onContinue} disabled={disabled}>
          {buttonText}
          {!disabled && <ArrowRight className="h-4 w-4" />}
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
  const [restaurants, setRestaurants] = useState([]);
  const [minimumOrderIssues, setMinimumOrderIssues] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pageReady, setPageReady] = useState(() => items.length === 0);
  const [crossSellResolved, setCrossSellResolved] = useState(() => items.length === 0);
  const initialAssetsReadyRef = useRef(items.length === 0);

  const totalAmount = getTotalAmount();

  const allRestaurantIds = useMemo(
    () => [...new Set(items.map((item) => toNum(item.RestaurantId)).filter((num) => num !== null))],
    [items],
  );
  const hasMultipleStores = allRestaurantIds.length > 1;
  const hasMinimumOrderIssue = minimumOrderIssues.length > 0;

  const itemsHash = useMemo(
    () => items.map((item) => `${item.Id}:${item.selectedVariant?.Id ?? 0}-${item.quantity}-${Number(item.effectivePrice || 0).toFixed(2)}`).join('|'),
    [items],
  );

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const response = await getActivePromotions();
        setPromotions(response?.success && Array.isArray(response.data) ? response.data : []);
      } catch {
        setPromotions([]);
      }
    };

    loadPromotions();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const restaurantIds = [...new Set(items.map((item) => toNum(item.RestaurantId)).filter((num) => num !== null))];
    const categoryIds = [...new Set(items.map((item) => item.CategoryId).filter(Boolean))];
    const productIds = items.map((item) => item.Id).filter(Boolean);
    const primaryRestaurantId = restaurantIds[0];

    const loadMinimumOrders = async () => {
      if (restaurantIds.length === 0) {
        if (!isCancelled) setRestaurants([]);
        return;
      }

      const response = await checkMinimumOrder(restaurantIds);
      if (!isCancelled) {
        setRestaurants(response?.success && Array.isArray(response.data) ? response.data : []);
      }
    };

    const loadCrossSell = async () => {
      if (!primaryRestaurantId || productIds.length === 0) {
        if (!isCancelled) {
          setCrossSellProducts([]);
          setCrossSellResolved(true);
        }
        return;
      }

      const response = await getCrossSellProducts([primaryRestaurantId], productIds, categoryIds);
      if (!isCancelled) {
        setCrossSellProducts(response?.success && Array.isArray(response.data) ? response.data.slice(0, 6) : []);
        setCrossSellResolved(true);
      }
    };

    if (!isCancelled) {
      setCrossSellResolved(false);
    }
    loadMinimumOrders();
    loadCrossSell();

    return () => {
      isCancelled = true;
    };
  }, [itemsHash, items]);

  useEffect(() => {
    let cancelled = false;

    if (items.length === 0) {
      setPageReady(true);
      initialAssetsReadyRef.current = true;
      return undefined;
    }

    if (!crossSellResolved) {
      if (!initialAssetsReadyRef.current) {
        setPageReady(false);
      }
      return undefined;
    }

    const preparePage = async () => {
      if (!initialAssetsReadyRef.current) {
        setPageReady(false);
      }
      await preloadImages([
        ...items.map((item) => getProductListImage(item)),
        ...crossSellProducts.map((product) => getProductListImage(product)),
      ]);
      if (!cancelled) {
        if (!initialAssetsReadyRef.current) {
          setPageReady(true);
          initialAssetsReadyRef.current = true;
        }
      }
    };

    preparePage();

    return () => {
      cancelled = true;
    };
  }, [crossSellProducts, crossSellResolved, items, itemsHash]);

  useEffect(() => {
    if (restaurants.length === 0 || items.length === 0) {
      setMinimumOrderIssues([]);
      return;
    }

    const restaurantTotals = {};
    items.forEach((item) => {
      const normalizedId = toNum(item.RestaurantId);
      if (normalizedId !== null) {
        restaurantTotals[normalizedId] = (restaurantTotals[normalizedId] || 0) + (Number(item.effectivePrice) || 0) * (Number(item.quantity) || 0);
      }
    });

    const issues = restaurants
      .map((restaurant) => {
        const minOrderNum = Number(restaurant.MinOrder) || 0;
        const currentTotal = restaurantTotals[toNum(restaurant.Id)] || 0;
        if (minOrderNum <= 0 || currentTotal >= minOrderNum) {
          return null;
        }

        return {
          ...restaurant,
          CurrentTotal: currentTotal,
          MissingAmount: Math.max(0, minOrderNum - currentTotal),
        };
      })
      .filter(Boolean);

    setMinimumOrderIssues(issues);
  }, [restaurants, items]);

  useEffect(() => {
    if (!appliedCoupon) return;

    if (totalAmount < (appliedCoupon.MinimumAmount || 0)) {
      storeRemoveCoupon();
      return;
    }

    let newDiscount = appliedCoupon.DiscountType === 'percentage' ? (totalAmount * appliedCoupon.DiscountValue) / 100 : appliedCoupon.DiscountValue;
    if (appliedCoupon.MaxDiscount && newDiscount > appliedCoupon.MaxDiscount) newDiscount = appliedCoupon.MaxDiscount;
    if (newDiscount > totalAmount) newDiscount = totalAmount;

    if (Math.abs((appliedCoupon.calculatedDiscount || 0) - newDiscount) > 0.005) {
      storeApplyCoupon({ ...appliedCoupon, calculatedDiscount: newDiscount });
    }
  }, [totalAmount, appliedCoupon, storeApplyCoupon, storeRemoveCoupon]);

  const eligiblePromotions = useMemo(
    () => promotions.filter((promo) => totalAmount >= (Number(promo.MinimumAmount) || 0)),
    [promotions, totalAmount],
  );

  const applyCoupon = useCallback(
    (coupon) => {
      let discountAmount = coupon.DiscountType === 'percentage' ? (totalAmount * coupon.DiscountValue) / 100 : coupon.DiscountValue;
      if (coupon.MaxDiscount && discountAmount > coupon.MaxDiscount) discountAmount = coupon.MaxDiscount;
      if (discountAmount > totalAmount) discountAmount = totalAmount;
      storeApplyCoupon({ ...coupon, calculatedDiscount: discountAmount });
    },
    [storeApplyCoupon, totalAmount],
  );

  const discountAmount = appliedCoupon?.calculatedDiscount || 0;
  const finalAmount = Math.max(0, Number(totalAmount) - Number(discountAmount || 0));

  const buttonText = useMemo(() => {
    if (!hasMinimumOrderIssue) {
      return isAuthenticated ? 'Checkouta devam et' : 'Giris yap';
    }

    const firstIssue = minimumOrderIssues[0];
    return `${formatPrice(firstIssue.MissingAmount)} TL daha ekle`;
  }, [hasMinimumOrderIssue, isAuthenticated, minimumOrderIssues]);

  const handleContinue = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    navigate('/checkout');
  };

  const handleCrossSellPreview = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCrossSellAdd = (product, event) => {
    const defaultVariant = product.variants?.find((variant) => variant.IsDefault) || (product.variants?.length === 1 ? product.variants[0] : null);
    const sourceElement = event?.currentTarget?.closest('[data-product-card]')?.querySelector('[data-add-to-cart-image="true"]');

    if (product.variants?.length > 1) {
      handleCrossSellPreview(product);
      return;
    }

    addItem(product, defaultVariant, 1);
    showSingleAddSuccess({
      product,
      selectedVariant: defaultVariant,
      quantity: 1,
      source: 'cart-cross-sell',
      sourceElement,
    });
  };

  if (items.length === 0) {
    return (
        <EmptyState
          icon={ShoppingCart}
          title="Sepetiniz Bos"
          message="Sepetinizde urun yok."
          actionText="Ana sayfaya git"
          actionPath="/"
        />
    );
  }

  if (!pageReady) {
    return (
      <div className="pb-8 pt-4 lg:pb-12">
        <PageShell width="full">
          <SurfaceCard tone="muted" className="p-6">
            <Loading message="Sepet hazirlaniyor..." />
          </SurfaceCard>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-4 lg:pb-12">
      <PageShell width="full" className="space-y-4">
        <Reveal variant="section-enter">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Sepet</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-dark sm:text-3xl">Sepetinizi kontrol edin.</h1>
            </div>
            <Badge tone="primary">{items.length} kalem</Badge>
          </div>
        </Reveal>

        {hasMinimumOrderIssue && (
          <Reveal variant="reveal-up">
            <SurfaceCard className="border border-amber-200 bg-amber-50 p-4 shadow-none">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-amber-500 text-white">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-950">Minimum siparis tutarina ulasilmadi</p>
                  {minimumOrderIssues.map((restaurant) => (
                    <p key={restaurant.Id} className="text-sm leading-6 text-amber-900/82">
                      {restaurant.Name}: {formatPrice(restaurant.MissingAmount)} TL daha eklemelisin.
                    </p>
                  ))}
                </div>
              </div>
            </SurfaceCard>
          </Reveal>
        )}

        {hasMultipleStores && (
          <Reveal variant="reveal-up" delay={60}>
            <SurfaceCard className="border border-blue-200 bg-blue-50 p-4 shadow-none">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-blue-600 text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-950">Birden fazla magaza secildi</p>
                  <p className="text-sm leading-6 text-blue-900/82">Checkout sonunda {allRestaurantIds.length} ayri siparis olusacak.</p>
                </div>
              </div>
            </SurfaceCard>
          </Reveal>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),340px] xl:items-start">
          <div className="min-w-0 space-y-4">
            <Reveal variant="section-enter">
              <SurfaceCard className="min-w-0 space-y-3 overflow-hidden p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Sepettekiler</p>
                    <h2 className="mt-1 text-xl font-bold text-dark">Urunler</h2>
                  </div>
                  <span className="text-sm font-medium text-dark-lighter">{formatPrice(finalAmount)} TL</span>
                </div>

                {items.map((item) => (
                  <CartItemCard
                    key={`${item.Id}:${item.selectedVariant?.Id ?? 0}`}
                    item={item}
                    increaseQuantity={increaseQuantity}
                    decreaseQuantity={decreaseQuantity}
                    removeItem={removeItem}
                  />
                ))}
              </SurfaceCard>
            </Reveal>
 
            {crossSellProducts.length > 0 && (
              <Reveal variant="section-enter" delay={80}>
                <SurfaceCard tone="muted" className="min-w-0 overflow-hidden p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Istege bagli</p>
                      <h2 className="mt-1 text-lg font-bold text-dark">Sepete eklenebilecekler</h2>
                    </div>
                    <Badge tone="warning">{crossSellProducts.length} urun</Badge>
                  </div>

                  <div className="scrollbar-hide flex max-w-full gap-3 overflow-x-auto pb-1">
                    {crossSellProducts.map((product, index) => {
                      const hasVariants = product.variants?.length > 1;
                      return (
                        <Reveal key={product.Id} variant="reveal-up" delay={Math.min(index, 5) * 50} className="shrink-0">
                          <article data-product-card="true" className="group w-[190px] shrink-0 overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                            <button type="button" onClick={() => handleCrossSellPreview(product)} className="block w-full text-left">
                              <div data-add-to-cart-image="true" className="relative h-28 overflow-hidden bg-surface-muted">
                                {getProductListImage(product) ? (
                                  <img src={getProductListImage(product)} alt={product.Name} className="gm-image-drift h-full w-full object-cover" loading="eager" decoding="async" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]">
                                    <Package className="h-6 w-6 text-primary/40" />
                                  </div>
                                )}
                              </div>

                              <div className="gm-content-settle space-y-1 p-3">
                                <p className="line-clamp-2 text-sm font-bold leading-6 text-dark">{product.Name}</p>
                                {hasVariants && <p className="text-xs leading-5 text-dark-lighter">{product.variants.length} secenek</p>}
                              </div>
                            </button>

                            <div className="flex items-center justify-between gap-3 px-3 pb-3">
                              <p className="gm-price-settle text-base font-black text-primary-dark">{formatPrice(product.effectivePrice ?? product.Price)} TL</p>
                              <button
                                type="button"
                                onClick={(event) => handleCrossSellAdd(product, event)}
                                className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform duration-200 hover:-translate-y-0.5"
                              >
                                {hasVariants ? 'Sec' : 'Ekle'}
                              </button>
                            </div>
                          </article>
                        </Reveal>
                      );
                    })}
                  </div>
                </SurfaceCard>
              </Reveal>
            )}
          </div>

          <Reveal variant="section-enter" delay={100} className="hidden xl:block xl:sticky xl:top-24">
            <SummaryPanel
              totalAmount={totalAmount}
              discountAmount={discountAmount}
              finalAmount={finalAmount}
              eligiblePromotions={eligiblePromotions}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={storeRemoveCoupon}
              showButton
              onContinue={handleContinue}
              disabled={hasMinimumOrderIssue}
              buttonText={buttonText}
            />
          </Reveal>
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

      {!showProductModal && (
        <div className="fixed inset-x-0 bottom-0 z-50 xl:hidden">
          <PageShell width="full" className="pb-3">
            <Reveal variant="bar-rise">
              <StickyActionBar>
                <div className="space-y-3 rounded-[20px] bg-white/72 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Toplam</p>
                      <p className="text-xl font-black text-primary-dark">{formatPrice(finalAmount)} TL</p>
                    </div>
                    <PrimaryButton className={cn('justify-center', hasMinimumOrderIssue && 'cursor-not-allowed opacity-60')} onClick={handleContinue} disabled={hasMinimumOrderIssue}>
                      {buttonText}
                      {!hasMinimumOrderIssue && <ArrowRight className="h-4 w-4" />}
                    </PrimaryButton>
                  </div>
                </div>
              </StickyActionBar>
            </Reveal>
          </PageShell>
        </div>
      )}
    </div>
  );
}

export default Cart;
