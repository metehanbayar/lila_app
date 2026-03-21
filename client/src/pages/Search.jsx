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
import { Badge, Button, Field, PageShell, SurfaceCard, TextInput } from '../components/ui/primitives';

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
    debounce((query, restaurantFilter, categoryFilter) => {
      if ((query && query.trim().length >= 2) || categoryFilter) {
        performSearch(query, restaurantFilter, categoryFilter);
        const params = {};
        if (query) params.q = query;
        if (categoryFilter) {
          params.categoryId = categoryFilter;
          if (categoryName) params.categoryName = categoryName;
        }
        setSearchParams(params);
      } else {
        setResults([]);
        if (query.trim().length === 0 && !categoryFilter) {
          setSearchParams({});
        }
      }
    }, 500),
    [categoryName],
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
    debouncedSearch(searchQuery, selectedRestaurant, selectedCategory);
  }, [searchQuery, selectedRestaurant, selectedCategory, debouncedSearch]);

  const loadRestaurants = async () => {
    try {
      const response = await getRestaurants();
      if (response.success) {
        setRestaurants(response.data);
      }
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

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handlePreviousProduct = () => {
    const currentIndex = results.findIndex((product) => product.Id === selectedProduct?.Id);
    if (currentIndex > 0) {
      setSelectedProduct(results[currentIndex - 1]);
    }
  };

  const handleNextProduct = () => {
    const currentIndex = results.findIndex((product) => product.Id === selectedProduct?.Id);
    if (currentIndex < results.length - 1) {
      setSelectedProduct(results[currentIndex + 1]);
    }
  };

  const canGoPrevious = () => results.findIndex((product) => product.Id === selectedProduct?.Id) > 0;
  const canGoNext = () => results.findIndex((product) => product.Id === selectedProduct?.Id) < results.length - 1;

  return (
    <div className="pb-8 pt-4 sm:pt-6 lg:pb-12">
      <PageShell width="full" className="space-y-6">
        <SurfaceCard tone="hero" className="overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="space-y-5">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-white/14"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana sayfaya don
            </button>

            <div className="space-y-3">
              <span className="gm-eyebrow border-white/20 bg-white/10 text-white">Arama</span>
              <h1 className="font-display text-5xl leading-none text-white sm:text-6xl">
                {categoryName ? `${categoryName} kategorisi` : 'Urun kesfet'}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
                {categoryName
                  ? `${categoryName} kategorisindeki urunler tek listede.`
                  : 'Mobilde hizli filtre, desktopta rahat tarama icin yeniden duzenlendi.'}
              </p>
            </div>
          </div>
        </SurfaceCard>

        {categories.length > 0 && (
          <SurfaceCard tone="muted" className="p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Kategoriler</p>
              <h2 className="text-xl font-bold text-dark">Hizli filtre</h2>
            </div>
            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
              {categories.map((category) => {
                const Icon = getIconComponent(category.icon);
                const active = selectedCategory === category.id || (!selectedCategory && category.id === 'all');
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`flex shrink-0 items-center gap-3 rounded-[24px] border px-4 py-3 text-left transition-all duration-200 ${
                      active
                        ? 'border-primary/25 bg-primary text-white shadow-lg shadow-primary/20'
                        : 'border-surface-border bg-white text-dark hover:border-primary/20'
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-[18px] ${active ? 'bg-white/12 text-white' : 'text-white'}`}
                      style={{ background: active ? 'rgba(255,255,255,0.14)' : category.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{category.name}</p>
                      <p className={`text-xs ${active ? 'text-white/72' : 'text-dark-lighter'}`}>Kategori</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </SurfaceCard>
        )}

        <SurfaceCard className="p-4 sm:p-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <Field label="Urun ara" hint="En az 2 karakter girin veya kategori secin.">
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
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2">
                  Ara
                </Button>
              </div>
            </Field>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary"
              >
                <Filter className="h-4 w-4" />
                Restorana gore filtrele
                {selectedRestaurant && <Badge tone="primary">1 secili</Badge>}
              </button>

              {showFilters && (
                <div className="flex flex-wrap gap-2">
                  {restaurants.map((restaurant) => (
                    <button
                      key={restaurant.Id}
                      type="button"
                      onClick={() => setSelectedRestaurant(selectedRestaurant === restaurant.Id ? null : restaurant.Id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        selectedRestaurant === restaurant.Id
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-surface-muted text-dark hover:bg-white'
                      }`}
                    >
                      {restaurant.Name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
        </SurfaceCard>

        {loading && (
          <SurfaceCard tone="muted" className="p-6">
            <Loading message="Arama sonuclari hazirlaniyor..." />
          </SurfaceCard>
        )}

        {error && !loading && (
          <SurfaceCard tone="muted" className="p-6 text-sm font-medium text-red-600">
            {error}
          </SurfaceCard>
        )}

        {!loading && !error && (searchQuery.trim().length >= 2 || selectedCategory) && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-dark-lighter">
                {searchQuery.trim().length >= 2 ? (
                  <>
                    <span className="font-bold text-dark">"{searchQuery}"</span> icin {results.length} sonuc bulundu
                  </>
                ) : categoryName ? (
                  <>
                    <span className="font-bold text-dark">{categoryName}</span> kategorisinde {results.length} urun bulundu
                  </>
                ) : (
                  `${results.length} urun bulundu`
                )}
              </p>
            </div>

            {results.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title="Sonuc bulunamadi"
                message={`"${searchQuery}" icin urun bulunamadi. Farkli bir arama terimi deneyin.`}
                actionText="Ana sayfaya don"
                actionPath="/"
              />
            ) : (
              <div className="grid gap-4">
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
            message="Menu icinde urun aramak icin yukaridaki alanlari kullanin."
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
        canGoPrevious={canGoPrevious()}
        canGoNext={canGoNext()}
      />
    </div>
  );
}

export default Search;
