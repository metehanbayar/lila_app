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
            w-full rounded-[22px] border px-4 py-3 pr-10 text-left
            bg-white shadow-card transition-all duration-200 active:scale-[0.99]
            ${open ? 'border-primary ring-2 ring-primary/20' :
              selectedVariant ? 'border-primary/25' : 'border-surface-border'}
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
          <div className="absolute inset-0 bg-dark/70 backdrop-blur-md" />

          {/* Menu Card */}
          <div
            ref={menuRef}
            className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#f8f2ee] shadow-premium animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-border bg-white/90 px-4 py-3 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-gray-900">Seçenek Seçin</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-dark-lighter transition-all hover:bg-white"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto scroll-touch">
              {variants.map(variant => (
                <button
                  key={variant.Id}
                  onClick={() => {
                    onSelect(variant);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 border-b border-surface-border px-4 py-3 text-left transition-colors last:border-b-0
                    ${selectedVariant?.Id === variant.Id ? 'bg-primary/6' : 'bg-white hover:bg-surface-muted'}`}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-semibold text-dark leading-tight">
                      {variant.Name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-xs font-extrabold text-dark whitespace-nowrap tabular-nums">
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

function ProductDetailModal({ isOpen, onClose, product, onPrevious, onNext, canGoPrevious, canGoNext, isViewOnly = false }) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const titleRef = useRef(null);
  const [imageHeightPx, setImageHeightPx] = useState(null);

  // İlk açılışta swipe ipucu göster
  useEffect(() => {
    if (isOpen && (canGoPrevious || canGoNext)) {
      // LocalStorage'dan kontrol et - sadece ilk seferde göster
      const hasSeenHint = localStorage.getItem('swipeHintSeen');
      if (!hasSeenHint) {
        setShowSwipeHint(true);
        const timer = safeSetTimeout(() => {
          setShowSwipeHint(false);
          localStorage.setItem('swipeHintSeen', 'true');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, canGoPrevious, canGoNext]);

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

  // IsActive undefined ise true kabul et
  const isActive = product?.IsActive !== false;

  // Body scroll kilitle/aç - iOS için geliştirilmiş
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let scrollY = 0;

    if (isOpen) {
      // Mevcut scroll pozisyonunu kaydet
      scrollY = window.scrollY;

      // iOS Safari ve diğer tarayıcılar için kapsamlı scroll kilitleme
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      if (typeof document !== 'undefined') {
        // Stilleri temizle
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.touchAction = '';
        document.documentElement.style.overflow = '';

        // Scroll pozisyonunu geri yükle
        if (scrollY > 0) {
          window.scrollTo(0, scrollY);
        }
      }
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

    // 1.5 saniye sonra modal'ı kapat
    safeSetTimeout(() => {
      setJustAdded(false);
      onClose();
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
        className="fixed inset-0 z-[1000] flex flex-col sm:items-center sm:justify-center sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-title"
      >
        {/* Backdrop - Click outside to close */}
        <div
          className="absolute inset-0 bg-dark/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed left-1/2 top-4 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-slideInRight rounded-[26px] border border-white/20 bg-white/95 shadow-premium backdrop-blur-xl">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-green-600 text-white shadow-lg shadow-green-600/20">
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="mb-1 text-sm font-bold text-dark">Sepete eklendi</h4>
                <p className="truncate text-xs text-dark-lighter">
                  {quantity} adet {product.Name}
                </p>
                <button
                  onClick={() => {
                    setShowToast(false);
                    onClose();
                    safeSetTimeout(() => navigate('/cart'), 300);
                  }}
                  className="mt-2 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Sepete Git →
                </button>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="text-dark-lighter transition-colors hover:text-dark"
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
          className="relative flex h-svh w-full flex-col bg-[#f8f2ee] backdrop-blur-2xl sm:h-[92vh] sm:max-w-5xl sm:overflow-hidden sm:rounded-[32px] sm:border sm:border-white/10 sm:shadow-premium"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative z-[50] flex shrink-0 items-center border-b border-surface-border bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-5">
            {/* Sol: Kapat */}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted text-dark transition-all active:scale-95 hover:bg-white hover:shadow-card"
              aria-label="Kapat"
            >
              <X size={18} />
            </button>

            {/* Orta: Ürün adı + sayaç */}
            <div className="flex-1 text-center px-2 min-w-0">
              <div
                id="product-title"
                className="truncate text-[15px] font-semibold leading-tight text-dark"
              >
                {product.Name}
              </div>
              {/* Ürün sayacı */}
              {(canGoPrevious || canGoNext) && (
                <div className="mt-0.5 text-[10px] font-bold text-primary">
                  ← Ürünler arasında gezin →
                </div>
              )}
            </div>

            {/* Sağ: Prev/Next nav */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all active:scale-95 ${canGoPrevious
                  ? 'border-white/70 bg-white text-dark shadow-card'
                  : 'cursor-not-allowed border-surface-border bg-surface-muted text-dark-lighter'
                  }`}
                aria-label="Önceki ürün"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all active:scale-95 ${canGoNext
                  ? 'border-white/70 bg-white text-dark shadow-card'
                  : 'cursor-not-allowed border-surface-border bg-surface-muted text-dark-lighter'
                  }`}
                aria-label="Sonraki ürün"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Content - Her zaman scroll edilebilir */}
          <div className="relative flex-1 flex flex-col overflow-hidden">
            {/* Scroll container */}
            <div
              className={`flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 ${isTransitioning ? 'opacity-60' : 'opacity-100'
                }`}
              style={{ WebkitOverflowScrolling: 'touch' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Görsel */}
              <div
                className="relative w-full overflow-hidden rounded-[28px] bg-white shadow-card"
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
                    className={`w-full h-full object-cover transition ${isTransitioning ? 'opacity-60' : 'opacity-100'
                      }`}
                  />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]">
                      <ImageOff className="w-12 h-12 text-gray-400" />
                    </div>
                )}

                {/* Swipe İpucu Overlay */}
                {showSwipeHint && (canGoPrevious || canGoNext) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark/40 animate-pulse">
                    <div className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-2 shadow-lg">
                      <ChevronLeft className="w-5 h-5 text-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="text-sm font-bold text-gray-800">Kaydırarak gezin</span>
                      <ChevronRight className="w-5 h-5 text-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                )}

                {/* Kenar okları - tıklanabilir */}
                {canGoPrevious && (
                  <button
                    onClick={handlePrevious}
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 shadow-lg transition-all active:scale-95 hover:bg-white"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>
                )}
                {canGoNext && (
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 shadow-lg transition-all active:scale-95 hover:bg-white"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                )}
              </div>

              {/* Başlık ve fiyat */}
              <div className="shrink-0 rounded-[28px] border border-white/70 bg-white p-5 shadow-card">
                <h2 ref={titleRef} className="break-words text-2xl font-bold leading-snug text-dark">{product.Name}</h2>
                <div className="text-2xl font-bold text-primary">{currentPrice.toFixed(2)} ₺</div>

                {/* Kategori ve restoran bilgisi */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {product.CategoryName && (
                    <div className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                      {product.CategoryName}
                    </div>
                  )}
                  {product.RestaurantName && (
                    <div className="flex items-center gap-2 text-dark-lighter">
                      <div className="h-2 w-2 rounded-full bg-secondary"></div>
                      <span className="font-medium">{product.RestaurantName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Açıklama */}
              {product.Description && (
                <div className="shrink-0 rounded-[24px] border border-white/70 bg-white p-4 shadow-card">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-dark-lighter">
                    Açıklama
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-dark-lighter">{product.Description}</p>
                </div>
              )}

              {/* Varyant seçimi: 4'ten fazlaysa dropdown, az sayıdaysa modern butonlar */}
              {product.variants && product.variants.length > 1 && (
                <div className="shrink-0 rounded-[24px] border border-white/70 bg-white p-4 shadow-card">
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
                    <div className={`grid gap-1.5 ${product.variants.length === 2 ? 'grid-cols-2' :
                      product.variants.length === 3 ? 'grid-cols-3' :
                        'grid-cols-2 sm:grid-cols-4'
                      }`}>
                      {product.variants.map((variant) => (
                        <button
                          key={variant.Id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`relative rounded-[18px] border px-3 py-3 transition-all duration-200 ${selectedVariant?.Id === variant.Id
                            ? 'border-primary/25 bg-primary/6 shadow-card'
                            : 'border-surface-border bg-white hover:border-primary/20 hover:shadow-card'
                            }`}
                        >
                          <div className="flex flex-col items-start">
                            <span className={`text-xs font-semibold ${selectedVariant?.Id === variant.Id ? 'text-primary' : 'text-dark'
                              }`}>
                              {variant.Name}
                            </span>
                            <span className={`mt-0.5 text-sm font-bold ${selectedVariant?.Id === variant.Id ? 'text-primary' : 'text-dark-lighter'
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
              <div className={`shrink-0 ${isViewOnly ? 'h-8' : 'h-24'}`} />
            </div>

            {/* Scroll ipucu - gradient fade */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#f8f2ee] to-transparent" />
          </div>

          {/* Sabit alt bar: miktar + toplam + CTA (Sadece görüntüleme değilse göster) */}
          {!isViewOnly && (
            <div className="fixed bottom-0 left-0 right-0 z-[60] sm:absolute" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <div className="mx-auto w-full max-w-2xl px-4 pb-3 sm:max-w-none sm:px-5">
                <div className="rounded-[26px] border border-white/30 bg-white/92 shadow-[0_-20px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
                  <div className="flex items-center gap-2 p-3 sm:p-4">
                    {/* Miktar */}
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-surface-border bg-surface-muted transition-all hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Miktarı azalt"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>

                    <span className="w-8 text-center text-lg font-black text-dark">{quantity}</span>

                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= 10}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-surface-border bg-surface-muted transition-all hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Miktarı artır"
                    >
                      <Plus className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* CTA */}
                    <button
                      onClick={handleAddToCart}
                      disabled={!isActive}
                      className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[22px] px-3 py-3 shadow-lg transition-all active:scale-[0.98] ${isActive
                        ? 'bg-primary text-white shadow-primary/25 hover:bg-primary/90'
                        : 'cursor-not-allowed bg-surface-border text-dark-lighter'
                        }`}
                    >
                      {justAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.5} />
                          <span className="font-bold text-xs whitespace-nowrap flex-shrink-0">Sepete Eklendi</span>
                        </>
                      ) : (
                        <>
                          {isActive && (
                            <Plus className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.5} />
                          )}
                          <span className="font-bold text-xs whitespace-nowrap flex-shrink-0">
                            {isActive ? 'Sepete Ekle' : 'Ürün Mevcut Değil'}
                          </span>
                          {isActive && (
                            <span className="font-black text-xs tabular-nums whitespace-nowrap flex-shrink-0">{(currentPrice * quantity).toFixed(2)} ₺</span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    document.body
  );
}

export default ProductDetailModal;
