import { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, MapPin, Star, Sparkles } from 'lucide-react';
import { getRestaurantBySlug, getProductsByRestaurant } from '../services/api';
import ProductRowCard from '../components/ProductRowCard';
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

function RestaurantMenu() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
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

  const allProducts = useMemo(() => {
    return categoriesWithProducts.flatMap(category => productsByCategory[category.Id] || []);
  }, [categoriesWithProducts, productsByCategory]);

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
            // Scroll navbar to active button
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

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const restaurantResponse = await getRestaurantBySlug(slug);

      if (restaurantResponse.success) {
        setRestaurant(restaurantResponse.data);
        const productsResponse = await getProductsByRestaurant(restaurantResponse.data.Id, 'order');

        if (productsResponse.success) {
          setCategories(productsResponse.data.categories);
          const productsWithRestaurant = productsResponse.data.allProducts.map(product => ({
            ...product,
            RestaurantName: restaurantResponse.data?.Name || 'Bilinmeyen Restoran'
          }));
          setProducts(productsWithRestaurant);
        }
      }
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
      setError('Menü yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleAddToCartGlobal = useCallback((product) => {
    setToast({ name: product.Name, quantity: 1 });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }, []);

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
    return idx < allProducts.length - 1;
  }, [allProducts, selectedProduct]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50">
        <HeroSkeleton />
        <CategorySkeleton />
        <div className="px-4 space-y-3 mt-4">
          {[1, 2, 3, 4, 5].map((i) => <ProductSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // Error State
  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Bir Sorun Oluştu</h2>
          <p className="text-gray-600 mb-6">{error || 'Restoran bulunamadı'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50 pb-24">
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-44 sm:h-56 relative overflow-hidden">
          {restaurant.ImageUrl ? (
            <img
              src={restaurant.ImageUrl}
              alt={restaurant.Name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
        </div>

        {/* Restaurant Info */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                {restaurant.LogoUrl ? (
                  <img src={restaurant.LogoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-2xl text-white font-bold">{restaurant.Name?.charAt(0)}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{restaurant.Name}</h1>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                  {restaurant.Rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{restaurant.Rating}</span>
                    </div>
                  )}
                  {restaurant.DeliveryTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>{restaurant.DeliveryTime}</span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-full text-xs font-medium ${restaurant.IsActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${restaurant.IsActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {restaurant.IsActive ? 'Açık' : 'Kapalı'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      {categoriesWithProducts.length > 0 && (
        <div className="sticky top-12 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 mt-4">
          <div
            ref={navbarRef}
            className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
          >
            {categoriesWithProducts.map((category) => (
              <button
                key={category.Id}
                data-cat={category.Id}
                onClick={() => scrollToCategory(category.Id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === category.Id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {category.Name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="px-4 mt-4 space-y-8">
        {categoriesWithProducts.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">🍽️</span>
            <p className="text-gray-600">Henüz ürün bulunmuyor</p>
          </div>
        ) : (
          categoriesWithProducts.map((category) => {
            const categoryProducts = productsByCategory[category.Id] || [];
            if (categoryProducts.length === 0) return null;

            return (
              <section key={category.Id}>
                {/* Category Header */}
                <div
                  ref={(el) => {
                    if (el) categoryRefs.current[category.Id] = el;
                    else delete categoryRefs.current[category.Id];
                  }}
                  data-category-id={category.Id}
                  className="flex items-center gap-2 mb-3"
                >
                  <h2 className="text-lg font-bold text-gray-900">{category.Name}</h2>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {categoryProducts.length}
                  </span>
                </div>

                {/* Products Grid */}
                <div className="space-y-3">
                  {categoryProducts.map((product) => (
                    <ProductRowCard
                      key={product.Id}
                      product={product}
                      onProductClick={handleProductClick}
                      onAddToCart={handleAddToCartGlobal}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onPrevious={handlePreviousProduct}
        onNext={handleNextProduct}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-slideUp">
          <div className="bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-sm mx-auto border border-gray-100">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Sepete Eklendi</p>
              <p className="text-xs text-gray-500 truncate">{toast.name}</p>
            </div>
            <button
              onClick={() => { setToast(null); navigate('/cart'); }}
              className="text-purple-600 text-sm font-bold"
            >
              Sepete Git
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantMenu;
