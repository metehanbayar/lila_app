import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Filter, History, Search as SearchIcon, Store, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductRowCard from '../components/ProductRowCard';
import StoreCard from '../components/StoreCard';
import Reveal from '../components/ui/Reveal';
import { getCategories, getRestaurants, searchProducts } from '../services/api';
import { debounce } from '../utils/performance';
import { Badge, Button, Chip, PageShell, SurfaceCard, TextInput, cn } from '../components/ui/primitives';

const RECENT_SEARCHES_KEY = 'gm_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const getIconComponent = (iconName) => LucideIcons[iconName] || LucideIcons.Utensils;

function loadRecentSearches() {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term) {
  try {
    const trimmedTerm = term.trim();
    if (trimmedTerm.length < 2) return loadRecentSearches();

    const nextSearches = [trimmedTerm, ...loadRecentSearches().filter((item) => item.toLowerCase() !== trimmedTerm.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextSearches));
    return nextSearches;
  } catch {
    return loadRecentSearches();
  }
}

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
  const [recentSearches, setRecentSearches] = useState(() => loadRecentSearches());

  const debouncedSearch = useCallback(
    debounce((query, restaurantFilter, categoryFilter, currentCategoryName) => {
      const hasQuery = query && query.trim().length >= 2;

      if (hasQuery || categoryFilter) {
        performSearch(query, restaurantFilter, categoryFilter);

        const params = {};
        if (hasQuery) params.q = query.trim();
        if (categoryFilter) {
          params.categoryId = categoryFilter;
          if (currentCategoryName) params.categoryName = currentCategoryName;
        }
        if (restaurantFilter) {
          params.restaurantId = restaurantFilter;
        }
        setSearchParams(params);
      } else {
        setResults([]);
        setError(null);
        setLoading(false);
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
      if (response.success) {
        setRestaurants(response.data || []);
      }
    } catch (err) {
      console.error('Magazalar yuklenemedi:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories(
          response.data
            .filter((category) => category.IsActive !== false)
            .sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0))
            .map((category) => ({
              ...category,
              id: String(category.Id),
              name: category.Name,
              icon: category.Icon || 'Utensils',
              color: category.Color || '#8C477C',
            })),
        );
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
          (response.data || []).map((product) => ({
            ...product,
            RestaurantName: product.RestaurantName || 'Bilinmeyen magaza',
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

    if (searchQuery.trim().length >= 2) {
      setRecentSearches(saveRecentSearch(searchQuery));
    }

    if (searchQuery.trim().length >= 2 || selectedCategory) {
      performSearch(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setCategoryName('');
    setSelectedRestaurant(null);
    setResults([]);
    setError(null);
    setSearchParams({});
  };

  const handleCategorySelect = (category) => {
    const isSameCategory = selectedCategory === String(category.id);
    setSelectedCategory(isSameCategory ? null : String(category.id));
    setCategoryName(isSameCategory ? '' : category.name);
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

  const handleRecentSearchClick = (term) => {
    setSearchQuery(term);
    setRecentSearches(saveRecentSearch(term));
  };

  const activeSearch = searchQuery.trim().length >= 2 || Boolean(selectedCategory);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const featuredStores = restaurants.filter((restaurant) => restaurant.IsFeatured).slice(0, 4);
  const emptyStateStores = (featuredStores.length > 0 ? featuredStores : restaurants).slice(0, 4);
  const quickCategories = categories.slice(0, 6);

  const matchingRestaurantIds = new Set(
    results
      .map((product) => String(product.RestaurantId || product.RestaurantID || product.restaurantId || ''))
      .filter(Boolean),
  );

  const directRestaurantMatches = normalizedQuery
    ? restaurants.filter((restaurant) =>
        [restaurant.Name, restaurant.Description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
    : [];

  const matchingStores = [];
  const seenStoreIds = new Set();

  [...directRestaurantMatches, ...restaurants.filter((restaurant) => matchingRestaurantIds.has(String(restaurant.Id)))]
    .forEach((restaurant) => {
      const restaurantId = String(restaurant.Id);
      if (!seenStoreIds.has(restaurantId)) {
        seenStoreIds.add(restaurantId);
        matchingStores.push(restaurant);
      }
    });

  return (
    <div className="pb-8 pt-4 lg:pb-12">
      <PageShell width="full" className="space-y-4">
        <Reveal variant="section-enter">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-dark transition-all hover:bg-white hover:shadow-card"
                aria-label="Ana sayfaya don"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Arama</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-dark sm:text-3xl">
                  {categoryName ? `${categoryName} magazalari ve urunleri` : 'Magaza veya urun ara'}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedCategory && <Badge tone="primary">{categoryName}</Badge>}
              {selectedRestaurant && <Badge tone="warning">Magaza filtreli</Badge>}
            </div>
          </div>
        </Reveal>

        <Reveal variant="section-enter" delay={60}>
          <SurfaceCard className="space-y-3 p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-lighter" />
              <TextInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Magaza, urun veya menude ara..."
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

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setShowFilters((value) => !value)} className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                <Filter className="h-4 w-4" />
                Filtreler
              </button>

              {(selectedCategory || selectedRestaurant || searchQuery) && (
                <button type="button" onClick={handleClearSearch} className="text-sm font-medium text-dark-lighter transition-colors hover:text-dark">
                  Tumunu temizle
                </button>
              )}
            </div>

            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out',
                showFilters ? 'grid-rows-[1fr] opacity-100 translate-y-0' : 'pointer-events-none grid-rows-[0fr] opacity-0 -translate-y-2',
              )}
            >
              <div className="overflow-hidden">
                <div className="grid gap-4 rounded-[24px] border border-surface-border bg-surface-muted/60 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-dark">Kategori</p>
                      {selectedCategory && (
                        <button type="button" onClick={() => handleCategorySelect({ id: selectedCategory, name: categoryName })} className="text-xs font-semibold text-primary">
                          Kategoriyi temizle
                        </button>
                      )}
                    </div>
                    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                      {categories.map((category) => {
                        const Icon = getIconComponent(category.icon);
                        const active = selectedCategory === category.id;

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
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-dark">Magaza</p>
                      {selectedRestaurant && (
                        <button type="button" onClick={() => setSelectedRestaurant(null)} className="text-xs font-semibold text-primary">
                          Magaza filtresini temizle
                        </button>
                      )}
                    </div>
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
                  </div>
                </div>
              </div>
            </div>
          </form>
          </SurfaceCard>
        </Reveal>

        {loading && (
          <Reveal variant="reveal-soft">
            <SurfaceCard tone="muted" className="p-6">
              <Loading message="Sonuclar hazirlaniyor..." />
            </SurfaceCard>
          </Reveal>
        )}

        {error && !loading && (
          <Reveal variant="reveal-soft">
            <SurfaceCard tone="muted" className="p-6 text-sm font-medium text-red-600">{error}</SurfaceCard>
          </Reveal>
        )}

        {!loading && !error && activeSearch && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-dark-lighter">
                {matchingStores.length} magaza ve {results.length} urun bulundu
              </p>
            </div>

            {matchingStores.length === 0 && results.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title="Sonuc bulunamadi"
                message="Farkli bir arama terimi veya kategori deneyin."
                actionText="Ana sayfaya don"
                actionPath="/"
              />
            ) : (
              <div className="space-y-6">
                {matchingStores.length > 0 && (
                  <Reveal as="section" variant="section-enter" className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Magazalar</p>
                        <h2 className="text-xl font-bold text-dark">Eslesen magazalar</h2>
                      </div>
                      <Badge tone="primary">{matchingStores.length}</Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {matchingStores.map((restaurant, index) => (
                        <Reveal key={restaurant.Id} variant="reveal-up" delay={Math.min(index, 5) * 50}>
                          <StoreCard restaurant={restaurant} onClick={() => navigate(`/restaurant/${restaurant.Slug}`)} />
                        </Reveal>
                      ))}
                    </div>
                  </Reveal>
                )}

                {results.length > 0 && (
                  <Reveal as="section" variant="section-enter" delay={60} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Urunler</p>
                        <h2 className="text-xl font-bold text-dark">Eslesen urunler</h2>
                      </div>
                      <Badge tone="warning">{results.length}</Badge>
                    </div>

                    <div className="grid gap-3">
                      {results.map((product, index) => (
                        <Reveal key={product.Id} variant="reveal-up" delay={Math.min(index, 5) * 45}>
                          <ProductRowCard product={product} onProductClick={handleProductClick} />
                        </Reveal>
                      ))}
                    </div>
                  </Reveal>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && !error && !activeSearch && (
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <Reveal variant="section-enter">
              <SurfaceCard tone="muted" className="space-y-4 p-4 sm:p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Arama</p>
                  <h2 className="mt-1 text-xl font-bold text-dark">Son aramalar</h2>
                </div>

                {recentSearches.length > 0 ? (
                  <div className="space-y-3">
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-dark">
                      <History className="h-4 w-4 text-primary" />
                      Son aramalar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term, index) => (
                        <Reveal key={term} variant="reveal-up" delay={Math.min(index, 4) * 45}>
                          <Chip onClick={() => handleRecentSearchClick(term)}>
                            {term}
                          </Chip>
                        </Reveal>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-dark-lighter">Son arama yok.</p>
                )}

                {quickCategories.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-dark">Kategoriler</p>
                    <div className="flex flex-wrap gap-2">
                      {quickCategories.map((category, index) => {
                        const Icon = getIconComponent(category.icon);
                        return (
                          <Reveal key={category.id} variant="reveal-up" delay={Math.min(index, 5) * 45}>
                            <Chip className="gap-2 px-4 py-3" onClick={() => handleCategorySelect(category)}>
                              <span className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: category.color }}>
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              {category.name}
                            </Chip>
                          </Reveal>
                        );
                      })}
                    </div>
                  </div>
                )}
              </SurfaceCard>
            </Reveal>

            <Reveal variant="section-enter" delay={60}>
              <SurfaceCard className="space-y-4 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Magazalar</p>
                    <h2 className="mt-1 text-xl font-bold text-dark">Magaza listesi</h2>
                  </div>
                  <Badge tone="primary">{emptyStateStores.length}</Badge>
                </div>

                {emptyStateStores.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {emptyStateStores.map((restaurant, index) => (
                      <Reveal key={restaurant.Id} variant="reveal-up" delay={Math.min(index, 5) * 50}>
                        <StoreCard restaurant={restaurant} onClick={() => navigate(`/restaurant/${restaurant.Slug}`)} />
                      </Reveal>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Store}
                    title="Magaza bulunamadi"
                    message="Su anda magaza bulunmuyor."
                    actionText="Ana sayfaya don"
                    actionPath="/"
                  />
                )}
              </SurfaceCard>
            </Reveal>
          </div>
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
