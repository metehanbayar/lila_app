import { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Star, Eye } from 'lucide-react';
import { getRestaurantBySlug, getProductsByRestaurant } from '../services/api';
import ProductDetailModal from '../components/ProductDetailModal';

// Skeleton Components
const HeroSkeleton = memo(() => (
    <div className="animate-pulse">
        <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300" />
        <div className="px-4 -mt-8 relative z-10">
            <div className="w-20 h-20 bg-gray-300 rounded-2xl mb-3" />
            <div className="h-6 bg-gray-200 rounded-lg w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded-lg w-32" />
        </div>
    </div>
));

const CategorySkeleton = memo(() => (
    <div className="flex gap-2 px-4 py-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-full flex-shrink-0" />
        ))}
    </div>
));

const ProductSkeleton = memo(() => (
    <div className="animate-pulse bg-white rounded-2xl p-3 flex gap-3">
        <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-auto" />
        </div>
    </div>
));

// View-only Product Card (sepet butonu yok)
const ViewProductCard = memo(({ product }) => {
    const hasVariants = product.variants && product.variants.length > 0;
    const defaultVariant = hasVariants ? product.variants.find(v => v.IsDefault) || product.variants[0] : null;
    const displayPrice = defaultVariant ? defaultVariant.Price : product.Price;

    return (
        <div
            onClick={() => product.onClick && product.onClick(product)}
            className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
        >
            {/* Image */}
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                {product.ImageUrl ? (
                    <img
                        src={product.ImageUrl}
                        alt={product.Name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                        🍽️
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                        {product.Name}
                    </h3>
                    {product.Description && (
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                            {product.Description}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div>
                        {hasVariants && (
                            <span className="text-[10px] text-gray-400 block">başlayan</span>
                        )}
                        <span className="text-primary font-bold text-base">
                            {displayPrice.toFixed(2)} ₺
                        </span>
                    </div>
                    {hasVariants && (
                        <span className="text-xs text-gray-400">
                            {product.variants.length} seçenek
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

function ViewMenu() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const categoryRefs = useRef({});
    const navbarRef = useRef(null);

    useEffect(() => {
        loadRestaurantData();
    }, [slug]);

    const productsByCategory = useMemo(() => {
        return categories.reduce((acc, category) => {
            acc[category.Id] = products.filter(p => p.CategoryId === category.Id);
            return acc;
        }, {});
    }, [categories, products]);

    const categoriesWithProducts = useMemo(() => {
        return categories.filter(category => {
            const categoryProducts = productsByCategory[category.Id] || [];
            return categoryProducts.length > 0;
        });
    }, [categories, productsByCategory]);

    // Set initial active category
    useEffect(() => {
        if (categoriesWithProducts.length > 0 && !activeCategory) {
            setActiveCategory(categoriesWithProducts[0].Id);
        }
    }, [categoriesWithProducts, activeCategory]);

    // Intersection Observer
    useEffect(() => {
        if (categoriesWithProducts.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) {
                    const newActiveId = parseInt(visible[0].target.dataset.categoryId);
                    if (newActiveId !== activeCategory) {
                        setActiveCategory(newActiveId);
                        const btn = navbarRef.current?.querySelector(`[data-cat="${newActiveId}"]`);
                        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                }
            },
            { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
        );

        Object.values(categoryRefs.current).forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [categoriesWithProducts, activeCategory]);

    const scrollToCategory = useCallback((categoryId) => {
        const el = categoryRefs.current[categoryId];
        if (!el) return;
        const offset = 120;
        const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        setActiveCategory(categoryId);
    }, []);

    const handleProductClick = useCallback((product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    }, []);

    const allProducts = useMemo(() => {
        return products;
    }, [products]);

    const handlePreviousProduct = useCallback(() => {
        const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct?.Id);
        if (currentIndex > 0) setSelectedProduct(allProducts[currentIndex - 1]);
    }, [allProducts, selectedProduct?.Id]);

    const handleNextProduct = useCallback(() => {
        const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct?.Id);
        if (currentIndex < allProducts.length - 1) setSelectedProduct(allProducts[currentIndex + 1]);
    }, [allProducts, selectedProduct?.Id]);

    const canGoPrevious = useMemo(() => {
        if (!selectedProduct) return false;
        return allProducts.findIndex(p => p.Id === selectedProduct.Id) > 0;
    }, [allProducts, selectedProduct]);

    const canGoNext = useMemo(() => {
        if (!selectedProduct) return false;
        const idx = allProducts.findIndex(p => p.Id === selectedProduct.Id);
        return idx !== -1 && idx < allProducts.length - 1;
    }, [allProducts, selectedProduct]);

    const loadRestaurantData = async () => {
        try {
            setLoading(true);
            const restaurantResponse = await getRestaurantBySlug(slug);

            if (restaurantResponse.success) {
                setRestaurant(restaurantResponse.data);
                // 'view' mode ile ürünleri getir
                const productsResponse = await getProductsByRestaurant(restaurantResponse.data.Id, 'view');

                if (productsResponse.success) {
                    setCategories(productsResponse.data.categories);
                    setProducts(productsResponse.data.allProducts);
                }
            }
        } catch (err) {
            console.error('Veri yüklenemedi:', err);
            setError('Menü yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <HeroSkeleton />
                <CategorySkeleton />
                <div className="px-4 space-y-3 pb-8">
                    {[1, 2, 3, 4].map((i) => <ProductSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Bir Sorun Oluştu</h2>
                    <p className="text-gray-600 mb-4">{error || 'Restoran bulunamadı'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-2xl"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            {/* Hero */}
            <div className="relative">
                <div
                    className="h-48 bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500"
                    style={restaurant.ImageUrl ? {
                        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${restaurant.ImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    } : {}}
                />

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>

                {/* View-only Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-full text-xs font-bold shadow-lg">
                    <Eye className="w-4 h-4" />
                    Sadece Görüntüleme
                </div>

                {/* Restaurant Info */}
                <div className="px-4 -mt-10 relative z-10">
                    <div
                        className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl border-4 border-white overflow-hidden"
                        style={{ backgroundColor: restaurant.Color || '#9333ea' }}
                    >
                        {restaurant.ImageUrl ? (
                            <img src={restaurant.ImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold">{restaurant.Name?.charAt(0)}</span>
                        )}
                    </div>

                    <h1 className="text-2xl font-black text-gray-900 mt-3">{restaurant.Name}</h1>

                    {restaurant.Description && (
                        <p className="text-gray-600 text-sm mt-1">{restaurant.Description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-medium">4.8</span>
                        </div>
                        {restaurant.DeliveryTime && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{restaurant.DeliveryTime}</span>
                            </div>
                        )}
                        {restaurant.Address && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate max-w-[150px]">{restaurant.Address}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Navbar */}
            {categoriesWithProducts.length > 0 && (
                <div
                    ref={navbarRef}
                    className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm mt-4"
                >
                    <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
                        {categoriesWithProducts.map((category) => (
                            <button
                                key={category.Id}
                                data-cat={category.Id}
                                onClick={() => scrollToCategory(category.Id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === category.Id
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {category.Name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Products */}
            <div className="px-4 mt-4 space-y-6">
                {categoriesWithProducts.map((category) => {
                    const categoryProducts = productsByCategory[category.Id] || [];
                    if (categoryProducts.length === 0) return null;

                    return (
                        <div
                            key={category.Id}
                            ref={(el) => (categoryRefs.current[category.Id] = el)}
                            data-category-id={category.Id}
                        >
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                {category.Name}
                                <span className="text-sm font-normal text-gray-400">
                                    ({categoryProducts.length})
                                </span>
                            </h2>

                            <div className="space-y-3">
                                {categoryProducts.map((product) => (
                                    <ViewProductCard
                                        key={product.Id}
                                        product={{ ...product, onClick: handleProductClick }}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* No Products */}
            {categoriesWithProducts.length === 0 && (
                <div className="text-center py-16 px-4">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Menü Boş</h3>
                    <p className="text-gray-500">Bu restoranda henüz görüntülenebilir ürün yok.</p>
                </div>
            )}

            {/* Product Detail Modal */}
            <ProductDetailModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                product={selectedProduct}
                onPrevious={handlePreviousProduct}
                onNext={handleNextProduct}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                isViewOnly={true}
            />
        </div>
    );
}

export default ViewMenu;
