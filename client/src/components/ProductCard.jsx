import { Plus, ImageOff, Heart } from 'lucide-react';
import { useState } from 'react';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { addToFavorites, removeFromFavorites } from '../services/customerApi';

function ProductCard({ product, onProductClick }) {
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated, isFavorite, addToFavoritesLocal, removeFromFavoritesLocal } = useCustomerStore();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Modal açılmasını engelle
    addItem(product);
  };

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleFavoriteToggle = async (e) => {
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
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      {/* Ürün Görseli */}
      <div className="relative h-32 sm:h-48 bg-gray-100 overflow-hidden">
        {product.ImageUrl ? (
          <img
            src={product.ImageUrl}
            alt={product.Name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ImageOff className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {product.IsFeatured && (
          <div className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
            Önerilen
          </div>
        )}
        {/* Favori Butonu */}
        <button
          onClick={handleFavoriteToggle}
          disabled={isFavoriteLoading}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isFavorite(product.Id)
              ? 'bg-red-500 text-white'
              : 'bg-white bg-opacity-90 text-gray-600 hover:bg-opacity-100'
          } disabled:opacity-50`}
          title={isFavorite(product.Id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
        >
          <Heart
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill={isFavorite(product.Id) ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Ürün Bilgileri */}
      <div className="p-2 sm:p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-sm sm:text-lg text-gray-800 mb-1 sm:mb-2 leading-snug break-words">
          {product.Name}
        </h3>
        {/* Açıklama kaldırıldı */}

        {/* Fiyat ve Buton - Alt kısımda sabit konum */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="text-sm sm:text-2xl font-bold text-primary">
            {product.Price.toFixed(2)} ₺
          </div>
          <button
            onClick={handleAddToCart}
            className="bg-primary hover:bg-primary-dark text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 transition-colors duration-200 active:scale-95"
          >
            <Plus className="w-3 h-3 sm:w-5 sm:h-5" />
            <span className="font-medium text-xs sm:text-sm">Ekle</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

