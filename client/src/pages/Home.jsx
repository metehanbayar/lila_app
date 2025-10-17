import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurants, getCategories, getActivePromotions } from '../services/api';
import RestaurantCard from '../components/RestaurantCard';
import Loading from '../components/Loading';
import useCustomerStore from '../store/customerStore';
import {
  Clock,
  Star,
  Percent,
  TrendingUp,
  Heart,
  Gift,
  Users,
  ArrowRight,
  ChevronRight,
  Timer,
  ShoppingBag,
  Award,
  BadgePercent,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// İkon bileşenini al
const getIconComponent = (iconName) => {
  return LucideIcons[iconName] || LucideIcons.Utensils;
};

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerStore();
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await loadData();
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Canlı sipariş sayacı kaldırıldı

  // İlk ziyaret kontrolü
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited && !isAuthenticated) {
      setTimeout(() => setShowWelcomeModal(true), 2000);
      localStorage.setItem('hasVisited', 'true');
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [restaurantsResponse, categoriesResponse, promotionsResponse] = await Promise.all([
        getRestaurants(),
        getCategories(),
        getActivePromotions()
      ]);
      
      if (restaurantsResponse.success) {
        setRestaurants(restaurantsResponse.data);
      }
      
      if (categoriesResponse.success && categoriesResponse.data) {
        const formattedCategories = [
          { id: 'all', name: 'Tümü', icon: 'Utensils', color: 'bg-purple-500' },
          ...categoriesResponse.data.map(cat => ({
            ...cat,
            id: cat.Id,
            name: cat.Name,
            icon: cat.Icon || 'Utensils',
            color: cat.Color || 'bg-gray-500'
          }))
        ];
        setCategories(formattedCategories);
      } else {
        setCategories([
          { id: 'all', name: 'Tümü', icon: 'Utensils', color: 'bg-purple-500' }
        ]);
      }

      if (promotionsResponse.success && promotionsResponse.data) {
        // API'den gelen kuponları kampanya formatına çevir
        const formattedPromotions = promotionsResponse.data.map((coupon) => {
          // Renk mapping
          const bgColorMap = {
            'purple': 'bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500',
            'blue': 'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500',
            'orange': 'bg-gradient-to-br from-orange-600 via-orange-500 to-red-500',
            'green': 'bg-gradient-to-br from-green-600 via-green-500 to-emerald-500',
          };
          
          // İkon mapping
          const iconMap = {
            'gift': Gift,
            'shopping-bag': ShoppingBag,
            'percent': BadgePercent,
            'award': Award,
          };
          
          // Kalan süreyi hesapla
          let timeLeft = null;
          if (coupon.ValidUntil) {
            const now = new Date();
            const endDate = new Date(coupon.ValidUntil);
            const diffMs = endDate - now;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffDays > 0) {
              timeLeft = `${diffDays} gün kaldı`;
            } else if (diffHours > 0) {
              const remainingMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              timeLeft = `${diffHours} saat ${remainingMinutes} dakika`;
            } else {
              timeLeft = 'Bugün geçerli';
            }
          }

          return {
            id: coupon.Id,
            title: coupon.DisplayTitle || coupon.Description?.split('-')[0]?.trim() || 'Özel Kampanya',
            subtitle: coupon.DisplaySubtitle || coupon.Description?.split('-')[1]?.trim() || 'Kaçırma',
            discount: coupon.DiscountType === 'percentage' 
              ? `%${coupon.DiscountValue}` 
              : `${coupon.DiscountValue} ₺`,
            code: coupon.Code,
            desc: coupon.DiscountType === 'percentage' ? 'İndirim' : 'Sabit indirim',
            minOrder: coupon.MinimumAmount > 0 ? `${coupon.MinimumAmount} ₺ ve üzeri` : null,
            bgColor: bgColorMap[coupon.BgColor] || bgColorMap['purple'],
            icon: iconMap[coupon.IconType] || iconMap['gift'],
            timeLeft: timeLeft,
          };
        });
        setPromotions(formattedPromotions);
      }
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
      setError('Veriler yüklenirken bir hata oluştu');
      setCategories([
        { id: 'all', name: 'Tümü', icon: ShoppingBag, color: 'bg-purple-500' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    if (selectedCategory !== 'all') {
      return true;
    }
    
    return true;
  });

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50">
      {/* Hero Section - Karşılama Bölümü */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 px-4 pt-8 pb-12 relative overflow-hidden">
        {/* Dekoratif Arka Plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {/* Karşılama Mesajı */}
          <div className="text-white mb-6">
            <h1 className="text-2xl md:text-3xl font-black mb-2">
              Lezzetin Tam Adresi! 🎉
            </h1>
            <p className="text-purple-100 text-sm md:text-base">
              Lila ailesi tek uygulamada.
            </p>
          </div>

          {/* CTA Butonları */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => navigate('/search')}
              className="flex-1 bg-white text-purple-600 py-4 px-6 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Sipariş Ver
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/search')}
              className="bg-white/20 backdrop-blur-md text-white py-4 px-6 rounded-2xl font-bold text-sm shadow-lg hover:bg-white/30 active:scale-95 transition-all border border-white/30"
            >
              <Gift className="w-5 h-5" />
            </button>
          </div>

          {/* Kullanıcı Avantajları */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <Timer className="w-4 h-4 text-white" />
              </div>
              <p className="text-white font-bold text-xs">Hızlı Teslimat</p>
              <p className="text-purple-100 text-[10px]">30 dk içinde</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <Award className="w-4 h-4 text-white" />
              </div>
              <p className="text-white font-bold text-xs">Kaliteli Hizmet</p>
              <p className="text-purple-100 text-[10px]">%99 memnuniyet</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <BadgePercent className="w-4 h-4 text-white" />
              </div>
              <p className="text-white font-bold text-xs">Kampanyalar</p>
              <p className="text-purple-100 text-[10px]">Her gün yeni</p>
            </div>
          </div>

          {/* Canlı Sipariş Sayacı kaldırıldı */}
        </div>
      </div>

      <div className="px-4 -mt-6">
        {/* Büyük Kampanyalar */}
        {promotions.length > 0 && (
          <div className="mb-6">
            <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 scrollbar-hide">
              {promotions.map((promo) => {
                const Icon = promo.icon;
                return (
                  <div
                    key={promo.id}
                    className={`flex-shrink-0 w-[280px] sm:w-[320px] ${promo.bgColor} rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer border-2 sm:border-4 border-white relative overflow-hidden group`}
                  >
                    {/* Dekoratif Arka Plan */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10">
                      {/* Süre Badge */}
                      {promo.timeLeft && (
                        <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 bg-white text-gray-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold shadow-lg flex items-center gap-1">
                          <Timer className="w-3 h-3 text-red-500" />
                          {promo.timeLeft}
                        </div>
                      )}

                      <div className="flex items-start gap-3 mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-white/80 mb-0.5 sm:mb-1 truncate">{promo.subtitle}</p>
                          <h3 className="font-black text-base sm:text-lg mb-1 sm:mb-2 line-clamp-1">{promo.title}</h3>
                          <div className="flex items-end gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                            <p className="text-3xl sm:text-4xl font-black leading-none">{promo.discount}</p>
                            <p className="text-sm sm:text-base font-bold mb-0.5 sm:mb-1">İNDİRİM</p>
                          </div>
                          {promo.desc && (
                            <p className="text-xs sm:text-sm text-white/90 truncate">{promo.desc}</p>
                          )}
                          {promo.minOrder && (
                            <p className="text-xs sm:text-sm text-white/90 truncate">{promo.minOrder}</p>
                          )}
                        </div>
                      </div>
                      
                      {promo.code && (
                        <div className="bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] sm:text-[10px] font-semibold text-white/80 mb-0.5">KUPON KODU</p>
                            <p className="font-mono font-black text-sm sm:text-base tracking-wide truncate">{promo.code}</p>
                          </div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(promo.code);
                              alert('Kupon kodu kopyalandı!');
                            }}
                            className="bg-white text-purple-600 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold hover:bg-purple-50 active:scale-95 transition-all flex-shrink-0"
                          >
                            Kopyala
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Kategoriler */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-lg font-black text-gray-900">Kategoriler</h3>
              <button className="text-purple-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                Tümünü Gör
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {categories.map((category) => {
                const Icon = getIconComponent(category.icon);
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      if (category.id === 'all') {
                        setSelectedCategory('all');
                      } else {
                        // Kategoriye tıklandığında arama sayfasına yönlendir
                        navigate(`/search?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`);
                      }
                    }}
                    className={`flex-shrink-0 transition-all ${
                      isSelected ? 'scale-105' : 'hover:scale-105'
                    }`}
                  >
                    <div
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl ring-4 ring-purple-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-100 shadow-md'
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-white/20' : category.color
                        }`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs font-bold whitespace-nowrap">
                        {category.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Restoranlar Başlık */}
        <div className="mb-4 px-1 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Popüler Restoranlar</h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              {filteredRestaurants.length} restoran seni bekliyor
            </p>
          </div>
        </div>

        {/* Restoranlar Grid */}
        {filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 pb-8">
            {filteredRestaurants.map((restaurant, index) => (
              <div 
                key={restaurant.Id}
                className="animate-fadeIn"
                style={{animationDelay: `${index * 50}ms`}}
              >
                <RestaurantCard restaurant={restaurant} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-gray-100 shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-black text-gray-700 mb-2">
              Restoran Bulunamadı
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Şu anda gösterilecek restoran bulunmuyor.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 active:scale-95 transition-all"
            >
              Restoranları Keşfet
            </button>
          </div>
        )}
      </div>

      {/* İlk Sipariş Modal */}
      {showWelcomeModal && !isAuthenticated && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-sm w-full text-white relative shadow-2xl animate-scaleIn">
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-sm sm:text-base"
            >
              ✕
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Gift className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-2">İlk Siparişine Özel!</h3>
              <p className="text-purple-100 text-xs sm:text-sm mb-4 sm:mb-6">
                Hemen üye ol, ilk siparişinde %30 indirim kazan!
              </p>
              
              <div className="bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-[10px] sm:text-xs font-semibold text-white/80 mb-1">KUPON KODU</p>
                <p className="font-mono font-black text-lg sm:text-2xl tracking-wide">
                  {promotions.length > 0 ? promotions[0].code : 'ILKSIPARIS30'}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                  navigate('/register');
                }}
                className="w-full bg-white text-purple-600 py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold shadow-xl hover:shadow-2xl active:scale-95 transition-all mb-3 text-sm sm:text-base"
              >
                Hemen Üye Ol
              </button>
              
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="text-white/80 text-xs sm:text-sm hover:text-white transition-colors"
              >
                Daha Sonra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
