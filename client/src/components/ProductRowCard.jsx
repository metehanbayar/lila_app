import { Heart } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { addToFavorites, removeFromFavorites } from '../services/customerApi';

// Güvenli fiyat
const formatPrice = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

function ProductRowCard({ product, onProductClick, onAddToCart }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated, isFavorite, addToFavoritesLocal, removeFromFavoritesLocal } = useCustomerStore();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // sepete ekle
  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!product.IsActive) return; // Pasif ürünleri sepete ekleme
    addItem(product);
    onAddToCart?.(product); // parent'a bildir
  };

  // ürün detay / modal açma
  const handleCardClick = () => {
    if (onProductClick) onProductClick(product);
  };

  // favori toggle
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

  return (
    <>
      {/* Kartın kendisi */}
      <div
        className={`
          rounded-xl
          border
          shadow-sm
          p-3
          flex
          gap-3
          relative
          active:opacity-90
          transition
          select-none
          touch-manipulation
          ${product.IsActive 
            ? 'bg-white border-gray-200' 
            : 'bg-gray-50 border-gray-300 opacity-75'
          }
        `}
        onClick={handleCardClick}
      >
        {/* SOL: görsel blok */}
        <div className="relative w-[88px] h-[88px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {product.ImageUrl ? (
            <img
              src={product.ImageUrl}
              alt={product.Name}
              className={`w-full h-full object-cover ${
                !product.IsActive ? 'grayscale opacity-60' : ''
              }`}
              loading="lazy"
              decoding="async"
              width={88}
              height={88}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[11px] gap-2">
              <svg
                className="w-6 h-6 text-gray-400"
                viewBox="0 0 24 24"
                stroke="currentColor"
                fill="none"
                strokeWidth="1.5"
              >
                <path d="M3 3h18v18H3z" />
                <path d="M3 16l5-5 4 4 5-5 4 4" />
              </svg>
              <span className="text-[10px] text-gray-500 font-medium">
                Görsel Yok
              </span>
            </div>
          )}

          {/* Favori kalp */}
          <button
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading}
            className={`
              absolute top-2 right-2
              w-7 h-7 rounded-full flex items-center justify-center
              text-[11px]
              active:scale-95
              transition
              border
              ${isFavorite(product.Id)
                ? 'bg-pink-600 text-white border-pink-600'
                : 'bg-white/90 text-gray-700 border-white/60'}
              ${isFavoriteLoading ? 'opacity-70 animate-pulse' : ''}
            `}
          >
            <Heart
              className="w-4 h-4"
              fill={isFavorite(product.Id) ? 'currentColor' : 'none'}
            />
          </button>

          {/* Önerilen badge */}
          {product.IsFeatured && (
            <div className="
              absolute bottom-2 left-2
              bg-gradient-to-r from-purple-600 to-pink-500
              text-white text-[10px] font-bold
              px-2 py-0.5 rounded-full
              border border-white/20
            ">
              Önerilen
            </div>
          )}
        </div>

        {/* SAĞ: içerik */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* isim */}
          <div className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2">
            {product.Name}
          </div>

          {/* açıklama varsa göster, yoksa pas geç */}
          {product.Description && (
            <div className="text-[12px] text-gray-500 leading-snug line-clamp-2 mt-1">
              {product.Description}
            </div>
          )}

          {/* fiyat + ekle */}
          <div className="flex items-end justify-between mt-auto pt-2">
            <div className="text-[14px] font-bold text-pink-600 tabular-nums">
              {formatPrice(product.Price)} ₺
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(e);
              }}
              disabled={!product.IsActive}
              className={`
                text-[11px] font-bold
                px-3 py-1.5 rounded-lg
                border
                flex items-center gap-1
                active:scale-95
                transition
                ${product.IsActive
                  ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white border-white/30'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                }
              `}
            >
              <span className={`text-[12px] leading-none font-bold ${
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

export default React.memo(ProductRowCard);

