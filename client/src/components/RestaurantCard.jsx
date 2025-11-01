import { useNavigate } from 'react-router-dom';
import { Utensils, Clock, Star, MapPin, TrendingUp, Heart, Zap, BadgePercent, ShoppingBag, ArrowRight } from 'lucide-react';
import { useState, memo, useCallback, useMemo } from 'react';

function RestaurantCard({ restaurant, showPromo = true }) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const getGradientClass = useCallback((color) => {
    // Renk kodunu normalize et (büyük-küçük harf farkını gidermek için)
    const normalizedColor = color ? color.toUpperCase() : null;
    
    switch (normalizedColor) {
      case '#EC4899':
        return 'from-pink-500 to-pink-600';
      case '#22C55E':
        return 'from-green-500 to-green-600';
      case '#1F2937':
        return 'from-gray-700 to-gray-800';
      default:
        return 'from-purple-500 to-purple-600';
    }
  }, []);

  // Veri yoksa varsayılan değerler - useMemo ile optimize et
  const deliveryTime = useMemo(() => restaurant.DeliveryTime || '30-45 dk', [restaurant.DeliveryTime]);
  const minOrder = useMemo(() => restaurant.MinOrder ? `${restaurant.MinOrder} ₺` : '50 ₺', [restaurant.MinOrder]);
  
  // Mock data - puan ve indirim (henüz API'de yok) - useMemo ile sabit tut
  const rating = useMemo(() => {
    // Restoran ID'sine göre sabit bir değer döndür (her render'da değişmesin)
    const seed = restaurant.Id || 0;
    return (4.2 + (seed % 100) / 100 * 0.6).toFixed(1);
  }, [restaurant.Id]);
  
  const discount = useMemo(() => {
    if (!showPromo) return null;
    const seed = restaurant.Id || 0;
    return seed % 3 === 0 ? 20 : null;
  }, [showPromo, restaurant.Id]);

  const handleFavoriteClick = useCallback((e) => {
    e.stopPropagation();
    setIsFavorite(prev => !prev);
  }, []);

  return (
    <div
      onClick={() => navigate(`/restaurant/${restaurant.Slug}`)}
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl active:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-white/40 hover:border-purple-300/60"
    >
      {/* Görsel - Daha Kompakt */}
      <div className="relative h-48 overflow-hidden">
        {restaurant.ImageUrl ? (
          <img
            src={restaurant.ImageUrl}
            alt={restaurant.Name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradientClass(restaurant.Color)} flex items-center justify-center`}>
            <Utensils className="w-20 h-20 text-white opacity-80" />
          </div>
        )}
        
        {/* Üst Overlay - Minimal */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {discount && (
            <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
              %{discount} İNDİRİM
            </div>
          )}
        </div>
        
        {/* Favori Butonu - Minimal */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 bg-white/95 backdrop-blur-md p-2 rounded-lg shadow-lg active:scale-90 transition-all hover:bg-white"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>

        {/* Rating - Minimal */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-bold text-gray-900">{rating}</span>
        </div>
      </div>

      {/* İçerik - Daha Temiz */}
      <div className="p-5 space-y-3">
        {/* Başlık */}
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
            {restaurant.Name}
          </h3>
          {restaurant.Description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {restaurant.Description}
            </p>
          )}
        </div>

        {/* Bilgiler - İkonlu Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Süre</div>
              <div className="font-semibold">{deliveryTime}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Min. Sipariş</div>
              <div className="font-semibold">{minOrder}</div>
            </div>
          </div>
        </div>

        {/* Buton - Daha Hareketli */}
        <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3.5 px-4 rounded-xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 shadow-md hover:shadow-xl hover:-translate-y-0.5 group">
          Menüyü Gör
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// Memo ile sarmala
export default memo(RestaurantCard, (prevProps, nextProps) => {
  return (
    prevProps.restaurant.Id === nextProps.restaurant.Id &&
    prevProps.restaurant.Name === nextProps.restaurant.Name &&
    prevProps.restaurant.ImageUrl === nextProps.restaurant.ImageUrl &&
    prevProps.restaurant.Slug === nextProps.restaurant.Slug &&
    prevProps.restaurant.DeliveryTime === nextProps.restaurant.DeliveryTime &&
    prevProps.restaurant.MinOrder === nextProps.restaurant.MinOrder &&
    prevProps.restaurant.Color === nextProps.restaurant.Color &&
    prevProps.showPromo === nextProps.showPromo
  );
});
