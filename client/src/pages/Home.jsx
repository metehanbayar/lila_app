import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurants, getCategories, getActivePromotions } from '../services/api';
import RestaurantCard from '../components/RestaurantCard';
import Loading from '../components/Loading';
import { safeSetTimeout, safeClearTimeout } from '../utils/performance';
import {
  // Statik kullanılan ikonlar (ana sayfa UI'da direkt kullanılanlar)
  TrendingUp,
  Gift,
  ArrowRight,
  ChevronRight,
  Timer,
  ShoppingBag,
  Award,
  BadgePercent,
  // Kategori ikonları whitelist (backend'den gelen icon adlarına göre kullanılacak)
  Pizza, Utensils, ChefHat, Beef, Fish, Egg,
  Cake, Cookie, IceCream, Candy,
  Coffee, Beer, Wine, Milk,
  Apple, Banana, Cherry, Carrot,
  Flame, Sparkles,
  Star, Heart, Zap, Crown,
  ThumbsUp, Activity, Smile, Frown,
  ShoppingCart, Store, Package, Tag, CreditCard,
  DollarSign, Percent,
  Truck, Clock, MapPin, Home as HomeIcon, Navigation, Calendar,
  Map, Bike, AlertCircle,
  Phone, Mail, MessageCircle, Users, User, Bell, Send,
  PartyPopper, Music, Headphones, Radio, Tv, Camera, Video,
  Sun, Moon, Cloud, Umbrella, CloudRain, CloudSnow, Wind,
  Circle, Square, Triangle, Target, Shield, Flag, Settings,
  Upload, Download, Edit, Trash2, Plus, X, Check, Eye, EyeOff,
  Lock, Unlock, Key,
  Droplet, Snowflake, Bookmark, BookOpen, Globe, Compass,
  TrendingDown
} from 'lucide-react';

// İkon whitelist mapping - sadece gerekli ikonları bundle'a ekler
const ICON_MAP = {
  // Yemek
  Pizza, Utensils, ChefHat, Beef, Fish, Egg,
  // Tatlı
  Cake, Cookie, IceCream, Candy,
  // İçecek
  Coffee, Beer, Wine, Milk,
  // Meyve & Sebze
  Apple, Banana, Cherry, Carrot,
  // Özel
  Flame, Sparkles,
  // Popüler
  Star, Heart, Gift, Award, Zap, TrendingUp, Crown, TrendingDown,
  ThumbsUp, Activity, Smile, Frown,
  // Alışveriş
  ShoppingBag, ShoppingCart, Store, Package, Tag, CreditCard,
  BadgePercent, DollarSign, Percent,
  // Teslimat
  Truck, Clock, Timer, MapPin, HomeIcon, Navigation, Calendar, Map, Bike, AlertCircle,
  // İletişim
  Phone, Mail, MessageCircle, Users, User, Bell, Send,
  // Sosyal
  PartyPopper, Music, Headphones, Radio, Tv, Camera, Video,
  // Hava
  Sun, Moon, Cloud, Umbrella, CloudRain, CloudSnow, Wind,
  // UI
  Circle, Square, Triangle, Target, Shield, Flag, Settings,
  Upload, Download, Edit, Trash2, Plus, X, Check, Eye, EyeOff,
  Lock, Unlock, Key,
  // Ekstra
  Droplet, Snowflake, Bookmark, BookOpen, Globe, Compass
};

// İkon adı uyuşmazlıklarını çözmek için alias tablosu
const ICON_ALIASES = {
  Home: 'HomeIcon',
  'shopping-bag': 'ShoppingBag',
  'badge-percent': 'BadgePercent',
  'percent': 'BadgePercent',
  'gift-box': 'Gift',
};

// İkon adını normalize et: "shopping-bag", "shopping_bag", "Shopping bag" -> "ShoppingBag"
const normalizeIconName = (raw) => {
  if (!raw || typeof raw !== 'string') return 'Utensils';
  
  // Önce alias tablosuna bak
  if (ICON_ALIASES[raw]) return ICON_ALIASES[raw];
  
  // Kısa çizgi, underscore, boşluk gibi karakterleri kaldır ve PascalCase'e çevir
  const cleaned = raw.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  const pascal = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  // Normalize edilmiş isim için de alias kontrolü yap
  return ICON_ALIASES[pascal] ?? pascal;
};

// İkon bileşenini al (whitelist üzerinden + normalize + alias desteği)
const getIconComponent = (iconName) => {
  const name = normalizeIconName(iconName);
  return ICON_MAP[name] || ICON_MAP.Utensils;
};

// Clipboard API için güvenli wrapper - fallback ile
const copyToClipboard = async (text) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* no-op, fallback'a düş */
  }
  
  // Fallback: eski execCommand yöntemi
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(el);
  return ok;
};

// Kategori renklerinin whitelist mapping'i - Tailwind purge problemi için
// Backend'den gelen dinamik color değerleri yok olmaması için tüm geçerli renkleri burada listele
const CATEGORY_COLOR_MAP = {
  'bg-purple-500': 'bg-purple-500',
  'bg-pink-500': 'bg-pink-500',
  'bg-red-500': 'bg-red-500',
  'bg-orange-500': 'bg-orange-500',
  'bg-yellow-500': 'bg-yellow-500',
  'bg-lime-500': 'bg-lime-500',
  'bg-green-500': 'bg-green-500',
  'bg-emerald-500': 'bg-emerald-500',
  'bg-teal-500': 'bg-teal-500',
  'bg-cyan-500': 'bg-cyan-500',
  'bg-blue-500': 'bg-blue-500',
  'bg-indigo-500': 'bg-indigo-500',
  'bg-violet-500': 'bg-violet-500',
  'bg-fuchsia-500': 'bg-fuchsia-500',
  'bg-rose-500': 'bg-rose-500',
  'bg-amber-600': 'bg-amber-600',
  'bg-gray-500': 'bg-gray-500',
  'bg-slate-600': 'bg-slate-600',
  // Gradient renkler
  'bg-gradient-to-br from-purple-500 to-pink-500': 'bg-gradient-to-br from-purple-500 to-pink-500',
  'bg-gradient-to-br from-blue-500 to-cyan-500': 'bg-gradient-to-br from-blue-500 to-cyan-500',
  'bg-gradient-to-br from-orange-500 to-red-500': 'bg-gradient-to-br from-orange-500 to-red-500',
  'bg-gradient-to-br from-green-500 to-emerald-500': 'bg-gradient-to-br from-green-500 to-emerald-500',
  'bg-gradient-to-br from-indigo-500 to-purple-500': 'bg-gradient-to-br from-indigo-500 to-purple-500',
  'bg-gradient-to-br from-pink-500 to-orange-500': 'bg-gradient-to-br from-pink-500 to-orange-500',
  'bg-gradient-to-br from-red-600 to-red-800': 'bg-gradient-to-br from-red-600 to-red-800',
  'bg-gradient-to-br from-amber-700 to-amber-900': 'bg-gradient-to-br from-amber-700 to-amber-900',
  'bg-gradient-to-br from-amber-800 to-amber-900': 'bg-gradient-to-br from-amber-800 to-amber-900',
  'bg-gradient-to-br from-pink-600 to-purple-700': 'bg-gradient-to-br from-pink-600 to-purple-700',
  'bg-gradient-to-br from-yellow-600 to-orange-700': 'bg-gradient-to-br from-yellow-600 to-orange-700',
  'bg-gradient-to-br from-green-600 to-emerald-700': 'bg-gradient-to-br from-green-600 to-emerald-700',
  'bg-gradient-to-br from-blue-500 to-cyan-600': 'bg-gradient-to-br from-blue-500 to-cyan-600',
  'bg-gradient-to-br from-yellow-500 to-amber-600': 'bg-gradient-to-br from-yellow-500 to-amber-600',
  'bg-gradient-to-br from-orange-600 to-red-600': 'bg-gradient-to-br from-orange-600 to-red-600',
  'bg-gradient-to-br from-red-600 to-orange-600': 'bg-gradient-to-br from-red-600 to-orange-600',
  'bg-gradient-to-br from-purple-600 to-indigo-600': 'bg-gradient-to-br from-purple-600 to-indigo-600',
  'bg-gradient-to-br from-green-600 to-emerald-600': 'bg-gradient-to-br from-green-600 to-emerald-600',
  'bg-gradient-to-br from-red-600 to-pink-600': 'bg-gradient-to-br from-red-600 to-pink-600',
  'bg-gradient-to-br from-orange-500 to-red-600': 'bg-gradient-to-br from-orange-500 to-red-600',
  'bg-gradient-to-br from-gray-600 to-gray-800': 'bg-gradient-to-br from-gray-600 to-gray-800',
};

function Home() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);

  const didFetchRef = useRef(false);

  // 1. ÖNCE loadData tanımlanmalı (Temporal Dead Zone'u önlemek için)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Core data: restaurants ve categories kritik, Promise.all kullan
      const [restaurantsResponse, categoriesResponse] = await Promise.all([
        getRestaurants(),
        getCategories()
      ]);
      if (restaurantsResponse.success) {
        setRestaurants(restaurantsResponse.data);
      }
      if (categoriesResponse.success && categoriesResponse.data) {
        const formattedCategories = [
          { id: 'all', name: 'Tümü', icon: 'Utensils', color: 'bg-purple-500' },
          ...categoriesResponse.data.map(cat => {
            // Backend'den gelen color'ı whitelist üzerinden güvenli hale getir
            const safeColor = CATEGORY_COLOR_MAP[cat.Color] ?? 'bg-gray-500';
            return {
              id: cat.Id,
              name: cat.Name,
              icon: cat.Icon || 'Utensils',
              color: safeColor
            };
          })
        ];
        setCategories(formattedCategories);
      } else {
        setCategories([
          { id: 'all', name: 'Tümü', icon: 'Utensils', color: 'bg-purple-500' }
        ]);
      }

      // Promotions ayrı try-catch: crash etmezse problem yok
      try {
        const promotionsResponse = await getActivePromotions();
        
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
          const hasExpiry = Boolean(coupon.ValidUntil);
          
          if (coupon.ValidUntil) {
            const now = Date.now();
            const end = new Date(coupon.ValidUntil).getTime();
            const diffMs = end - now;
            
            // Defensive guard: backend bug'ı olsa bile expired kampanya göstermeyelim
            if (diffMs > 0) {
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
            hasExpiry: hasExpiry,
          };
        }).filter(p => !p.hasExpiry || p.timeLeft !== null); // Sadece süresi geçmiş olanları gizle; süresizleri göster
        setPromotions(formattedPromotions);
      } else {
        setPromotions([]);
      }
      } catch (promoErr) {
        // Promosyon patlarsa page yine çalışır, sadece promosyon gösterilmez
        console.error('Promosyonlar yüklenemedi:', promoErr);
        setPromotions([]);
      }
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
      setError('Veriler yüklenirken bir hata oluştu');
      setCategories([
        { id: 'all', name: 'Tümü', icon: 'Utensils', color: 'bg-purple-500' }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. loadData tanımlandıktan SONRA useEffect
  useEffect(() => {
    if (didFetchRef.current) return; // Prevent double-invocation in React Strict Mode (dev)
    didFetchRef.current = true;
    loadData();
  }, [loadData]);

  // 3. Toast timeout cleanup to avoid state updates after unmount
  useEffect(() => {
    let timeoutId;
    if (copiedCode) {
      timeoutId = safeSetTimeout(() => setCopiedCode(null), 2000);
    }
    return () => {
      if (timeoutId) safeClearTimeout(timeoutId);
    };
  }, [copiedCode]);

  // Filtreleme yok şu an ama gelecekte olabilir - useMemo ile hazır tut
  const filteredRestaurants = useMemo(() => restaurants, [restaurants]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="px-4 py-16">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-[clamp(0.75rem,2vw,1rem)] text-[clamp(0.875rem,3.5vw,1rem)]">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50">
      {/* Hero Section - Karşılama Bölümü */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 px-4 sm:px-6 pt-8 sm:pt-12 pb-[calc(env(safe-area-inset-bottom)+48px)] sm:pb-[calc(env(safe-area-inset-bottom)+64px)] relative overflow-hidden">
        {/* Dekoratif Arka Plan (daha hafif versiyon) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[8%] right-[10%] w-[120px] h-[120px] bg-white/20 rounded-full blur-2xl will-change-transform" />
          <div className="absolute bottom-[10%] left-[10%] w-[160px] h-[160px] bg-white/10 rounded-full blur-2xl will-change-transform" />
        </div>

        <div className="relative z-10">
          {/* Karşılama Mesajı */}
          <div className="text-white mb-4 sm:mb-6">
            <h1 className="text-[clamp(1.25rem,4vw,2rem)] sm:text-[clamp(1.5rem,5vw,2.5rem)] md:text-[clamp(1.75rem,5.5vw,3rem)] font-black mb-1">
              Lezzetin Tam Adresi! 🎉
            </h1>
            <p className="text-purple-100 text-[clamp(0.75rem,2.5vw,0.875rem)] sm:text-[clamp(0.875rem,3vw,1rem)]">
              Lila ailesi tek uygulamada.
            </p>
          </div>

          {/* CTA Butonları */}
          <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={() => navigate('/search')}
              className="flex-1 bg-white text-purple-600 py-3 sm:py-4 px-4 sm:px-6 rounded-[clamp(0.75rem,2vw,1rem)] sm:rounded-[clamp(1rem,2.5vw,1.5rem)] font-bold text-[clamp(0.75rem,2.5vw,0.875rem)] sm:text-[clamp(0.875rem,3vw,1rem)] shadow-lg hover:shadow-xl active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none transition-all flex items-center justify-center gap-2 sm:gap-3"
            >
              <ShoppingBag className="w-[clamp(1rem,4vw,1.25rem)] h-[clamp(1rem,4vw,1.25rem)]" />
              Sipariş Ver
              <ArrowRight className="w-[clamp(0.75rem,3vw,1rem)] h-[clamp(0.75rem,3vw,1rem)]" />
            </button>
            <button
              onClick={() => navigate('/search')}
              className="bg-white/20 sm:supports-[backdrop-filter]:backdrop-blur-sm text-white py-3 sm:py-4 px-4 sm:px-6 rounded-[clamp(0.75rem,2vw,1rem)] sm:rounded-[clamp(1rem,2.5vw,1.5rem)] font-bold text-[clamp(0.75rem,2.5vw,0.875rem)] sm:text-[clamp(0.875rem,3vw,1rem)] shadow-md hover:bg-white/30 active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-white/50 transition-all border border-white/20"
            >
              <Gift className="w-[clamp(1rem,4vw,1.25rem)] h-[clamp(1rem,4vw,1.25rem)]" />
            </button>
          </div>

          {/* Kullanıcı Avantajları */}
          <div className="grid grid-cols-3 gap-[2vw] sm:gap-[3vw]">
            <div className="bg-white/10 sm:supports-[backdrop-filter]:backdrop-blur-sm rounded-[clamp(0.5rem,1.5vw,0.75rem)] sm:rounded-[clamp(0.75rem,2vw,1rem)] p-[2vw] sm:p-[3vw] border border-white/15">
              <div className="w-[clamp(1.5rem,6vw,2rem)] h-[clamp(1.5rem,6vw,2rem)] sm:w-[clamp(2rem,8vw,2.5rem)] sm:h-[clamp(2rem,8vw,2.5rem)] bg-white/20 rounded-[clamp(0.5rem,1.5vw,0.75rem)] flex items-center justify-center mb-2 sm:mb-3">
                <Timer className="w-[clamp(0.75rem,3vw,1rem)] h-[clamp(0.75rem,3vw,1rem)] sm:w-[clamp(1rem,4vw,1.25rem)] sm:h-[clamp(1rem,4vw,1.25rem)] text-white" />
              </div>
              <p className="text-white font-bold text-[clamp(0.625rem,2vw,0.75rem)] sm:text-[0.75rem]">Hızlı Teslimat</p>
              <p className="text-purple-100 text-[clamp(0.5rem,1.8vw,0.625rem)] sm:text-[clamp(0.625rem,2.5vw,0.75rem)]">30 dk içinde</p>
            </div>
            <div className="bg-white/10 sm:supports-[backdrop-filter]:backdrop-blur-sm rounded-[clamp(0.5rem,1.5vw,0.75rem)] sm:rounded-[clamp(0.75rem,2vw,1rem)] p-[2vw] sm:p-[3vw] border border-white/15">
              <div className="w-[clamp(1.5rem,6vw,2rem)] h-[clamp(1.5rem,6vw,2rem)] sm:w-[clamp(2rem,8vw,2.5rem)] sm:h-[clamp(2rem,8vw,2.5rem)] bg-white/20 rounded-[clamp(0.5rem,1.5vw,0.75rem)] flex items-center justify-center mb-2 sm:mb-3">
                <Award className="w-[clamp(0.75rem,3vw,1rem)] h-[clamp(0.75rem,3vw,1rem)] sm:w-[clamp(1rem,4vw,1.25rem)] sm:h-[clamp(1rem,4vw,1.25rem)] text-white" />
              </div>
              <p className="text-white font-bold text-[clamp(0.625rem,2vw,0.75rem)] sm:text-[0.75rem]">Kaliteli Hizmet</p>
              <p className="text-purple-100 text-[clamp(0.5rem,1.8vw,0.625rem)] sm:text-[clamp(0.625rem,2.5vw,0.75rem)]">%99 memnuniyet</p>
            </div>
            <div className="bg-white/10 sm:supports-[backdrop-filter]:backdrop-blur-sm rounded-[clamp(0.5rem,1.5vw,0.75rem)] sm:rounded-[clamp(0.75rem,2vw,1rem)] p-[2vw] sm:p-[3vw] border border-white/15">
              <div className="w-[clamp(1.5rem,6vw,2rem)] h-[clamp(1.5rem,6vw,2rem)] sm:w-[clamp(2rem,8vw,2.5rem)] sm:h-[clamp(2rem,8vw,2.5rem)] bg-white/20 rounded-[clamp(0.5rem,1.5vw,0.75rem)] flex items-center justify-center mb-2 sm:mb-3">
                <BadgePercent className="w-[clamp(0.75rem,3vw,1rem)] h-[clamp(0.75rem,3vw,1rem)] sm:w-[clamp(1rem,4vw,1.25rem)] sm:h-[clamp(1rem,4vw,1.25rem)] text-white" />
              </div>
              <p className="text-white font-bold text-[clamp(0.625rem,2vw,0.75rem)] sm:text-[0.75rem]">Kampanyalar</p>
              <p className="text-purple-100 text-[clamp(0.5rem,1.8vw,0.625rem)] sm:text-[clamp(0.625rem,2.5vw,0.75rem)]">Her gün yeni</p>
            </div>
          </div>

          {/* Canlı Sipariş Sayacı kaldırıldı */}
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-4 sm:-mt-6">
        {/* Büyük Kampanyalar */}
        {promotions.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 scrollbar-hide snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [touch-action:pan-x] overscroll-x-contain">
              {promotions.map((promo) => {
                const Icon = promo.icon;
                return (
                  <div
                    key={promo.id}
                    className={`flex-shrink-0 w-[35vw] sm:w-[30vw] md:w-[28vw] lg:w-[24vw] max-w-[200px] ${promo.bgColor} rounded-[clamp(0.5rem,1.5vw,0.75rem)] sm:rounded-[clamp(0.75rem,2vw,1rem)] p-[2vw] sm:p-[2.5vw] text-white shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer border-2 border-white relative overflow-hidden group snap-start`}
                  >
                    {/* Dekoratif Arka Plan */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
                      <div className="absolute top-0 right-0 w-[20vw] h-[20vw] sm:w-[15vw] sm:h-[15vw] max-w-[80px] max-h-[80px] bg-white rounded-full blur-2xl will-change-transform"></div>
                    </div>

                    <div className="relative z-10">
                      {/* Süre Badge */}
                      {promo.timeLeft && (
                        <div className="absolute -top-2 -right-[1vw] bg-white text-gray-900 px-[1.2vw] py-0.5 rounded-full text-[clamp(0.4rem,1.3vw,0.45rem)] font-bold shadow-lg flex items-center gap-[0.5vw]">
                          <Timer className="w-[clamp(0.45rem,1.8vw,0.5rem)] h-[clamp(0.45rem,1.8vw,0.5rem)] text-red-500" />
                          {promo.timeLeft}
                        </div>
                      )}

                      <div className="flex items-start gap-[1.5vw] sm:gap-[2vw] mb-2 sm:mb-3">
                        <div className="p-[0.75vw] sm:p-[1vw] bg-white/20 rounded-[clamp(0.5rem,1.5vw,0.75rem)] sm:supports-[backdrop-filter]:backdrop-blur-sm flex-shrink-0">
                          <Icon className="w-[clamp(0.75rem,3vw,0.875rem)] h-[clamp(0.75rem,3vw,0.875rem)] sm:w-[clamp(0.875rem,3.5vw,1rem)] sm:h-[clamp(0.875rem,3.5vw,1rem)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[clamp(0.45rem,1.8vw,0.5rem)] sm:text-[clamp(0.5rem,2vw,0.5625rem)] text-white/80 mb-0.5 truncate">{promo.subtitle}</p>
                          <h3 className="font-black text-[clamp(0.625rem,2.5vw,0.75rem)] sm:text-[clamp(0.75rem,3vw,0.875rem)] mb-0.5 line-clamp-1">{promo.title}</h3>
                          <div className="flex items-end gap-[0.5vw] sm:gap-[1vw] mb-1.5">
                            <p className="text-[clamp(1rem,4vw,1.25rem)] sm:text-[clamp(1.25rem,5vw,1.5rem)] font-black leading-none">{promo.discount}</p>
                            <p className="text-[clamp(0.5rem,2vw,0.5625rem)] sm:text-[clamp(0.5625rem,2.25vw,0.625rem)] font-bold mb-0.5">İNDİRİM</p>
                          </div>
                          {promo.desc && (
                            <p className="text-[clamp(0.45rem,1.8vw,0.5rem)] sm:text-[clamp(0.5rem,2vw,0.5625rem)] text-white/90 truncate">{promo.desc}</p>
                          )}
                          {promo.minOrder && (
                            <p className="text-[clamp(0.45rem,1.8vw,0.5rem)] sm:text-[clamp(0.5rem,2vw,0.5625rem)] text-white/90 truncate">{promo.minOrder}</p>
                          )}
                        </div>
                      </div>


                      {promo.code && (
                        <div className="bg-white/20 sm:supports-[backdrop-filter]:backdrop-blur-sm border-2 border-white/40 rounded-[clamp(0.375rem,1.2vw,0.5rem)] sm:rounded-[clamp(0.5rem,1.5vw,0.75rem)] px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[clamp(0.4rem,1.6vw,0.45rem)] sm:text-[clamp(0.45rem,1.8vw,0.5rem)] font-semibold text-white/80 mb-0.5">KUPON KODU</p>
                            <p className="font-mono font-black text-[clamp(0.5rem,2vw,0.5625rem)] sm:text-[clamp(0.5625rem,2.25vw,0.625rem)] tracking-wide truncate">{promo.code}</p>
                          </div>
                          <button 
                            onClick={async () => {
                              const ok = await copyToClipboard(promo.code);
                              if (ok) setCopiedCode(promo.code);
                            }}
                            className="bg-white text-purple-600 px-2 sm:px-3 py-1 rounded-[clamp(0.375rem,1.2vw,0.5rem)] text-[clamp(0.4rem,1.6vw,0.45rem)] sm:text-[clamp(0.45rem,1.8vw,0.5rem)] font-bold hover:bg-purple-50 active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none transition-all flex-shrink-0"
                          >
                            {copiedCode === promo.code ? '✓' : 'Kopyala'}
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
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4 px-[0.5vw] sm:px-[1vw]">
              <div>
                <h3 className="text-[clamp(1.125rem,4.5vw,1.5rem)] sm:text-[clamp(1.25rem,5vw,1.75rem)] font-black text-gray-900">Kategoriler</h3>
                <p className="text-[clamp(0.625rem,2.5vw,0.75rem)] sm:text-[0.75rem] text-gray-500 mt-1 sm:mt-2">Lezzete göz at</p>
              </div>
              <button 
                onClick={() => navigate('/search')}
                className="text-purple-600 text-[clamp(0.75rem,3vw,0.875rem)] sm:text-[clamp(0.875rem,3.5vw,1rem)] font-bold flex items-center gap-[0.5vw] sm:gap-[1vw] hover:gap-[1vw] sm:hover:gap-[2vw] active:opacity-70 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none rounded-lg px-1 transition-all"
              >
                Tümünü Gör
                <ChevronRight className="w-[clamp(0.75rem,3vw,1rem)] h-[clamp(0.75rem,3vw,1rem)] sm:w-[clamp(1rem,4vw,1.25rem)] sm:h-[clamp(1rem,4vw,1.25rem)]" />
              </button>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 scrollbar-hide snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [touch-action:pan-x] overscroll-x-contain">
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
                    className="flex-shrink-0 group snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                  >
                    <div
                      className={`relative flex flex-col items-center gap-[1.5vw] sm:gap-[2vw] p-[2.5vw] sm:p-[3vw] rounded-[clamp(0.75rem,2vw,1rem)] sm:rounded-[clamp(1rem,2.5vw,1.5rem)] min-w-[20vw] sm:min-w-[18vw] md:min-w-[15vw] max-w-[120px] transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-300/30 scale-105'
                          : 'bg-white text-gray-700 hover:shadow-md hover:shadow-purple-100 border border-gray-200 shadow-sm hover:-translate-y-1 active:scale-95'
                      }`}
                    >
                      {/* Dekoratif arka plan efekti */}
                      {isSelected && (
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-0 left-0 w-[12vw] h-[12vw] sm:w-[16vw] sm:h-[16vw] max-w-[64px] max-h-[64px] bg-white rounded-full blur-xl"></div>
                          <div className="absolute bottom-0 right-0 w-[8vw] h-[8vw] sm:w-[12vw] sm:h-[12vw] max-w-[48px] max-h-[48px] bg-pink-300 rounded-full blur-xl"></div>
                        </div>
                      )}
                      
                      {/* İkon konteyneri */}
                      <div className="relative z-10">
                        <div
                          className={`w-[clamp(2.5rem,10vw,3rem)] h-[clamp(2.5rem,10vw,3rem)] sm:w-[clamp(3rem,12vw,3.5rem)] sm:h-[clamp(3rem,12vw,3.5rem)] rounded-[clamp(0.5rem,1.5vw,0.75rem)] sm:rounded-[clamp(0.75rem,2vw,1rem)] flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? 'bg-white/30'
                              : `${category.color} group-hover:scale-110 group-hover:rotate-3`
                          }`}
                        >
                          <Icon className={`w-[clamp(1.25rem,5vw,1.5rem)] h-[clamp(1.25rem,5vw,1.5rem)] sm:w-[clamp(1.5rem,6vw,2rem)] sm:h-[clamp(1.5rem,6vw,2rem)] ${
                            isSelected ? 'text-white' : 'text-white'
                          } transition-transform duration-300 group-hover:scale-110`} />
                        </div>
                      </div>
                      
                      {/* Kategori adı */}
                      <span className={`text-[clamp(0.625rem,2.5vw,0.75rem)] sm:text-[0.75rem] font-bold whitespace-nowrap z-10 relative ${
                        isSelected ? 'text-white' : 'text-gray-800 group-hover:text-purple-600'
                      } transition-colors duration-300`}>
                        {category.name}
                      </span>
                      
                      {/* Hover efekti için glow */}
                      {!isSelected && (
                        <div className="absolute inset-0 rounded-[clamp(0.75rem,2vw,1rem)] sm:rounded-[clamp(1rem,2.5vw,1.5rem)] bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Restoranlar Başlık */}
        <div className="mb-8 px-[1vw] flex items-center justify-between">
          <div>
            <h2 className="text-[clamp(1.125rem,4.5vw,1.5rem)] sm:text-[clamp(1.25rem,5vw,1.75rem)] font-black text-gray-900">Popüler Restoranlar</h2>
            <p className="text-[clamp(0.875rem,3.5vw,1rem)] text-gray-500 mt-2 flex items-center gap-[2vw]">
              <TrendingUp className="w-[clamp(1rem,4vw,1.25rem)] h-[clamp(1rem,4vw,1.25rem)] text-orange-500" />
              {filteredRestaurants.length} restoran seni bekliyor
            </p>
          </div>
        </div>

        {/* Restoranlar Grid */}
        {filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[6vw] sm:gap-[4vw] pb-[calc(env(safe-area-inset-bottom)+64px)]">
            {filteredRestaurants.map((restaurant, index) => (
              <div 
                key={restaurant.Id}
                className={index < 6 ? 'animate-fadeIn' : ''}
                style={index < 6 ? {animationDelay: `${index * 50}ms`} : undefined}
              >
                <RestaurantCard restaurant={restaurant} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[clamp(1.5rem,5vw,2rem)] border-2 border-gray-100 shadow-lg">
            <div className="w-[clamp(5rem,20vw,8rem)] h-[clamp(5rem,20vw,8rem)] bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-[clamp(2.5rem,10vw,4rem)] h-[clamp(2.5rem,10vw,4rem)] text-purple-600" />
            </div>
            <h3 className="text-[clamp(1.125rem,4.5vw,1.5rem)] sm:text-[clamp(1.25rem,5vw,1.75rem)] font-black text-gray-700 mb-4">
              Restoran Bulunamadı
            </h3>
            <p className="text-gray-500 text-[clamp(0.875rem,3.5vw,1rem)] mb-12 max-w-xs mx-auto">
              Şu anda gösterilecek restoran bulunmuyor.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="bg-purple-600 text-white px-6 sm:px-8 py-3 rounded-[clamp(0.75rem,2vw,1rem)] font-bold hover:bg-purple-700 active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none transition-all"
            >
              Restoranları Keşfet
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {copiedCode && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 animate-fadeIn bottom-[calc(env(safe-area-inset-bottom)+80px)]">
          <div className="bg-green-500 text-white px-4 sm:px-6 py-3 rounded-[clamp(0.75rem,2vw,1rem)] shadow-xl font-bold text-[clamp(0.875rem,3.5vw,1rem)] flex items-center gap-2 border-2 border-green-400">
            <div className="w-[clamp(1.25rem,5vw,1.75rem)] h-[clamp(1.25rem,5vw,1.75rem)] bg-white/30 rounded-full flex items-center justify-center">
              ✓
            </div>
            Kupon kodu kopyalandı!
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
