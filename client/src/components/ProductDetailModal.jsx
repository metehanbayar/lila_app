import { Plus, Minus, X, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import useCartStore from '../store/cartStore';

function ProductDetailModal({ isOpen, onClose, product, onPrevious, onNext, canGoPrevious, canGoNext }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      if (event.key === 'ArrowLeft' && canGoPrevious) handlePrevious();
      else if (event.key === 'ArrowRight' && canGoNext) handleNext();
      else if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canGoPrevious, canGoNext, onClose]);

  // Başlık satırına göre görsel yüksekliğini ayarla (scrollsuz görünüm için)
  useEffect(() => {
    const recalc = () => {
      if (!titleRef.current) return;
      const style = window.getComputedStyle(titleRef.current);
      const lineHeight = parseFloat(style.lineHeight) || 24;
      const scrollHeight = titleRef.current.scrollHeight || lineHeight;
      const extra = Math.max(0, scrollHeight - lineHeight);
      const base = Math.min(Math.max(window.innerHeight * 0.32, 160), 320);
      const finalHeight = Math.max(140, base - Math.min(base - 140, extra));
      setImageHeightPx(finalHeight);
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [product, selectedVariant]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedVariant);
    }
    onClose();
  };

  const currentPrice = selectedVariant?.Price || product?.Price || 0;

  const handlePrevious = () => {
    if (canGoPrevious && onPrevious && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        onPrevious();
        setQuantity(1);
        setTimeout(() => setIsTransitioning(false), 150);
      }, 80);
    }
  };

  const handleNext = () => {
    if (canGoNext && onNext && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        onNext();
        setQuantity(1);
        setTimeout(() => setIsTransitioning(false), 150);
      }, 80);
    }
  };

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

  if (!product) return null;

  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="h-svh w-full bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className={`p-2 rounded-full transition ${
                canGoPrevious ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Önceki ürün"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-base font-semibold text-gray-900 truncate">Ürün Detayı</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`p-2 rounded-full transition ${
                canGoNext ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Sonraki ürün"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content (scrollsuz sığdırma) */}
        <div
          className={`px-4 py-3 flex-1 flex flex-col gap-3 overflow-hidden ${
            isTransitioning ? 'opacity-60' : 'opacity-100'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Görsel */}
          <div
            className="w-full rounded-lg bg-gray-100 overflow-hidden"
            style={{ height: imageHeightPx ? `${Math.round(imageHeightPx)}px` : 'clamp(160px, 32vh, 320px)' }}
          >
            {product.ImageUrl ? (
              <img
                src={product.ImageUrl}
                alt={product.Name}
                className={`w-full h-full object-cover transition ${
                  isTransitioning ? 'opacity-60' : 'opacity-100'
                }`}
                loading="lazy"
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
          </div>

          {/* Açıklama */}
          {product.Description && (
            <div className="shrink-0 max-h-[120px] overflow-y-auto">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.Description}</p>
            </div>
          )}

          {/* Varyant seçimi: 4'ten fazlaysa dropdown, az sayıdaysa modern butonlar */}
          {product.variants && product.variants.length > 1 && (
            <div className="shrink-0">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Porsiyon Seçimi</label>
              
              {product.variants.length > 4 ? (
                // Dropdown (4'ten fazla varyant için)
                <select
                  value={selectedVariant?.Id || ''}
                  onChange={(e) => {
                    const v = product.variants.find((x) => String(x.Id) === e.target.value);
                    if (v) setSelectedVariant(v);
                  }}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {product.variants.map((variant) => (
                    <option key={variant.Id} value={variant.Id}>
                      {variant.Name} — {variant.Price.toFixed(2)} ₺
                    </option>
                  ))}
                </select>
              ) : (
                // Modern butonlar (4 veya daha az varyant için)
                <div className={`grid gap-2 ${
                  product.variants.length === 2 ? 'grid-cols-2' : 
                  product.variants.length === 3 ? 'grid-cols-3' : 
                  'grid-cols-2 sm:grid-cols-4'
                }`}>
                  {product.variants.map((variant) => (
                    <button
                      key={variant.Id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        selectedVariant?.Id === variant.Id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className={`font-semibold text-sm ${
                          selectedVariant?.Id === variant.Id ? 'text-primary' : 'text-gray-900'
                        }`}>
                          {variant.Name}
                        </span>
                        <span className={`font-bold text-base mt-0.5 ${
                          selectedVariant?.Id === variant.Id ? 'text-primary' : 'text-gray-700'
                        }`}>
                          {variant.Price.toFixed(2)} ₺
                        </span>
                      </div>
                      {selectedVariant?.Id === variant.Id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" strokeWidth="3" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="flex-1 modal-content-safe-bottom" />
        </div>
      </div>
      {/* Sabit alt bar: miktar + toplam + CTA */}
      <div className="fixed left-0 right-0 bottom-above-nav z-[60] safe-area-bottom">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur border-t border-gray-200 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] rounded-none">
            <div className="flex items-center gap-3 py-3">
              {/* Stepper */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Miktarı azalt"
                >
                  <Minus className="w-5 h-5 text-gray-700" />
                </button>
                <span className="text-xl font-semibold min-w-[2.5rem] text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Miktarı artır"
                >
                  <Plus className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* CTA */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 px-3 sm:px-4 rounded-xl flex items-center justify-between shadow-lg active:scale-[0.99] transition flex-nowrap whitespace-nowrap text-[clamp(14px,3.6vw,16px)] min-w-0"
              >
                <span className="flex items-center gap-2 font-semibold whitespace-nowrap">
                  <Plus className="w-5 h-5" />
                  Sepete Ekle
                </span>
                <span className="font-bold whitespace-nowrap tabular-nums text-[clamp(14px,4vw,18px)]">{(currentPrice * quantity).toFixed(2)}
                  {"\u00A0"}₺
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;
