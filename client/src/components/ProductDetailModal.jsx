import { ChevronLeft, ChevronRight, ImageOff, Minus, Plus, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useCartStore from '../store/cartStore';
import { showSingleAddSuccess } from '../utils/addToCartFeedback';
import { getProductDetailImage } from '../utils/imageVariants';
import { cn } from './ui/primitives';

function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  isViewOnly = false,
}) {
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const touchStartRef = useRef({ x: null, y: null });
  const mobileImagePanelRef = useRef(null);
  const desktopImagePanelRef = useRef(null);
  const hasSelectableVariants = product?.variants?.length > 1;

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (product?.variants?.length > 0) {
      if (product.variants.length > 1) {
        setSelectedVariant(null);
      } else {
        setSelectedVariant(product.variants.find((variant) => variant.IsDefault) || product.variants[0]);
      }
    } else {
      setSelectedVariant(null);
    }
    setQuantity(1);
  }, [product]);

  const handlePrevious = useCallback(() => {
    if (canGoPrevious && onPrevious) onPrevious();
  }, [canGoPrevious, onPrevious]);

  const handleNext = useCallback(() => {
    if (canGoNext && onNext) onNext();
  }, [canGoNext, onNext]);

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches?.[0];

    if (!touch) {
      return;
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (event) => {
      const startX = touchStartRef.current.x;
      const startY = touchStartRef.current.y;
      const touch = event.changedTouches?.[0];

      touchStartRef.current = { x: null, y: null };

      if (!touch || startX === null || startY === null) {
        return;
      }

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
        return;
      }

      if (deltaX < 0) {
        handleNext();
        return;
      }

      handlePrevious();
    },
    [handleNext, handlePrevious],
  );

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = { x: null, y: null };
  }, []);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') handlePrevious();
      if (event.key === 'ArrowRight') handleNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrevious, handleNext]);

  const currentPrice = useMemo(() => Number(selectedVariant?.Price ?? product?.Price ?? 0), [selectedVariant, product]);
  const isActive = product?.IsActive !== false;
  const canAddToCart = isActive && (!hasSelectableVariants || Boolean(selectedVariant));
  const detailImageUrl = getProductDetailImage(product);

  if (!isOpen || !product) return null;

  const renderImagePanel = (ref) => (
    <div ref={ref} data-add-to-cart-image="true" className="overflow-hidden rounded-[28px] bg-white shadow-card lg:h-full">
      <div className="aspect-[4/3] bg-surface-muted">
        {detailImageUrl ? (
          <img src={detailImageUrl} alt={product.Name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]">
            <ImageOff className="h-10 w-10 text-primary/35" />
          </div>
        )}
      </div>
    </div>
  );

  const detailPanels = (
    <>
      <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-dark">{product.Name}</h2>
            {(product.CategoryName || product.RestaurantName) && (
              <p className="mt-2 text-sm leading-6 text-dark-lighter">
                {[product.CategoryName, product.RestaurantName].filter(Boolean).join(' - ')}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Fiyat</p>
            <p className="mt-1 text-2xl font-black text-primary-dark">{currentPrice.toFixed(2)} TL</p>
          </div>
        </div>

        {product.Description && <p className="mt-4 text-sm leading-7 text-dark-lighter">{product.Description}</p>}
      </div>

      {product.variants && product.variants.length > 1 && (
        <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Secenek</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {product.variants.map((variant) => (
              <button
                type="button"
                key={variant.Id}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  'rounded-[20px] border px-4 py-3 text-left transition-all',
                  selectedVariant?.Id === variant.Id
                    ? 'border-primary/25 bg-primary/5 shadow-card'
                    : 'border-surface-border bg-surface-muted hover:border-primary/20 hover:bg-white',
                )}
              >
                <p className="text-sm font-bold text-dark">{variant.Name}</p>
                <p className="mt-1 text-sm font-semibold text-dark-lighter">{Number(variant.Price || 0).toFixed(2)} TL</p>
              </button>
            ))}
          </div>
          {!selectedVariant && (
            <p className="mt-3 text-xs font-medium text-primary">
              {isViewOnly ? 'Fiyat detayini gormek icin secenek secin.' : 'Sepete eklemek icin secenek secin.'}
            </p>
          )}
        </div>
      )}
    </>
  );

  const handleAddToCart = () => {
    if (!canAddToCart) {
      return;
    }

    const sourceElement = desktopImagePanelRef.current?.offsetParent !== null ? desktopImagePanelRef.current : mobileImagePanelRef.current;

    addItem(product, selectedVariant, quantity);
    showSingleAddSuccess({
      product,
      selectedVariant,
      quantity,
      source: 'modal',
      onComplete: onClose,
      sourceElement,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-stretch bg-dark/70 backdrop-blur-md sm:items-center sm:justify-center sm:p-5" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Urun modalini kapat" />

      <div
        className="relative flex h-[100dvh] w-full max-h-[100dvh] flex-col overflow-hidden rounded-none bg-[#f8f2ee] shadow-premium sm:h-[88vh] sm:max-h-[88vh] sm:max-w-3xl sm:rounded-[32px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className="flex items-center justify-between gap-2 border-b border-surface-border bg-white/92 px-4 py-3 backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-4">
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-muted text-dark transition-all hover:bg-white hover:shadow-card sm:h-10 sm:w-10" aria-label="Kapat">
            <X className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[13px] font-bold text-dark sm:text-sm">{product.Name}</p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isViewOnly && (
              <div
                data-cart-target="modal"
                className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-surface-border bg-surface-muted text-dark shadow-sm sm:h-10 sm:w-10"
                aria-hidden="true"
              >
                <ShoppingBag data-cart-icon="true" className="h-4 w-4" />
                <span
                  data-cart-badge="true"
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-lg"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-surface-border bg-white text-dark disabled:cursor-not-allowed disabled:opacity-35 sm:h-10 sm:w-10"
              aria-label="Onceki urun"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-surface-border bg-white text-dark disabled:cursor-not-allowed disabled:opacity-35 sm:h-10 sm:w-10"
              aria-label="Sonraki urun"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pt-3 sm:hidden">
          {renderImagePanel(mobileImagePanelRef)}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-5">
          <div className="space-y-4 sm:hidden">
            {detailPanels}
          </div>

          <div className="hidden gap-4 sm:grid lg:min-h-full lg:grid-cols-[1.05fr,0.95fr]">
            {renderImagePanel(desktopImagePanelRef)}
            <div className="flex h-full flex-col gap-4">
              {detailPanels}
            </div>
          </div>
        </div>

        {!isViewOnly && (
          <div className="border-t border-surface-border bg-white/96 px-4 pt-3 backdrop-blur-xl modal-action-safe-bottom sm:px-5 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Adet</p>
                  <p className="mt-1 text-xs text-dark-lighter">Toplam {(currentPrice * quantity).toFixed(2)} TL</p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-muted px-2 py-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="rounded-full p-1.5 text-dark"
                    aria-label="Adet azalt"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-lg font-black text-dark">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.min(10, current + 1))}
                    className="rounded-full p-1.5 text-dark"
                    aria-label="Adet artir"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className={cn(
                    'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-sm font-bold transition-all sm:min-w-[240px]',
                    canAddToCart ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'cursor-not-allowed bg-surface-border text-dark-lighter',
                  )}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {!isActive ? 'Urun mevcut degil' : hasSelectableVariants && !selectedVariant ? 'Secenek secin' : `Sepete ekle - ${(currentPrice * quantity).toFixed(2)} TL`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default ProductDetailModal;
