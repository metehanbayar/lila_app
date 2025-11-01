import { Plus, Minus, X, ImageOff, ChevronLeft, ChevronRight, Check, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { safeSetTimeout } from '../utils/performance';

function VariantDropdown({ variants, selectedVariant, onSelect }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // ESC tuşu ile kapat
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleEsc = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEsc);
      // Scroll'u kilitle
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      if (typeof document !== 'undefined') document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger */}
        <button
          onClick={() => setOpen(!open)}
          className={`
            w-full rounded-xl border-2 px-4 py-3 pr-10 text-left
            bg-white bg-gradient-to-b from-white to-gray-50
            shadow-sm active:scale-[0.99] transition
            ${open ? 'border-primary ring-2 ring-primary/20' :
              selectedVariant ? 'border-primary' : 'border-gray-200'}
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-gray-500 leading-none">
                Seçili
              </span>
              <span className="text-[13px] font-bold text-gray-900 leading-tight">
                {selectedVariant?.Name || 'Seçiniz'}
              </span>
            </div>
            <div className="text-[13px] font-extrabold text-gray-900 whitespace-nowrap tabular-nums">
              {(selectedVariant?.Price ?? 0).toFixed(2)} ₺
            </div>
          </div>

          <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-lg
            bg-primary text-white text-[10px] font-bold pointer-events-none">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* Full Screen Overlay Menu */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Menu Card */}
          <div
            ref={menuRef}
            className="relative w-full max-w-md max-h-[85vh] bg-white rounded-xl shadow-2xl border border-white/40 overflow-hidden flex flex-col animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Seçenek Seçin</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="overflow-y-auto scroll-touch flex-1">
              {variants.map(variant => (
                <button
                  key={variant.Id}
                  onClick={() => {
                    onSelect(variant);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 active:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0
                    ${selectedVariant?.Id === variant.Id ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-900 leading-tight">
                      {variant.Name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-xs font-extrabold text-gray-900 whitespace-nowrap tabular-nums">
                      {variant.Price.toFixed(2)} ₺
                    </div>
                    {selectedVariant?.Id === variant.Id && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function ProductDetailModal({ isOpen, onClose, product, onPrevious, onNext, canGoPrevious, canGoNext }) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const titleRef = useRef(null);
  const [imageHeightPx, setImageHeightPx] = useState(null);

  // Varsayılan varyantı seç
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.IsDefault) || product.variants[0];
      setSelectedVariant(defaultVariant);
    } else {
      setSelectedVariant(null);
    }
    setQuantity(1);
  }, [product]);

  // Body scroll kilitle/aç
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      if (typeof document !== 'undefined') document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Navigation handler functions
  const handlePrevious = useCallback(() => {
    if (canGoPrevious && onPrevious && !isTransitioning) {
      setIsTransitioning(true);
      safeSetTimeout(() => {
        onPrevious();
        setQuantity(1);
        safeSetTimeout(() => setIsTransitioning(false), 150);
      }, 80);
    }
  }, [canGoPrevious, onPrevious, isTransitioning]);

  const handleNext = useCallback(() => {
    if (canGoNext && onNext && !isTransitioning) {
      setIsTransitioning(true);
      safeSetTimeout(() => {
        onNext();
        setQuantity(1);
        safeSetTimeout(() => setIsTransitioning(false), 150);
      }, 80);
    }
  }, [canGoNext, onNext, isTransitioning]);

  // Klavye kısayolları
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      if (event.key === 'ArrowLeft' && canGoPrevious) handlePrevious();
      else if (event.key === 'ArrowRight' && canGoNext) handleNext();
      else if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canGoPrevious, canGoNext, onClose, handlePrevious, handleNext]);

  // Başlık satırına göre görsel yüksekliğini ayarla (scrollsuz görünüm için) - throttle ile optimize et
  useEffect(() => {
    let rafId = null;
    const recalc = () => {
      if (!titleRef.current) return;
      const style = window.getComputedStyle(titleRef.current);
      const lineHeight = parseFloat(style.lineHeight) || 24;
      const scrollHeight = titleRef.current.scrollHeight || lineHeight;
      const extra = Math.max(0, scrollHeight - lineHeight);

      const screenH = window.innerHeight;

      // Küçük ekran (mesela eski 5.5" Android gibi)
      if (screenH < 700) {
        // Küçük ekranda: resmi kısmayı bırak, sabit tut
        const base = Math.max(screenH * 0.35, 220);
        // %35 ekran ya da minimum 220px
        setImageHeightPx(Math.min(base, 280));
        return;
      }

      // Normal / büyük ekran için mevcut mantığın biraz yumuşatılmış versiyonu
      const base = Math.min(Math.max(screenH * 0.32, 200), 340);
      const finalHeight = Math.max(
        180,
        base - Math.min(base - 180, extra)
      );

      setImageHeightPx(finalHeight);
    };

    const handleResize = () => {
      if (rafId) return; // Throttle
      rafId = requestAnimationFrame(() => {
        recalc();
        rafId = null;
      });
    };

    recalc();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [product, selectedVariant]);

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    
    // Toast göster
    setShowToast(true);
    
    // Buton durumunu güncelle
    setJustAdded(true);
    safeSetTimeout(() => {
      setJustAdded(false);
    }, 1500);
  };

  // Toast otomatik kapan
  useEffect(() => {
    if (showToast) {
      const timer = safeSetTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
      }
    }, [showToast]);

  const currentPrice = useMemo(() => selectedVariant?.Price ?? product?.Price ?? 0, [selectedVariant, product]);
  const [isVeryShortScreen, setIsVeryShortScreen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight < 700;
  });

  useEffect(() => {
    let rafId = null;
    const check = () => {
      setIsVeryShortScreen(window.innerHeight < 700);
    };

    const handleResize = () => {
      if (rafId) return; // Throttle
      rafId = requestAnimationFrame(() => {
        check();
        rafId = null;
      });
    };

    check();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Basit swipe desteği (soldan/sağa)
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isTransitioning) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && canGoNext) handleNext();
    if (distance < -50 && canGoPrevious) handlePrevious();
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) setQuantity(newQuantity);
  };

  // Unmount when closed for better performance
  if (!isOpen || !product) return null;

  return createPortal(
    (
      <div
        className="fixed inset-0 z-[1000] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-title"
      >
        {/* Backdrop - Click outside to close */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Toast Notification */}
        {showToast && (
        <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 z-[70] animate-slideInRight max-w-sm">
          <div className="p-4 flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 mb-1">Sepete Eklendi!</h4>
              <p className="text-xs text-gray-600 truncate">
                {quantity} adet {product.Name}
              </p>
              <button
                onClick={() => {
                  setShowToast(false);
                  onClose();
                  safeSetTimeout(() => navigate('/cart'), 300);
                }}
                className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sepete Git →
              </button>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Kapat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Modal Content - Stop propagation to prevent closing on content click */}
      <div
        className="relative h-svh w-full bg-white/95 backdrop-blur-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/30 shrink-0 relative z-[50]">
          {/* Sol: Kapat */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/80 border border-white/60 shadow-md flex items-center justify-center text-gray-700 active:scale-95 transition-all"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>

          {/* Orta: Ürün adı */}
          <div className="flex-1 text-center px-2 min-w-0">
            <div
              id="product-title"
              className="text-[15px] font-semibold text-gray-900 truncate leading-tight"
            >
              {product.Name}
            </div>
            {product.RestaurantName && (
              <div className="text-[11px] text-gray-500 leading-tight truncate mt-0.5">
                {product.RestaurantName}
              </div>
            )}
          </div>

          {/* Sağ: Prev/Next nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all border ${
                canGoPrevious
                  ? 'bg-white/60 border-white/50 text-gray-700 shadow-md'
                  : 'bg-gray-100 text-gray-300 border-gray-200 shadow-none cursor-not-allowed'
              }`}
              aria-label="Önceki ürün"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all border ${
                canGoNext
                  ? 'bg-white/60 border-white/50 text-gray-700 shadow-md'
                  : 'bg-gray-100 text-gray-300 border-gray-200 shadow-none cursor-not-allowed'
              }`}
              aria-label="Sonraki ürün"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Content (scrollsuz sığdırma) */}
        <div
          className={`px-4 py-3 flex-1 flex flex-col gap-3 ${
            isVeryShortScreen ? 'overflow-y-auto scroll-touch' : 'overflow-hidden'
          } ${isTransitioning ? 'opacity-60' : 'opacity-100'}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Görsel */}
          <div
            className="w-full rounded-2xl bg-gray-100 overflow-hidden"
            style={{
              height: imageHeightPx
                ? `${Math.round(imageHeightPx)}px`
                : 'clamp(200px, 35vh, 340px)'
            }}
          >
            {product.ImageUrl ? (
              <img
                src={product.ImageUrl}
                alt={product.Name}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 100vw, 600px"
                className={`w-full h-full object-cover transition ${
                  isTransitioning ? 'opacity-60' : 'opacity-100'
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <ImageOff className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Başlık ve fiyat */}
          <div className="shrink-0">
            <h2 ref={titleRef} className="text-xl font-bold text-gray-900 break-words leading-snug">{product.Name}</h2>
            <div className="text-2xl font-bold text-primary">{currentPrice.toFixed(2)} ₺</div>
            
            {/* Kategori ve restoran bilgisi */}
            <div className="mt-2 flex items-center gap-3 text-sm flex-wrap">
              {product.CategoryName && (
                <div className="px-2.5 py-1 bg-primary/10 text-primary rounded-full font-semibold">
                  {product.CategoryName}
                </div>
              )}
              {product.RestaurantName && (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{product.RestaurantName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Açıklama */}
          {product.Description && (
            <div className="shrink-0 max-h-[120px] overflow-y-auto">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Açıklama
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.Description}</p>
            </div>
          )}

          {/* Varyant seçimi: 4'ten fazlaysa dropdown, az sayıdaysa modern butonlar */}
          {product.variants && product.variants.length > 1 && (
            <div className="shrink-0">
              <label className="block text-xs font-semibold text-gray-900 mb-1.5">Seçenekler</label>
              
              {product.variants.length > 4 ? (
                // Custom dropdown (4'ten fazla varyant için)
                <VariantDropdown
                  variants={product.variants}
                  selectedVariant={selectedVariant}
                  onSelect={setSelectedVariant}
                />
              ) : (
                // Modern butonlar (4 veya daha az varyant için)
                <div className={`grid gap-1.5 ${
                  product.variants.length === 2 ? 'grid-cols-2' : 
                  product.variants.length === 3 ? 'grid-cols-3' : 
                  'grid-cols-2 sm:grid-cols-4'
                }`}>
                  {product.variants.map((variant) => (
                    <button
                      key={variant.Id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`relative px-3 py-2 rounded-lg border transition-all duration-200 ${
                        selectedVariant?.Id === variant.Id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className={`font-semibold text-xs ${
                          selectedVariant?.Id === variant.Id ? 'text-primary' : 'text-gray-900'
                        }`}>
                          {variant.Name}
                        </span>
                        <span className={`font-bold text-sm mt-0.5 ${
                          selectedVariant?.Id === variant.Id ? 'text-primary' : 'text-gray-700'
                        }`}>
                          {variant.Price.toFixed(2)} ₺
                        </span>
                      </div>
                      {selectedVariant?.Id === variant.Id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" strokeWidth="3" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* İçerik alt güvenli boşluk - buton barı için */}
          <div className="shrink-0 modal-content-safe-bottom" />
        </div>

        {/* Sabit alt bar: miktar + toplam + CTA */}
        <div className="fixed left-0 right-0 bottom-0 z-[60]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="mx-auto w-full max-w-2xl px-4 pb-3">
            <div className="bg-white/90 backdrop-blur-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.3)] rounded-2xl border border-white/40">
              <div className="flex items-center gap-2 p-3">
                {/* Miktar */}
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-9 h-9 rounded-xl border-2 border-white/40 hover:bg-white/60 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all bg-white/50 backdrop-blur-sm flex-shrink-0"
                  aria-label="Miktarı azalt"
                >
                  <Minus className="w-4 h-4 text-gray-700" />
                </button>
                
                <span className="text-lg font-black text-gray-900 w-8 text-center">{quantity}</span>
                
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                  className="w-9 h-9 rounded-xl border-2 border-white/40 hover:bg-white/60 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all bg-white/50 backdrop-blur-sm flex-shrink-0"
                  aria-label="Miktarı artır"
                >
                  <Plus className="w-4 h-4 text-gray-700" />
                </button>

                {/* CTA */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.IsActive}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-all min-w-0 px-2 ${
                    product.IsActive 
                      ? 'bg-primary hover:bg-primary/90 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.5} />
                      <span className="font-bold text-xs whitespace-nowrap flex-shrink-0">Sepete Eklendi</span>
                    </>
                  ) : (
                    <>
                      {product.IsActive && (
                        <Plus className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.5} />
                      )}
                      <span className="font-bold text-xs whitespace-nowrap flex-shrink-0">
                        {product.IsActive ? 'Sepete Ekle' : 'Ürün Mevcut Değil'}
                      </span>
                      {product.IsActive && (
                        <span className="font-black text-xs tabular-nums whitespace-nowrap flex-shrink-0">{(currentPrice * quantity).toFixed(2)} ₺</span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    ),
    document.body
  );
}

export default ProductDetailModal;
