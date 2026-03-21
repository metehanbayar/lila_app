import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Filter, Search as SearchIcon, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductRowCard from '../components/ProductRowCard';
import { getCategories, getRestaurants, searchProducts } from '../services/api';
import { debounce } from '../utils/performance';
import { Badge, Button, Chip, PageShell, SurfaceCard, TextInput, cn } from '../components/ui/primitives';

const getIconComponent = (iconName) => LucideIcons[iconName] || LucideIcons.Utensils;

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

  const debouncedSearch = useCallback(
    debounce((query, restaurantFilter, categoryFilter, currentCategoryName) => {
      if ((query && query.trim().length >= 2) || categoryFilter) {
        performSearch(query, restaurantFilter, categoryFilter);
        const params = {};
        if (query) params.q = query;
        if (categoryFilter) {
          params.categoryId = categoryFilter;
          if (currentCategoryName) params.categoryName = currentCategoryName;
        }
        setSearchParams(params);
      } else {
        setResults([]);
        setSearchParams({});
      }
    }, 400),
    [],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    loadRestaurants();
    loadCategories();
    if (initialQuery && initialQuery.length >= 2) {
      performSearch(initialQuery, null, initialCategoryId);
    } else if (initialCategoryId) {
      performSearch('', null, initialCategoryId);
    }
  }, []);

  useEffect(() => {
    debouncedSearch(searchQuery, selectedRestaurant, selectedCategory, categoryName);
  }, [searchQuery, selectedRestaurant, selectedCategory, categoryName, debouncedSearch]);

  const loadRestaurants = async () => {
    try {
      const response = await getRestaurants();
      if (response.success) setRestaurants(response.data);
    } catch (err) {
      console.error('Restoranlar yuklenemedi:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories([
          { id: 'all', name: 'Tumu', icon: 'Utensils', color: '#8C477C' },
          ...response.data.map((category) => ({
            ...category,
            id: String(category.Id),
            name: category.Name,
            icon: category.Icon || 'Utensils',
            color: category.Color || '#8C477C',
          })),
        ]);
      }
    } catch (err) {
      console.error('Kategoriler yuklenemedi:', err);
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
        setResults(
          response.data.map((product) => ({
            ...product,
            RestaurantName: product.RestaurantName || 'Bilinmeyen restoran',
          })),
        );
      } else {
        setError(response.message);
        setResults([]);
      }
    } catch (err) {
      console.error('Arama hatasi:', err);
      setError('Arama yapilirken bir hata olustu');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2 || selectedCategory) {
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
      return;
    }
    setSelectedCategory(String(category.id));
    setCategoryName(category.name);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handlePreviousProduct = () => {
    const currentIndex = results.findIndex((product) => product.Id === selectedProduct?.Id);
    if (currentIndex > 0) setSelectedProduct(results[currentIndex - 1]);
  };

  const handleNextProduct = () => {
    const currentIndex = results.findIndex((product) => product.Id === selectedProduct?.Id);
    if (currentIndex < results.length - 1) setSelectedProduct(results[currentIndex + 1]);
  };

  return (
    <div className="pb-8 pt-4 lg:pb-12">
      <PageShell width="full" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-dark transition-all hover:bg-white hover:shadow-card"
              aria-label="Ana sayfaya don"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Arama</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-dark sm:text-3xl">
                {categoryName ? `${categoryName} urunleri` : 'Urun veya kategori ara'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedCategory && <Badge tone="primary">{categoryName}</Badge>}
            {selectedRestaurant && <Badge tone="warning">Restoran filtreli</Badge>}
          </div>
        </div>

        <SurfaceCard className="space-y-3 p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-lighter" />
              <TextInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Urun adi veya aciklama..."
                className="pl-12 pr-28"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-14 top-1/2 -translate-y-1/2 rounded-xl p-2 text-dark-lighter hover:bg-surface-muted"
                  aria-label="Aramayi temizle"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2">
                Ara
              </Button>
            </div>

            {categories.length > 0 && (
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                {categories.map((category) => {
                  const Icon = getIconComponent(category.icon);
                  const active = selectedCategory === category.id || (!selectedCategory && category.id === 'all');
                  return (
                    <Chip
                      key={category.id}
                      active={active}
                      className={cn('shrink-0 gap-2 px-4 py-3', active && 'text-white')}
                      onClick={() => handleCategorySelect(category)}
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                        style={{ background: active ? 'rgba(255,255,255,0.18)' : category.color }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {category.name}
                    </Chip>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              <button type="button" onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                <Filter className="h-4 w-4" />
                Restoran filtresi
              </button>

              {showFilters && (
                <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                  {restaurants.map((restaurant) => (
                    <Chip
                      key={restaurant.Id}
                      active={selectedRestaurant === restaurant.Id}
                      className={cn('shrink-0 px-4 py-2.5', selectedRestaurant === restaurant.Id && 'text-white')}
                      onClick={() => setSelectedRestaurant(selectedRestaurant === restaurant.Id ? null : restaurant.Id)}
                    >
                      {restaurant.Name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </form>
        </SurfaceCard>

        {loading && (
          <SurfaceCard tone="muted" className="p-6">
            <Loading message="Sonuclar hazirlaniyor..." />
          </SurfaceCard>
        )}

        {error && !loading && <SurfaceCard tone="muted" className="p-6 text-sm font-medium text-red-600">{error}</SurfaceCard>}

        {!loading && !error && (searchQuery.trim().length >= 2 || selectedCategory) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-dark-lighter">
                {searchQuery.trim().length >= 2 ? (
                  <>
                    <span className="font-bold text-dark">"{searchQuery}"</span> icin {results.length} sonuc
                  </>
                ) : (
                  <>
                    <span className="font-bold text-dark">{categoryName}</span> kategorisinde {results.length} urun
                  </>
                )}
              </p>
            </div>

            {results.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title="Sonuc bulunamadi"
                message="Farkli bir arama terimi veya kategori deneyin."
                actionText="Ana sayfaya don"
                actionPath="/"
              />
            ) : (
              <div className="grid gap-3">
                {results.map((product) => (
                  <ProductRowCard key={product.Id} product={product} onProductClick={handleProductClick} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !error && searchQuery.trim().length < 2 && !selectedCategory && results.length === 0 && (
          <EmptyState
            icon={SearchIcon}
            title="Aramaya baslayin"
            message="Urun veya kategori secerek hizlica sonuclara ulasin."
            actionText="Ana sayfaya don"
            actionPath="/"
          />
        )}
      </PageShell>

      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onPrevious={handlePreviousProduct}
        onNext={handleNextProduct}
        canGoPrevious={results.findIndex((product) => product.Id === selectedProduct?.Id) > 0}
        canGoNext={results.findIndex((product) => product.Id === selectedProduct?.Id) < results.length - 1}
      />
    </div>
  );
}

export default Search;
