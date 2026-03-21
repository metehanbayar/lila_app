import { Heart, Check, Plus, Sparkles } from 'lucide-react';
import { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { addToFavorites, removeFromFavorites } from '../services/customerApi';
import { safeSetTimeout } from '../utils/performance';

function ProductCard({ product, onProductClick }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useCustomerStore((state) => state.isAuthenticated);
  const isFavorite = useCustomerStore((state) => state.isFavorite);
  const addToFavoritesLocal = useCustomerStore((state) => state.addToFavoritesLocal);
  const removeFromFavoritesLocal = useCustomerStore((state) => state.removeFromFavoritesLocal);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // IsActive undefined veya null ise true kabul et (favori ürünlerde IsActive gelmeyebilir)
  const isActive = product.IsActive !== false;

  const formatPrice = useCallback((value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : '0.00';
  }, []);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (!isActive) return;
    addItem(product);
    setShowToast(true);
  }, [product, addItem, isActive]);

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
        <div className="fixed top-4 right-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 animate-slideInRight max-w-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
          <div className="p-4 flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
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
                className="mt-2 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
              >
                Sepete Git
                <span className="text-lg">→</span>
              </button>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
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
        className={`group relative rounded-3xl overflow-hidden cursor-pointer flex flex-col h-full transform transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] touch-manipulation select-none ${isActive
            ? 'bg-white'
            : 'bg-gray-50 opacity-75'
          }`}
        style={{
          boxShadow: isActive
            ? '0 20px 50px -15px rgba(0, 0, 0, 0.1), 0 10px 25px -10px rgba(0, 0, 0, 0.05)'
            : '0 10px 30px -15px rgba(0, 0, 0, 0.05)'
        }}
        onClick={handleCardClick}
      >
        {/* Hover shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20 pointer-events-none" />

        {/* Ürün Görseli */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          {product.ImageUrl ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse" />
              )}
              <img
                src={product.ImageUrl}
                alt={product.Name}
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${!isActive ? 'grayscale opacity-60' : ''
                  } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
              <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
                <path d="M3 3h18v18H3z" />
                <path d="M3 16l5-5 4 4 5-5 4 4" />
              </svg>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Featured Badge */}
          {product.IsFeatured && (
            <div className="absolute top-3 left-3 z-10">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-orange-500/40 border border-amber-400/30">
                <Sparkles className="w-3 h-3" />
                Önerilen
              </div>
            </div>
          )}

          {/* Favori Butonu */}
          <button
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading}
            className={`absolute top-3 right-3 z-10 rounded-full w-9 h-9 flex items-center justify-center transition-all duration-300 backdrop-blur-md active:scale-90 ${isFavorite(product.Id)
                ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/40 border border-pink-400/30'
                : 'bg-white/90 text-gray-600 border border-gray-200/50 hover:bg-white hover:text-pink-500'
              } disabled:opacity-50`}
            title={isFavorite(product.Id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-300 ${isFavorite(product.Id) ? 'scale-110' : 'group-hover:scale-110'}`}
              fill={isFavorite(product.Id) ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        {/* Ürün Bilgileri */}
        <div className="p-4 flex flex-col gap-3 flex-grow">
          {/* Ürün Adı */}
          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-purple-700 transition-colors">
            {product.Name}
          </h3>

          {/* Alt kısım - Fiyat ve Buton */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-lg font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tabular-nums">
                {formatPrice(product.Price)} ₺
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isActive}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${isActive
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isActive ? (
                <>
                  <Plus className="w-4 h-4" strokeWidth={3} />
                  <span>Ekle</span>
                </>
              ) : (
                <span>Mevcut Değil</span>
              )}
            </button>
          </div>
        </div>

        {/* Inactive overlay */}
        {!isActive && (
          <div className="absolute inset-0 bg-gray-100/50 backdrop-blur-[1px] flex items-center justify-center">
            <div className="px-4 py-2 bg-gray-800/80 text-white text-sm font-bold rounded-full">
              Şu an mevcut değil
            </div>
          </div>
        )}
      </div>
    </>
  );
}

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
