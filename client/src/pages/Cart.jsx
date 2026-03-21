import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Minus, Package, Plus, ShoppingCart, Store, Tag, Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ProductDetailModal from '../components/ProductDetailModal';
import { checkMinimumOrder, getActivePromotions, getCrossSellProducts } from '../services/api';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { Badge, Chip, PageShell, PrimaryButton, StickyActionBar, SurfaceCard, cn } from '../components/ui/primitives';

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
  const { items, increaseQuantity, decreaseQuantity, removeItem, getTotalAmount, addItem, appliedCoupon, applyCoupon: storeApplyCoupon, removeCoupon: storeRemoveCoupon } =
    useCartStore();
  const { isAuthenticated } = useCustomerStore();

  const [promotions, setPromotions] = useState([]);
  const [crossSellProducts, setCrossSellProducts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [minimumOrderIssues, setMinimumOrderIssues] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const totalAmount = getTotalAmount();

  const allRestaurantIds = useMemo(
    () => [...new Set(items.map((item) => toNum(item.RestaurantId)).filter((num) => num !== null))],
    [items],
  );
  const hasMultipleRestaurants = allRestaurantIds.length > 1;
  const hasMinimumOrderIssue = minimumOrderIssues.length > 0;

  const buttonText = useMemo(() => {
    if (!hasMinimumOrderIssue) {
      return isAuthenticated ? 'Checkouta devam et' : 'Giris yap';
    }
    const firstIssue = minimumOrderIssues[0];
    return `Minimum ${formatPrice(firstIssue.MinOrder)} TL`;
  }, [hasMinimumOrderIssue, isAuthenticated, minimumOrderIssues]);

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
    const loadCartMeta = async () => {
      try {
        const restaurantIds = [...new Set(items.map((item) => toNum(item.RestaurantId)).filter((num) => num !== null))];

        if (restaurantIds.length > 0) {
          const restaurantResponse = await checkMinimumOrder(restaurantIds);
          setRestaurants(restaurantResponse?.success && Array.isArray(restaurantResponse.data) ? restaurantResponse.data : []);
        } else {
          setRestaurants([]);
        }

        const validRestaurantIds = items.map((item) => toNum(item.RestaurantId)).filter((num) => num !== null);
        const primaryRestaurantId = validRestaurantIds[0];
        const categoryIds = [...new Set(items.map((item) => item.CategoryId).filter(Boolean))];
        const productIds = items.map((item) => item.Id).filter(Boolean);

        if (!primaryRestaurantId || productIds.length === 0) {
          setCrossSellProducts([]);
          return;
        }

        const crossSellResponse = await getCrossSellProducts([primaryRestaurantId], productIds, categoryIds);
        setCrossSellProducts(crossSellResponse?.success && Array.isArray(crossSellResponse.data) ? crossSellResponse.data.slice(0, 6) : []);
      } catch {
        setRestaurants([]);
        setCrossSellProducts([]);
      }
    };

    loadCartMeta();
  }, [itemsHash, items]);

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

    setMinimumOrderIssues(
      restaurants.filter((restaurant) => {
        const minOrderNum = Number(restaurant.MinOrder) || 0;
        const restaurantTotal = restaurantTotals[toNum(restaurant.Id)] || 0;
        return minOrderNum > 0 && restaurantTotal < minOrderNum;
      }),
    );
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

  const handleContinue = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return <EmptyState icon={ShoppingCart} title="Sepetiniz Bos" message="Henuz sepetinize urun eklemediniz. Lezzetli menuye goz atin." actionText="Menuye Git" actionPath="/" />;
  }

  return (
    <div className="pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-4 lg:pb-12">
      <PageShell width="full" className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Sepet</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-dark sm:text-3xl">Siparisi tamamlayin.</h1>
        </div>

        {hasMinimumOrderIssue && (
          <SurfaceCard className="border border-amber-200 bg-amber-50 p-4 shadow-none">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-amber-500 text-white"><AlertTriangle className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-bold text-amber-950">Minimum siparis tutarina ulasilmadi</p>
                {minimumOrderIssues.map((restaurant) => <p key={restaurant.Id} className="text-sm leading-6 text-amber-900/82">{restaurant.Name}: min {formatPrice(restaurant.MinOrder)} TL</p>)}
              </div>
            </div>
          </SurfaceCard>
        )}

        {hasMultipleRestaurants && (
          <SurfaceCard className="border border-blue-200 bg-blue-50 p-4 shadow-none">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-blue-600 text-white"><Store className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-bold text-blue-950">Farkli restoranlardan urun var</p>
                <p className="text-sm leading-6 text-blue-900/82">Checkout sonunda {allRestaurantIds.length} ayri siparis olusturulacak.</p>
              </div>
            </div>
          </SurfaceCard>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),340px] xl:items-start">
          <div className="space-y-4">
            <SurfaceCard className="space-y-3 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Sepettekiler</p>
                  <h2 className="mt-1 text-xl font-bold text-dark">Urunler</h2>
                </div>
                <Badge tone="primary">{items.length} kalem</Badge>
              </div>

              {items.map((item) => (
                <article key={`${item.Id}:${item.selectedVariant?.Id ?? 0}`} className="rounded-[24px] border border-surface-border bg-surface-muted p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-white shadow-sm">
                      {item.ImageUrl ? <img src={item.ImageUrl} alt={item.Name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]"><Package className="h-6 w-6 text-primary/40" /></div>}
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <h3 className="line-clamp-2 text-sm font-bold text-dark sm:text-base">{item.Name}</h3>
                        {item.selectedVariant?.Name && <p className="text-sm text-dark-lighter">{item.selectedVariant.Name}</p>}
                        <p className="text-sm font-medium text-dark-lighter">{formatPrice(item.effectivePrice)} TL / adet</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white px-2 py-2 shadow-sm">
                          <button onClick={() => decreaseQuantity(item.Id, item.selectedVariant?.Id)} disabled={item.quantity <= 1} className="rounded-full p-1.5 text-dark disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                          <span className="w-7 text-center text-sm font-black text-dark">{item.quantity}</span>
                          <button onClick={() => increaseQuantity(item.Id, item.selectedVariant?.Id)} disabled={item.quantity >= 10} className="rounded-full p-1.5 text-dark disabled:opacity-30"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-primary-dark">{formatPrice(item.effectivePrice * item.quantity)} TL</span>
                          <button onClick={() => removeItem(item.Id, item.selectedVariant?.Id)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"><Trash2 className="h-4 w-4" />Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </SurfaceCard>

            {crossSellProducts.length > 0 && (
              <SurfaceCard tone="muted" className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Istege bagli</p>
                    <h2 className="mt-1 text-lg font-bold text-dark">Sepete eklenebilecekler</h2>
                  </div>
                  <Badge tone="warning">{crossSellProducts.length} urun</Badge>
                </div>
                <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
                  {crossSellProducts.map((product) => (
                    <button key={product.Id} onClick={() => { setSelectedProduct(product); setShowProductModal(true); }} className="w-[180px] shrink-0 overflow-hidden rounded-[24px] border border-white/70 bg-white text-left shadow-card">
                      <div className="relative h-28 overflow-hidden bg-surface-muted">
                        {product.ImageUrl ? <img src={product.ImageUrl} alt={product.Name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]"><Package className="h-6 w-6 text-primary/40" /></div>}
                        <button onClick={(e) => { e.stopPropagation(); addItem({ ...product, effectivePrice: product.effectivePrice ?? product.Price }, null, 1); }} className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"><Plus className="h-4 w-4" /></button>
                      </div>
                      <div className="space-y-1 p-3"><p className="line-clamp-2 text-sm font-bold leading-6 text-dark">{product.Name}</p><p className="text-base font-black text-primary-dark">{formatPrice(product.effectivePrice ?? product.Price)} TL</p></div>
                    </button>
                  ))}
                </div>
              </SurfaceCard>
            )}
          </div>

          <div className="hidden xl:block xl:sticky xl:top-24">
            <SummaryPanel
              totalAmount={totalAmount}
              discountAmount={appliedCoupon?.calculatedDiscount || 0}
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
          </div>
        </div>
      </PageShell>

      {showProductModal && selectedProduct && <ProductDetailModal product={selectedProduct} isOpen={showProductModal} onClose={() => { setShowProductModal(false); setSelectedProduct(null); }} />}

      {!showProductModal && (
        <div className="fixed inset-x-0 bottom-0 z-50 xl:hidden">
          <PageShell width="full" className="pb-3">
            <StickyActionBar>
              <div className="flex items-center justify-between gap-4 rounded-[20px] bg-white/72 px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Toplam</p>
                  <p className="text-xl font-black text-primary-dark">{formatPrice(finalAmount)} TL</p>
                </div>
                <PrimaryButton className={cn('justify-center', hasMinimumOrderIssue && 'cursor-not-allowed opacity-60')} onClick={handleContinue} disabled={hasMinimumOrderIssue}>
                  {buttonText}
                  {!hasMinimumOrderIssue && <ArrowRight className="h-4 w-4" />}
                </PrimaryButton>
              </div>
            </StickyActionBar>
          </PageShell>
        </div>
      )}
    </div>
  );
}

export default Cart;
