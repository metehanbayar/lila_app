import { Check, ChevronLeft, ChevronRight, ImageOff, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
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
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [justAdded, setJustAdded] = useState(false);

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
      setSelectedVariant(product.variants.find((variant) => variant.IsDefault) || product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setQuantity(1);
    setJustAdded(false);
  }, [product]);

  const handlePrevious = useCallback(() => {
    if (canGoPrevious && onPrevious) onPrevious();
  }, [canGoPrevious, onPrevious]);

  const handleNext = useCallback(() => {
    if (canGoNext && onNext) onNext();
  }, [canGoNext, onNext]);

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

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    setJustAdded(true);
    window.setTimeout(() => {
      onClose();
      setJustAdded(false);
    }, 900);
  };

  if (!isOpen || !product) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end bg-dark/70 backdrop-blur-md sm:items-center sm:justify-center sm:p-5" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Urun modalini kapat" />

      <div className="relative flex h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#f8f2ee] shadow-premium sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-[32px]">
        <div className="flex items-center justify-between gap-3 border-b border-surface-border bg-white/92 px-4 py-4 backdrop-blur-xl sm:px-5">
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted text-dark transition-all hover:bg-white hover:shadow-card" aria-label="Kapat">
            <X className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-bold text-dark">{product.Name}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-surface-border bg-white text-dark disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Onceki urun"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-surface-border bg-white text-dark disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Sonraki urun"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="overflow-hidden rounded-[28px] bg-white shadow-card">
              <div className="aspect-[4/3] bg-surface-muted">
                {product.ImageUrl ? (
                  <img src={product.ImageUrl} alt={product.Name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]">
                    <ImageOff className="h-10 w-10 text-primary/35" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-dark">{product.Name}</h2>
                    {(product.CategoryName || product.RestaurantName) && (
                      <p className="mt-2 text-sm leading-6 text-dark-lighter">
                        {[product.CategoryName, product.RestaurantName].filter(Boolean).join(' • ')}
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
                </div>
              )}

              {!isViewOnly && (
                <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-card">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Adet</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-muted px-2 py-2">
                      <button
                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                        className="rounded-full p-1.5 text-dark"
                        aria-label="Adet azalt"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-lg font-black text-dark">{quantity}</span>
                      <button
                        onClick={() => setQuantity((current) => Math.min(10, current + 1))}
                        className="rounded-full p-1.5 text-dark"
                        aria-label="Adet artir"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={!isActive}
                      className={cn(
                        'inline-flex min-w-[180px] items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-sm font-bold transition-all',
                        isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'cursor-not-allowed bg-surface-border text-dark-lighter',
                      )}
                    >
                      {justAdded ? (
                        <>
                          <Check className="h-4 w-4" />
                          Sepete eklendi
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          {isActive ? `Sepete ekle • ${(currentPrice * quantity).toFixed(2)} TL` : 'Urun mevcut degil'}
                        </>
                      )}
                    </button>
                  </div>

                  {justAdded && (
                    <button onClick={() => navigate('/cart')} className="mt-3 text-sm font-bold text-primary">
                      Sepete git
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ProductDetailModal;
