import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  ArrowLeft, 
  X, 
  Filter,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { searchProducts, getRestaurants, getCategories } from '../services/api';
import ProductRowCard from '../components/ProductRowCard';
import ProductDetailModal from '../components/ProductDetailModal';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { debounce } from '../utils/performance';

// İkon bileşenini al
const getIconComponent = (iconName) => {
  return LucideIcons[iconName] || LucideIcons.Utensils;
};

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const initialCategoryId = searchParams.get('categoryId') ? String(searchParams.get('categoryId')) : null;
  const initialCategoryName = searchParams.get('categoryName') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Geri dön butonu - her zaman ana sayfaya git
  const handleGoBack = () => {
    navigate('/');
  };

  // Live search için debounced arama fonksiyonu
  const debouncedSearch = useCallback(
    debounce((query, restaurantFilter, categoryFilter) => {
      if ((query && query.trim().length >= 2) || categoryFilter) {
        performSearch(query, restaurantFilter, categoryFilter);
        // URL'yi güncelle
        const params = {};
        if (query) params.q = query;
        if (categoryFilter) {
          params.categoryId = categoryFilter;
          if (categoryName) params.categoryName = categoryName;
        }
        setSearchParams(params);
      } else {
        setResults([]);
        // Arama temizlendiğinde URL'yi de temizle
        if (query.trim().length === 0 && !categoryFilter) {
          setSearchParams({});
        }
      }
    }, 500), // 500ms gecikme
    [categoryName]
  );

  useEffect(() => {
    // Sayfa yüklendiğinde en üste scroll et
    window.scrollTo(0, 0);
    
    loadRestaurants();
    loadCategories();
    if (initialQuery && initialQuery.length >= 2) {
      performSearch(initialQuery, null, initialCategoryId);
    } else if (initialCategoryId) {
      performSearch('', null, initialCategoryId);
    }
  }, []);

  // Live search - searchQuery değiştiğinde otomatik arama
  useEffect(() => {
    debouncedSearch(searchQuery, selectedRestaurant, selectedCategory);
  }, [searchQuery, selectedRestaurant, selectedCategory, debouncedSearch]);

  const loadRestaurants = async () => {
    try {
      const response = await getRestaurants();
      if (response.success) {
        setRestaurants(response.data);
      }
    } catch (err) {
      console.error('Restoranlar yüklenemedi:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success && response.data) {
         const formattedCategories = [
           { id: 'all', name: 'Tümü', icon: 'Utensils', color: 'bg-purple-500' },
           ...response.data.map(cat => ({
             ...cat,
             id: String(cat.Id),
             name: cat.Name,
             icon: cat.Icon || 'Utensils',
             color: cat.Color || 'bg-gray-500'
           }))
         ];
        setCategories(formattedCategories);
      }
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err);
    }
  };

  const performSearch = async (query, restaurantFilter = selectedRestaurant, categoryFilter = selectedCategory) => {
    if ((!query || query.trim().length < 2) && !categoryFilter) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchTerm = query && query.trim().length >= 2 ? query.trim() : null;
      const response = await searchProducts(searchTerm, restaurantFilter, categoryFilter);
      if (response.success) {
        // Arama sonuçlarına restoran bilgisini ekle
        const resultsWithRestaurant = response.data.map(product => ({
          ...product,
          RestaurantName: product.RestaurantName || 'Bilinmeyen Restoran'
        }));
        setResults(resultsWithRestaurant);
      } else {
        setError(response.message);
        setResults([]);
      }
    } catch (err) {
      console.error('Arama hatası:', err);
      setError('Arama yapılırken bir hata oluştu');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2 || selectedCategory) {
      const params = {};
      if (searchQuery.trim().length >= 2) params.q = searchQuery;
      if (selectedCategory) {
        params.categoryId = selectedCategory;
        if (categoryName) params.categoryName = categoryName;
      }
      setSearchParams(params);
      performSearch(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setCategoryName('');
    setResults([]);
    setSearchParams({});
  };

  const handleCategorySelect = (category) => {
    if (category.id === 'all') {
      setSelectedCategory(null);
      setCategoryName('');
      const params = {};
      if (searchQuery) params.q = searchQuery;
      setSearchParams(params);
    } else {
      setSelectedCategory(String(category.id));
      setCategoryName(category.name);
      const params = { categoryId: String(category.id), categoryName: category.name };
      if (searchQuery) params.q = searchQuery;
      setSearchParams(params);
    }
  };

  const handleRestaurantFilter = (restaurantId) => {
    const newRestaurantFilter = restaurantId === selectedRestaurant ? null : restaurantId;
    setSelectedRestaurant(newRestaurantFilter);
    // Live search otomatik olarak yeni filtre ile arama yapacak
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
    const currentIndex = results.findIndex(p => p.Id === selectedProduct?.Id);
    if (currentIndex > 0) {
      setSelectedProduct(results[currentIndex - 1]);
    }
  };

  const handleNextProduct = () => {
    const currentIndex = results.findIndex(p => p.Id === selectedProduct?.Id);
    if (currentIndex < results.length - 1) {
      setSelectedProduct(results[currentIndex + 1]);
    }
  };

  const canGoPrevious = () => {
    const currentIndex = results.findIndex(p => p.Id === selectedProduct?.Id);
    return currentIndex > 0;
  };

  const canGoNext = () => {
    const currentIndex = results.findIndex(p => p.Id === selectedProduct?.Id);
    return currentIndex < results.length - 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-3 sm:mb-4 transition-colors active:text-primary-dark"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base">Geri Dön</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {categoryName ? `${categoryName} Kategorisi` : 'Ürün Ara'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {categoryName ? `${categoryName} kategorisindeki ürünler` : 'Menülerden aradığınız ürünü bulun'}
          </p>
        </div>

        {/* Kategoriler */}
        {categories.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">Kategoriler</h3>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [touch-action:pan-x] overscroll-x-contain">
              {categories.map((category) => {
                const Icon = getIconComponent(category.icon);
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`flex-shrink-0 transition-all ${
                      isSelected ? 'scale-105' : 'hover:scale-105'
                    }`}
                  >
                    <div
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg ring-2 ring-purple-300'
                          : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border-2 border-white/40 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-white/20' : category.color
                        }`}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
                        {category.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Arama Kutusu */}
        <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/40 p-4 sm:p-6 mb-4 sm:mb-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative">
              <SearchIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ürün adı veya açıklama..."
                className="w-full pl-10 sm:pl-12 pr-16 sm:pr-20 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-12 sm:right-14 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors p-1"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <button
                type="submit"
                disabled={searchQuery.trim().length < 2}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-3 sm:px-4 py-1.5 rounded-lg hover:bg-primary-dark active:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium"
              >
                Ara
              </button>
            </div>
          </form>

          {/* Filtreler */}
          <div className="mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Restorana Göre Filtrele</span>
              {selectedRestaurant && <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">1</span>}
            </button>
            
            {showFilters && (
              <div className="mt-3 flex flex-wrap gap-2">
                {restaurants.map(restaurant => (
                  <button
                    key={restaurant.Id}
                    onClick={() => handleRestaurantFilter(restaurant.Id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedRestaurant === restaurant.Id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {restaurant.Name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sonuçlar */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && (searchQuery.trim().length >= 2 || selectedCategory) && (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                {searchQuery.trim().length >= 2 ? (
                  <>
                    <span className="font-semibold">&quot;{searchQuery}&quot;</span> için {results.length} sonuç bulundu
                  </>
                ) : categoryName ? (
                  <>
                    <span className="font-semibold">{categoryName}</span> kategorisinde {results.length} ürün bulundu
                  </>
                ) : (
                  <>{results.length} ürün bulundu</>
                )}
              </p>
            </div>

            {results.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title="Sonuç Bulunamadı"
                message={`"${searchQuery}" için ürün bulunamadı. Farklı bir arama terimi deneyin.`}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {results.map((product) => (
                  <ProductRowCard
                    key={product.Id}
                    product={product}
                    onProductClick={handleProductClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && searchQuery.trim().length < 2 && !selectedCategory && results.length === 0 && (
          <EmptyState
            icon={SearchIcon}
            title="Aramaya Başlayın"
            message="Menülerden ürün aramak için yukarıdaki arama kutusunu kullanın."
          />
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

export default Search;

