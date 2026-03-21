import { Heart, Plus, Sparkles, ChevronRight } from 'lucide-react';
import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { addToFavorites, removeFromFavorites } from '../services/customerApi';

const formatPrice = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

function ProductRowCard({ product, onProductClick, onAddToCart }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated, isFavorite, addToFavoritesLocal, removeFromFavoritesLocal } = useCustomerStore();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Ürünün varyantları var mı kontrol et
  const hasVariants = product.variants && product.variants.length > 1;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!product.IsActive && product.IsActive !== undefined) return;

    // Eğer varyant varsa modal aç (kullanıcı seçenek seçsin)
    if (hasVariants) {
      if (onProductClick) onProductClick(product);
      return;
    }

    // Varyant yoksa direkt sepete ekle
    addItem(product);
    onAddToCart?.(product);
  };

  const handleCardClick = () => {
    if (onProductClick) onProductClick(product);
  };

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsFavoriteLoading(true);
    const fav = isFavorite(product.Id);
    try {
      if (fav) {
        await removeFromFavorites(product.Id);
        removeFromFavoritesLocal(product.Id);
      } else {
        await addToFavorites(product.Id);
        addToFavoritesLocal(product.Id);
      }
    } catch (err) {
      console.error('Favori işlemi hatası:', err);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const isFav = isFavorite(product.Id);
  const isActive = product.IsActive !== false;

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.98] touch-manipulation ${isActive ? 'bg-white hover:shadow-lg' : 'bg-gray-50 opacity-70'
        }`}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      onClick={handleCardClick}
    >
      <div className="flex gap-3 p-3">
        {/* Görsel */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {product.ImageUrl ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse" />
              )}
              <img
                src={product.ImageUrl}
                alt={product.Name}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${!isActive ? 'grayscale' : ''
                  } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-3xl opacity-30">🍽️</span>
            </div>
          )}

          {/* Önerilen badge */}
          {product.IsFeatured && (
            <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold rounded-md shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Öne Çıkan</span>
            </div>
          )}

          {/* İndirim badge */}
          {product.OldPrice && product.OldPrice > product.Price && (
            <div className={`absolute ${product.IsFeatured ? 'top-7' : 'top-1.5'} left-1.5 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-md shadow-sm`}>
              %{Math.round(((product.OldPrice - product.Price) / product.OldPrice) * 100)} İndirim
            </div>
          )}

          {/* Favori butonu */}
          <button
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading}
            className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${isFav
              ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
              : 'bg-white/90 text-gray-500 hover:text-pink-500'
              } ${isFavoriteLoading ? 'opacity-50' : ''}`}
          >
            <Heart className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* İçerik */}
        <div className="flex-1 flex flex-col min-w-0 py-0.5">
          {/* İsim */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
            {product.Name}
          </h3>

          {/* Açıklama */}
          {product.Description && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-1">
              {product.Description}
            </p>
          )}

          {/* Varyant varsa bilgi göster */}
          {hasVariants && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded">
                {product.variants.length} seçenek
              </span>
            </div>
          )}

          {/* Fiyat ve Buton */}
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-purple-600">
                  {formatPrice(product.Price)} ₺
                </span>
                {product.OldPrice && product.OldPrice > product.Price && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {formatPrice(product.OldPrice)} ₺
                  </span>
                )}
              </div>
              {hasVariants && (
                <span className="text-[10px] text-gray-400">başlayan</span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isActive}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${isActive
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20 hover:shadow-purple-500/40'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isActive ? (
                hasVariants ? (
                  <>
                    <span>Seç</span>
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                    <span>Ekle</span>
                  </>
                )
              ) : (
                <span>Mevcut Değil</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hover shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
    </div>
  );
}

export default memo(ProductRowCard);
