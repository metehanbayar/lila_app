import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { getRestaurantBySlug, getProductsByRestaurant } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import Loading from '../components/Loading';

function RestaurantMenu() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const categoryRefs = useRef({});
  const observerRef = useRef(null);
  const navbarRef = useRef(null);

  useEffect(() => {
    loadRestaurantData();
  }, [slug]);

  // Tüm ürünleri göster, kategorilere göre grupla
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category.Id] = products.filter(p => p.CategoryId === category.Id);
    return acc;
  }, {});

  // Tüm ürünleri kategorilere göre sırala
  const allProducts = categories.flatMap(category => productsByCategory[category.Id] || []);

  // Intersection Observer ile kategori takibi
  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categoryId = parseInt(entry.target.dataset.categoryId);
            setActiveCategory(categoryId);
            
            // Navbar'da aktif kategori butonunu görünür hale getir
            scrollToActiveCategory(categoryId);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px', // Kategori başlığı ekranın üst %20'sinde olduğunda aktif olsun
        threshold: 0.1
      }
    );

    observerRef.current = observer;

    // Her kategori için observer ekle
    Object.values(categoryRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [categories, products]);

  // Aktif kategori butonunu navbar'da görünür hale getir
  const scrollToActiveCategory = (categoryId) => {
    if (!navbarRef.current) return;
    
    const activeButton = navbarRef.current.querySelector(`[data-category-button="${categoryId}"]`);
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const [restaurantResponse, productsResponse] = await Promise.all([
        getRestaurantBySlug(slug),
        getRestaurantBySlug(slug).then((res) =>
          getProductsByRestaurant(res.data.Id)
        ),
      ]);

      if (restaurantResponse.success) {
        setRestaurant(restaurantResponse.data);
      }

      if (productsResponse.success) {
        setCategories(productsResponse.data.categories);
        setProducts(productsResponse.data.allProducts);
      }
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
      setError('Menü yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getGradientClass = (color) => {
    switch (color) {
      case '#EC4899':
        return 'from-pink-500 to-pink-700';
      case '#22C55E':
        return 'from-green-500 to-green-700';
      case '#1F2937':
        return 'from-gray-700 to-gray-900';
      default:
        return 'from-primary to-primary-dark';
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handlePreviousProduct = () => {
    const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct?.Id);
    if (currentIndex > 0) {
      setSelectedProduct(allProducts[currentIndex - 1]);
    }
  };

  const handleNextProduct = () => {
    const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct?.Id);
    if (currentIndex < allProducts.length - 1) {
      setSelectedProduct(allProducts[currentIndex + 1]);
    }
  };

  const canGoPrevious = () => {
    const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct?.Id);
    return currentIndex > 0;
  };

  const canGoNext = () => {
    const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct?.Id);
    return currentIndex < allProducts.length - 1;
  };

  if (loading) return <Loading />;

  if (error || !restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Ana Sayfaya Dön</span>
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error || 'Restoran bulunamadı'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Kategoriler */}
      <div className="sticky top-14 z-30">
        {/* Kategori Filtresi */}
        {categories.length > 0 && (
          <div className="bg-white border-b shadow-sm">
            <div className="container mx-auto px-4 py-2 sm:py-3">
            <div 
              ref={navbarRef}
              className="flex overflow-x-auto gap-2 pb-2 categories-scroll" 
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#D1D5DB transparent'
              }}
            >
              {categories.map((category) => (
                <button
                  key={category.Id}
                  data-category-button={category.Id}
                  onClick={() => {
                    const categoryElement = categoryRefs.current[category.Id];
                    if (categoryElement) {
                      // Sticky header'ın toplam yüksekliğini hesapla
                      const stickyHeader = document.querySelector('.sticky.top-14');
                      const mainHeader = document.querySelector('header'); // Ana header
                      
                      let headerOffset = 56; // top-14 = 56px (ana header)
                      if (stickyHeader) {
                        headerOffset += stickyHeader.offsetHeight;
                      }
                      
                      const elementPosition = categoryElement.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20; // 20px ekstra boşluk
                      
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap transition-colors text-sm sm:text-base ${
                    activeCategory === category.Id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  {category.Name}
                </button>
              ))}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Ürünler */}
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 mb-16 lg:mb-0">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm sm:text-base text-gray-600">Ürün bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10 md:space-y-12">
            {categories.map((category) => {
              const categoryProducts = productsByCategory[category.Id] || [];
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.Id} className="space-y-4 sm:space-y-6">
                  {/* Kategori İsmi - Intersection observer için referans noktası */}
                  <h2 
                    ref={(el) => {
                      if (el) categoryRefs.current[category.Id] = el;
                    }}
                    data-category-id={category.Id}
                    className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4"
                  >
                    {category.Name}
                  </h2>

                  {/* Kategori Ürünleri */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    {categoryProducts.map((product) => (
                      <ProductCard 
                        key={product.Id} 
                        product={product} 
                        onProductClick={handleProductClick}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ürün Detay Modalı */}
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onPrevious={handlePreviousProduct}
        onNext={handleNextProduct}
        canGoPrevious={canGoPrevious()}
        canGoNext={canGoNext()}
      />
    </div>
  );
}

export default RestaurantMenu;

