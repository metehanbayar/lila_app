import { Heart, Check } from 'lucide-react';
import { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { addToFavorites, removeFromFavorites } from '../services/customerApi';
import { safeSetTimeout } from '../utils/performance';

function ProductCard({ product, onProductClick }) {
  const navigate = useNavigate();
  // Store selector'ları optimize et - sadece gerekli fonksiyonları al
  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useCustomerStore((state) => state.isAuthenticated);
  const isFavorite = useCustomerStore((state) => state.isFavorite);
  const addToFavoritesLocal = useCustomerStore((state) => state.addToFavoritesLocal);
  const removeFromFavoritesLocal = useCustomerStore((state) => state.removeFromFavoritesLocal);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const formatPrice = useCallback((value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : '0.00';
  }, []);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation(); // Modal açılmasını engelle
    if (!product.IsActive) return; // Pasif ürünleri sepete ekleme
    addItem(product);
    setShowToast(true);
  }, [product, addItem]);

  // Toast otomatik kapan
  useEffect(() => {
    if (showToast) {
      const timer = safeSetTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleCardClick = useCallback(() => {
    if (onProductClick) {
      onProductClick(product);
    }
  }, [product, onProductClick]);

  const handleFavoriteToggle = useCallback(async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      // Giriş yapılmamışsa login sayfasına yönlendir
      window.location.href = '/login';
      return;
    }

    setIsFavoriteLoading(true);
    const isFav = isFavorite(product.Id);

    try {
      if (isFav) {
        await removeFromFavorites(product.Id);
        removeFromFavoritesLocal(product.Id);
      } else {
        await addToFavorites(product.Id);
        addToFavoritesLocal(product.Id);
      }
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
    } finally {
      setIsFavoriteLoading(false);
    }
  }, [product.Id, isAuthenticated, isFavorite, addToFavoritesLocal, removeFromFavoritesLocal]);

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-slideInRight max-w-sm">
          <div className="p-4 flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 mb-1">Sepete Eklendi!</h4>
              <p className="text-xs text-gray-600 truncate">{product.Name}</p>
              <button
                onClick={() => {
                  setShowToast(false);
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

      <div 
        className={`rounded-xl border overflow-hidden cursor-pointer flex flex-col h-full relative active:scale-[0.98] transition select-none touch-manipulation ${
          product.IsActive 
            ? 'bg-white border-gray-200 shadow-[0_20px_40px_rgba(0,0,0,0.06)]' 
            : 'bg-gray-50 border-gray-300 shadow-[0_20px_40px_rgba(0,0,0,0.03)] opacity-75'
        }`}
        onClick={handleCardClick}
      >
      {/* Ürün Görseli */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {product.ImageUrl ? (
          <img
            src={product.ImageUrl}
            alt={product.Name}
            className={`w-full h-full object-cover ${
              !product.IsActive ? 'grayscale opacity-60' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[11px] gap-2 bg-gradient-to-br from-gray-100 to-gray-200">
            <svg
              className="w-8 h-8 text-gray-400"
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.5"
            >
              <path d="M3 3h18v18H3z" />
              <path d="M3 16l5-5 4 4 5-5 4 4" />
            </svg>
            <span className="text-gray-400 font-medium">Görsel Yok</span>
          </div>
        )}
        {product.IsFeatured && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-[0_12px_30px_rgba(168,85,247,0.45)] border border-white/20">
            Önerilen
          </div>
        )}
        {/* Favori Butonu */}
        <button
          onClick={handleFavoriteToggle}
          disabled={isFavoriteLoading}
          className={`absolute top-2 right-2 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow-md active:scale-95 ${
            isFavorite(product.Id)
              ? 'bg-pink-600 text-white shadow-[0_12px_30px_rgba(236,72,153,0.5)]'
              : 'bg-white/80 text-gray-700 border border-white/60'
          } disabled:opacity-50`}
          title={isFavorite(product.Id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
        >
          <Heart
            className="w-4 h-4"
            fill={isFavorite(product.Id) ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Ürün Bilgileri */}
      <div className="p-3 border-t border-gray-100 flex flex-col gap-2">
        {/* Ürün Adı */}
        <div className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.Name}
        </div>

        {/* Fiyat ve Buton */}
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-bold text-pink-600 tabular-nums">
            {formatPrice(product.Price)} ₺
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.IsActive}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition flex items-center gap-1 border ${
              product.IsActive
                ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white shadow-[0_12px_30px_rgba(236,72,153,0.4)] border-white/30'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
            }`}
          >
            <span className={`font-bold text-[12px] leading-none ${
              product.IsActive ? 'text-white' : 'text-gray-500'
            }`}>+</span>
            <span>{product.IsActive ? 'Ekle' : 'Mevcut Değil'}</span>
          </button>
        </div>
      </div>
      </div>
    </>
  );
}

// Memo ile sarmala - sadece product veya onProductClick değiştiğinde re-render
export default memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.Id === nextProps.product.Id &&
    prevProps.product.ImageUrl === nextProps.product.ImageUrl &&
    prevProps.product.Name === nextProps.product.Name &&
    prevProps.product.Price === nextProps.product.Price &&
    prevProps.product.IsActive === nextProps.product.IsActive &&
    prevProps.product.IsFeatured === nextProps.product.IsFeatured &&
    prevProps.onProductClick === nextProps.onProductClick
  );
});

