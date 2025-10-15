import { useState } from 'react';
import { 
  Search, ChevronDown, Info,
  // 🍕 Yemek İkonları - Sadece mevcut olanlar
  Pizza, Utensils, ChefHat, Beef, Fish, Egg,
  Cake, Cookie, IceCream, Candy,
  Coffee, Beer, Wine, Milk,
  Apple, Banana, Cherry, Carrot,
  // 🔥 Ekstra
  Flame, Sparkles,
  // Popüler İkonlar
  Star, Heart, Gift, Award, Zap, TrendingUp, Crown,
  ThumbsUp, TrendingDown, Activity, Smile, Frown,
  // Alışveriş ve E-ticaret
  ShoppingBag, ShoppingCart, Store, Package, Tag, CreditCard,
  BadgePercent, DollarSign, Percent,
  // Teslimat ve Zaman
  Truck, Clock, Timer, MapPin, Home, Navigation, Calendar,
  Map, Bike, AlertCircle,
  // İletişim
  Phone, Mail, MessageCircle, Users, User, Bell, Send,
  // Sosyal & Etkinlik
  PartyPopper, Music, Headphones, Radio, Tv, Camera, Video,
  // Hava & Doğa
  Sun, Moon, Cloud, Umbrella, CloudRain, CloudSnow, Wind,
  // UI & Genel
  Circle, Square, Triangle, Target, Shield, Flag, Settings,
  Upload, Download, Edit, Trash2, Plus, X, Check, Eye, EyeOff,
  Lock, Unlock, Key, Search as SearchIcon,
  // Özel
  Sparkle, Zap as Lightning, Flame as Fire, Droplet, Snowflake,
  Bookmark, BookOpen, Globe, Compass
} from 'lucide-react';

// İkon bileşenlerini bir nesne içinde topluyoruz
const ICON_COMPONENTS = {
  // Yemek İkonları
  Pizza, Utensils, ChefHat, Beef, Fish, Egg,
  // Tatlılar
  Cake, Cookie, IceCream, Candy,
  // İçecekler
  Coffee, Beer, Wine, Milk,
  // Sebze & Meyveler
  Apple, Banana, Cherry, Carrot,
  // Mutfak & Özel
  Flame, Fire,
  // Popüler
  Star, Heart, Sparkles, Gift, Award, Zap, TrendingUp, Crown,
  ThumbsUp, Activity, Smile,
  // Alışveriş
  ShoppingBag, ShoppingCart, Store, Package, Tag, CreditCard,
  BadgePercent, DollarSign, Percent,
  // Teslimat
  Truck, Clock, Timer, MapPin, Home, Navigation, Calendar, Map, Bike, AlertCircle,
  // İletişim
  Phone, Mail, MessageCircle, Users, User, Bell, Send,
  // Sosyal & Etkinlik
  PartyPopper, Music, Headphones, Radio, Tv, Camera, Video,
  // Hava & Doğa
  Sun, Moon, Cloud, Umbrella, CloudRain, CloudSnow, Wind,
  // UI & Genel
  Circle, Square, Triangle, Target, Shield, Flag, Settings,
  Upload, Download, Edit, Trash2, Plus, X, Check, Eye, EyeOff,
  Lock, Unlock, Key,
  // Özel
  Lightning, Droplet, Snowflake, Bookmark, BookOpen, Globe, Compass,
  Frown, TrendingDown, Sparkle, SearchIcon
};

// Kategorilere göre organize edilmiş ikon isimleri
const ICON_CATEGORIES = {
  '⭐ En Popüler': [
    'Pizza', 'Coffee', 'Star', 'Heart', 'Fire', 'Gift', 'Crown', 'Utensils', 'ChefHat', 'Sparkles'
  ],
  '🍕 Pizza & İtalyan': [
    'Pizza', 'Utensils', 'ChefHat', 'Flame'
  ],
  '🥩 Et & Tavuk': [
    'Beef', 'Flame', 'Fire'
  ],
  '🐟 Deniz Ürünleri': [
    'Fish', 'Flame'
  ],
  '🍰 Tatlılar & Pasta': [
    'Cake', 'Cookie', 'IceCream', 'Candy'
  ],
  '🥚 Kahvaltı': [
    'Egg', 'Coffee'
  ],
  '☕ Sıcak İçecekler': [
    'Coffee'
  ],
  '🍺 Soğuk İçecekler': [
    'Beer', 'Wine', 'Milk', 'Droplet'
  ],
  '🍎 Meyveler': [
    'Apple', 'Banana', 'Cherry'
  ],
  '🥕 Sebzeler': [
    'Carrot', 'Apple'
  ],
  '🔥 Mutfak & Pişirme': [
    'ChefHat', 'Flame', 'Fire', 'Utensils'
  ],
  '🛍️ Alışveriş & Fiyat': [
    'ShoppingBag', 'ShoppingCart', 'Store', 'Package', 'Tag', 
    'BadgePercent', 'Percent', 'DollarSign', 'CreditCard'
  ],
  '🚚 Teslimat & Konum': [
    'Truck', 'Bike', 'MapPin', 'Map', 'Navigation', 'Home', 'AlertCircle'
  ],
  '⏰ Zaman & Tarih': [
    'Clock', 'Timer', 'Calendar'
  ],
  '📞 İletişim & Sosyal': [
    'Phone', 'Mail', 'MessageCircle', 'Send', 'Bell', 'Users', 'User'
  ],
  '🎉 Etkinlik & Eğlence': [
    'PartyPopper', 'Music', 'Headphones', 'Radio', 'Tv', 'Camera', 'Video'
  ],
  '🌤️ Hava Durumu': [
    'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'Wind', 'Umbrella', 'Snowflake'
  ],
  '🌍 Seyahat & Keşif': [
    'Globe', 'Compass', 'Bookmark', 'BookOpen'
  ],
  '😊 İfadeler & Duygular': [
    'Smile', 'Frown', 'Activity', 'TrendingUp', 'TrendingDown', 'Zap'
  ],
  '🎨 Şekiller & Simgeler': [
    'Circle', 'Square', 'Triangle', 'Target', 'Shield', 'Flag'
  ],
  '🔧 Ayarlar & Araçlar': [
    'Settings', 'Key', 'Lock', 'Unlock', 'Eye', 'EyeOff', 'SearchIcon'
  ],
  '⚙️ İşlemler': [
    'Upload', 'Download', 'Edit', 'Trash2', 'Plus', 'X', 'Check'
  ]
};

// Tüm ikonları düz liste olarak al
const ALL_ICONS = Object.values(ICON_CATEGORIES).flat();

function IconPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('🍕 Yemekler');

  // Arama query'si varsa tüm ikonlarda ara, yoksa seçili kategoriden göster
  const getDisplayIcons = () => {
    if (searchQuery) {
      return ALL_ICONS.filter(icon => 
        icon.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return ICON_CATEGORIES[activeCategory] || [];
  };

  const displayIcons = getDisplayIcons();
  
  // Seçili ikonu göster - varsayılan Utensils
  const SelectedIconComponent = ICON_COMPONENTS[value] || Utensils;

  const handleIconSelect = (iconName) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        İkon Seçin *
      </label>
      
      {/* Seçili İkon Butonu */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-primary focus:outline-none focus:border-primary transition-colors bg-white flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/20 transition-all">
            <SelectedIconComponent className="w-7 h-7 text-gray-700 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-left">
            <span className="text-gray-900 font-semibold block">{value || 'İkon Seçin'}</span>
            <span className="text-xs text-gray-500">Kategori için ikon</span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* İkon Seçici Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
            {/* Arama */}
            <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İkon ara... (örn: pizza, coffee, star)"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Kategori Tab'leri - Sadece arama yoksa göster */}
            {!searchQuery && (
              <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 px-2 py-2 gap-1">
                {Object.keys(ICON_CATEGORIES).map((category) => {
                  const iconCount = ICON_CATEGORIES[category].length;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                        activeCategory === category
                          ? 'bg-primary text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category} <span className="opacity-70">({iconCount})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* İkon Grid'i */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {displayIcons.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">İkon bulunamadı</p>
                  <p className="text-xs text-gray-400 mt-1">Farklı bir arama terimi deneyin</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {displayIcons.map((iconName) => {
                    const IconComponent = ICON_COMPONENTS[iconName];
                    
                    if (!IconComponent) {
                      console.warn(`⚠️ İkon bulunamadı: ${iconName}`);
                      return null;
                    }
                    
                    const isSelected = value === iconName;
                    
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => handleIconSelect(iconName)}
                        className={`group relative p-4 rounded-xl transition-all hover:scale-110 ${
                          isSelected 
                            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        title={iconName}
                      >
                        <div className="flex items-center justify-center">
                          <IconComponent className={`w-6 h-6 ${
                            isSelected ? 'text-white' : 'text-gray-700'
                          }`} />
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {iconName}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Alt Bilgi */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-4 h-4" />
                <span>{displayIcons.length} ikon gösteriliyor</span>
              </div>
              {value && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Seçili:</span>
                  <span className="font-semibold text-primary">{value}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default IconPicker;
