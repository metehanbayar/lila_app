import { useNavigate } from 'react-router-dom';
import { Utensils, Clock, Star, MapPin, TrendingUp, Heart, Zap, BadgePercent, ShoppingBag, ArrowRight } from 'lucide-react';
import { useState } from 'react';

function RestaurantCard({ restaurant, showPromo = true }) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const getGradientClass = (color) => {
    switch (color) {
      case '#EC4899':
        return 'from-pink-500 to-pink-600';
      case '#22C55E':
        return 'from-green-500 to-green-600';
      case '#1F2937':
        return 'from-gray-700 to-gray-800';
      default:
        return 'from-purple-500 to-purple-600';
    }
  };

  // Mock data
  const deliveryTime = '20-30 dk';
  const minOrder = '50 TL';
  const rating = (4.2 + Math.random() * 0.6).toFixed(1);
  const totalOrders = Math.floor(Math.random() * 500) + 100;
  const discount = showPromo ? (Math.floor(Math.random() * 3) === 0 ? 20 : null) : null;
  const freeDelivery = Math.floor(Math.random() * 2) === 0;
  const isPopular = Math.floor(Math.random() * 3) === 0;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div
      onClick={() => navigate(`/restaurant/${restaurant.Slug}`)}
      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl active:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group border-2 border-gray-100 hover:border-purple-200"
    >
      {/* Üst Kısım - Büyük Resim */}
      <div className="relative h-48 overflow-hidden">
        {restaurant.ImageUrl ? (
          <>
            <img
              src={restaurant.ImageUrl}
              alt={restaurant.Name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradientClass(restaurant.Color)} flex items-center justify-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
            <Utensils className="w-16 h-16 text-white opacity-90 relative z-10" />
          </div>
        )}
        
        {/* Badge'ler - Resim üstünde */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount && (
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-xl flex items-center gap-1 animate-pulse">
              <BadgePercent className="w-3.5 h-3.5" />
              %{discount} İNDİRİM
            </div>
          )}
          {isPopular && !discount && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-xl flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              POPÜLER
            </div>
          )}
          {freeDelivery && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-xl flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              ÜCRETSİZ
            </div>
          )}
        </div>
        
        {/* Favori Butonu */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-xl active:scale-90 transition-all hover:bg-white"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? 'fill-red-500 text-red-500 animate-pulse' : 'text-gray-600'
            }`}
          />
        </button>

        {/* Puan Badge - Sağ Alt */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-black text-gray-900">{rating}</span>
          <span className="text-xs text-gray-500">({totalOrders})</span>
        </div>
      </div>

      {/* Alt Kısım - Bilgiler */}
      <div className="p-4">
        {/* Restoran Adı */}
        <h3 className="font-black text-lg text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
          {restaurant.Name}
        </h3>

        {/* Açıklama */}
        {restaurant.Description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {restaurant.Description}
          </p>
        )}

        {/* Alt Bilgiler */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 font-semibold">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>{deliveryTime}</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className="font-semibold">Min. {minOrder}</span>
          {restaurant.Distance && (
            <>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1 text-purple-600 font-semibold">
                <MapPin className="w-4 h-4" />
                {restaurant.Distance}
              </div>
            </>
          )}
        </div>

        {/* CTA Butonu */}
        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg group-hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Hemen Sipariş Ver
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export default RestaurantCard;
