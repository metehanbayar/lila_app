import { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, Star, Sparkles, Gift, Percent, Utensils } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getRestaurants, getActivePromotions, getCategories, getFeaturedProducts } from '../services/api';
import FeaturedTicker from '../components/customer/FeaturedTicker';
import ProductDetailModal from '../components/ProductDetailModal';

// Kategori Butonu
const CategoryButton = memo(({ category, onClick }) => {
    // Dinamik ikon
    const IconComponent = LucideIcons[category.Icon] || LucideIcons.Utensils;

    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 min-w-[72px] transition-all duration-300 hover:scale-105 active:scale-95"
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${category.Color || 'bg-gray-500'}`}>
                <IconComponent className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center line-clamp-1 max-w-[72px]">
                {category.Name}
            </span>
        </button>
    );
});

// Kampanya Banner
const CampaignBanner = memo(({ campaigns, onCampaignClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (campaigns.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % campaigns.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [campaigns.length]);

    if (!campaigns || campaigns.length === 0) return null;

    return (
        <div className="px-4 mb-6">
            <div
                className="relative h-40 sm:h-48 rounded-3xl overflow-hidden cursor-pointer"
                onClick={() => onCampaignClick?.(campaigns[currentIndex])}
            >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500" />

                {/* Animated Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse" />
                    <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
                </div>

                {/* Content */}
                <div className="relative h-full flex items-center p-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                                <span className="text-white text-xs font-bold">🔥 Fırsat</span>
                            </div>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                            {campaigns[currentIndex].DiscountType === 'percentage'
                                ? `%${campaigns[currentIndex].DiscountValue} İndirim!`
                                : `${campaigns[currentIndex].DiscountValue}₺ Hediye!`}
                        </h2>

                        <p className="text-white/80 text-sm mb-3">
                            {campaigns[currentIndex].Description || 'Hemen sipariş ver, fırsatı kaçırma!'}
                        </p>

                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl">
                            <span className="text-purple-600 font-bold text-sm">
                                Kod: {campaigns[currentIndex].Code}
                            </span>
                        </div>
                    </div>

                    {/* Big Icon */}
                    <div className="hidden sm:flex w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl items-center justify-center">
                        {campaigns[currentIndex].DiscountType === 'percentage' ? (
                            <Percent className="w-12 h-12 text-white" />
                        ) : (
                            <Gift className="w-12 h-12 text-white" />
                        )}
                    </div>
                </div>

                {/* Indicators */}
                {campaigns.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {campaigns.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

// Modern Restoran Kartı
const RestaurantCard = memo(({ restaurant, onClick }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        >
            {/* Image Container */}
            <div className="relative h-36 sm:h-44 overflow-hidden">
                {restaurant.ImageUrl ? (
                    <>
                        {!imageLoaded && (
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse" />
                        )}
                        <img
                            src={restaurant.ImageUrl}
                            alt={restaurant.Name}
                            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            loading="lazy"
                            onLoad={() => setImageLoaded(true)}
                        />
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center">
                        <span className="text-white/50 text-5xl font-black">
                            {restaurant.Name?.charAt(0) || 'R'}
                        </span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md ${restaurant.IsActive
                        ? 'bg-green-500/90 text-white'
                        : 'bg-gray-800/90 text-gray-300'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${restaurant.IsActive ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
                        {restaurant.IsActive ? 'Açık' : 'Kapalı'}
                    </div>
                </div>

                {/* Featured Badge */}
                {restaurant.IsFeatured && (
                    <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
                            <Sparkles className="w-3 h-3" />
                            Popüler
                        </div>
                    </div>
                )}

                {/* Delivery Time on image */}
                {restaurant.DeliveryTime && (
                    <div className="absolute bottom-3 right-3">
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 shadow-lg">
                            <Clock className="w-3 h-3 text-purple-600" />
                            {restaurant.DeliveryTime}
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-purple-600 transition-colors">
                        {restaurant.Name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-lg flex-shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-amber-700">4.8</span>
                    </div>
                </div>

                {restaurant.Description && (
                    <p className="text-gray-500 text-sm line-clamp-1 mb-3">
                        {restaurant.Description}
                    </p>
                )}

                {/* Tags */}
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs font-medium rounded-lg">
                        Ücretsiz Teslimat
                    </span>
                    {restaurant.MinOrder && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                            Min. {restaurant.MinOrder}₺
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

// Skeletons
const CampaignSkeleton = memo(() => (
    <div className="px-4 mb-6">
        <div className="h-40 sm:h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl animate-pulse" />
    </div>
));

const CategorySkeleton = memo(() => (
    <div className="flex gap-4 px-4 mb-6 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
        ))}
    </div>
));

const RestaurantSkeleton = memo(() => (
    <div className="bg-white rounded-3xl overflow-hidden animate-pulse" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="h-36 sm:h-44 bg-gray-200" />
        <div className="p-4 space-y-3">
            <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="h-5 bg-gray-200 rounded w-12" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-24" />
                <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
        </div>
    </div>
));

function Home() {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [categories, setCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [restaurantsRes, campaignsRes, categoriesRes, featuredRes] = await Promise.all([
                getRestaurants(),
                getActivePromotions(),
                getCategories(),
                getFeaturedProducts()
            ]);

            if (restaurantsRes.success) {
                setRestaurants(restaurantsRes.data || []);
            } else {
                setError('Restoranlar yüklenemedi');
            }

            if (campaignsRes.success) {
                setCampaigns(campaignsRes.data || []);
            }

            if (categoriesRes.success) {
                // Sadece aktif kategorileri al ve sırala
                const activeCategories = (categoriesRes.data || [])
                    .filter(cat => cat.IsActive !== false)
                    .sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
                setCategories(activeCategories);
            }

            if (featuredRes.success) {
                setFeaturedProducts(featuredRes.data || []);
            }
        } catch (err) {
            console.error('Veri yüklenirken hata:', err);
            setError('Bağlantı hatası oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleRestaurantClick = useCallback((restaurant) => {
        if (restaurant.Slug) {
            navigate(`/restaurant/${restaurant.Slug}`);
        }
    }, [navigate]);

    const handleCampaignClick = useCallback((campaign) => {
        if (campaign.Code) {
            navigator.clipboard.writeText(campaign.Code);
        }
    }, []);

    const handleCategoryClick = useCallback((category) => {
        // Kategoriye tıklayınca arama sayfasına yönlendir
        navigate(`/search?q=${encodeURIComponent(category.Name)}`);
    }, [navigate]);

    const handleProductClick = useCallback((product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    }, []);

    const handleNextProduct = useCallback(() => {
        if (!selectedProduct || featuredProducts.length <= 1) return;
        const index = featuredProducts.findIndex(p => p.Id === selectedProduct.Id);
        const nextIndex = (index + 1) % featuredProducts.length;
        setSelectedProduct(featuredProducts[nextIndex]);
    }, [selectedProduct, featuredProducts]);

    const handlePrevProduct = useCallback(() => {
        if (!selectedProduct || featuredProducts.length <= 1) return;
        const index = featuredProducts.findIndex(p => p.Id === selectedProduct.Id);
        const prevIndex = (index - 1 + featuredProducts.length) % featuredProducts.length;
        setSelectedProduct(featuredProducts[prevIndex]);
    }, [selectedProduct, featuredProducts]);

    // Loading
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="pt-2">
                    <CampaignSkeleton />
                    <CategorySkeleton />
                    <div className="px-4">
                        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4].map((i) => <RestaurantSkeleton key={i} />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Bir Sorun Oluştu</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadData}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Kampanya Banner */}
            <div className="pt-2">
                <CampaignBanner
                    campaigns={campaigns}
                    onCampaignClick={handleCampaignClick}
                />
            </div>

            {/* Öne Çıkan Ürünler Ticker */}
            {featuredProducts.length > 0 && (
                <FeaturedTicker
                    products={featuredProducts}
                    onProductClick={handleProductClick}
                />
            )}

            {/* Kategoriler - API'den dinamik */}
            {categories.length > 0 && (
                <div className="mb-6">
                    <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                        {categories.map((category) => (
                            <CategoryButton
                                key={category.Id}
                                category={category}
                                onClick={() => handleCategoryClick(category)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Restoranlar */}
            <div className="px-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Yakınındaki Lila'lar</h2>
                        <p className="text-gray-500 text-sm">{restaurants.length} restoran bulundu</p>
                    </div>
                    <button className="text-purple-600 text-sm font-semibold flex items-center gap-1">
                        Filtrele <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {restaurants.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz Restoran Yok</h3>
                        <p className="text-gray-500">Yakında yeni mekanlar eklenecek.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {restaurants.map((restaurant) => (
                            <RestaurantCard
                                key={restaurant.Id}
                                restaurant={restaurant}
                                onClick={() => handleRestaurantClick(restaurant)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Ürün Detay Modal */}
            <ProductDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                onNext={handleNextProduct}
                onPrevious={handlePrevProduct}
                canGoNext={featuredProducts.length > 1}
                canGoPrevious={featuredProducts.length > 1}
            />
        </div>
    );
}

export default Home;
