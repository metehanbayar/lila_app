import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Clock3, MapPin, Sparkles, Star } from 'lucide-react';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductRowCard from '../components/ProductRowCard';
import { getProductsByRestaurant, getRestaurantBySlug } from '../services/api';
import { Badge, Button, Chip, PageShell, SurfaceCard, cn } from '../components/ui/primitives';
import { collectImageUrls, preloadImages } from '../utils/pagePreload';

const HeaderSkeleton = memo(() => (
  <PageShell width="full" className="pt-4">
    <div className="h-48 animate-pulse rounded-[28px] bg-[linear-gradient(135deg,#eadce7,#f3ebe6)]" />
  </PageShell>
));

const ProductSkeleton = memo(() => <div className="h-32 animate-pulse rounded-[28px] bg-white shadow-card" />);

function RestaurantMenu({ viewOnly = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showRestaurantDetails, setShowRestaurantDetails] = useState(false);
  const categoryRefs = useRef({});
  const navbarRef = useRef(null);
  const activeCategoryRef = useRef(null);
  const centerTimeoutRef = useRef(null);

  const keepCategoryChipVisible = useCallback((categoryId, { forceCenter = false } = {}) => {
    const container = navbarRef.current;
    const button = container?.querySelector(`[data-cat="${categoryId}"]`);
    if (!container || !button) return;

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const buttonLeft = button.offsetLeft;
    const buttonRight = buttonLeft + button.offsetWidth;
    const visibleLeft = container.scrollLeft + 12;
    const visibleRight = container.scrollLeft + container.clientWidth - 12;

    if (!forceCenter && buttonLeft >= visibleLeft && buttonRight <= visibleRight) {
      return;
    }

    const nextScrollLeft = forceCenter
      ? buttonLeft - (container.clientWidth - button.offsetWidth) / 2
      : buttonLeft < visibleLeft
        ? buttonLeft - 12
        : buttonRight - container.clientWidth + 12;

    container.scrollTo({
      left: Math.min(maxScrollLeft, Math.max(0, nextScrollLeft)),
      behavior: 'smooth',
    });
  }, []);

  const getHeaderOffset = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return 112;
    }

    const rawValue = window.getComputedStyle(document.documentElement).getPropertyValue('--gm-header-height');
    const parsedValue = Number.parseFloat(rawValue);

    if (Number.isFinite(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }

    return window.innerWidth >= 1024 ? 110 : 126;
  }, []);

  useEffect(() => {
    loadRestaurantData();
  }, [slug, viewOnly]);

  useEffect(() => {
    setShowRestaurantDetails(false);
  }, [slug, viewOnly]);

  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  const productsByCategory = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.Id] = products.filter((product) => product.CategoryId === category.Id);
        return acc;
      }, {}),
    [categories, products],
  );

  const categoriesWithProducts = useMemo(
    () =>
      categories.filter((category) => {
        const categoryProducts = productsByCategory[category.Id] || [];
        return categoryProducts.length > 0;
      }),
    [categories, productsByCategory],
  );

  const allProducts = useMemo(
    () => categoriesWithProducts.flatMap((category) => productsByCategory[category.Id] || []),
    [categoriesWithProducts, productsByCategory],
  );

  useEffect(() => {
    if (categoriesWithProducts.length > 0 && !activeCategory) {
      setActiveCategory(categoriesWithProducts[0].Id);
    }
  }, [categoriesWithProducts, activeCategory]);

  useEffect(() => {
    if (!activeCategory) return;
    if (centerTimeoutRef.current) {
      clearTimeout(centerTimeoutRef.current);
    }
    centerTimeoutRef.current = window.setTimeout(() => {
      keepCategoryChipVisible(activeCategory, { forceCenter: true });
    }, 90);

    return () => {
      if (centerTimeoutRef.current) {
        clearTimeout(centerTimeoutRef.current);
        centerTimeoutRef.current = null;
      }
    };
  }, [activeCategory, keepCategoryChipVisible]);

  useEffect(() => {
    if (categoriesWithProducts.length === 0) return undefined;

    const headerOffset = getHeaderOffset();
    const navbarHeight = navbarRef.current?.getBoundingClientRect().height || 56;
    const observerTopOffset = Math.round(headerOffset + navbarHeight + 20);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibleEntries.length === 0) return;

        const nextActiveCategory = Number(visibleEntries[0].target.dataset.categoryId);
        if (nextActiveCategory !== activeCategoryRef.current) {
          setActiveCategory(nextActiveCategory);
        }
      },
      { rootMargin: `-${observerTopOffset}px 0px -65% 0px`, threshold: 0 },
    );

    Object.values(categoryRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [categoriesWithProducts, getHeaderOffset]);

  const scrollToCategory = useCallback((categoryId) => {
    const element = categoryRefs.current[categoryId];
    if (!element) return;

    const headerOffset = getHeaderOffset();
    const navbarHeight = navbarRef.current?.getBoundingClientRect().height || 56;
    const offset = headerOffset + navbarHeight + 20;
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo(0, Math.max(0, top));
    setActiveCategory(categoryId);
    keepCategoryChipVisible(categoryId, { forceCenter: true });
  }, [getHeaderOffset, keepCategoryChipVisible]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);
      setActiveCategory(null);

      const restaurantResponse = await getRestaurantBySlug(slug);

      if (!restaurantResponse.success) {
        setError('Magaza bulunamadi');
        return;
      }

      setRestaurant(restaurantResponse.data);

      const productsResponse = await getProductsByRestaurant(restaurantResponse.data.Id, viewOnly ? 'view' : 'order');
      if (!productsResponse.success) {
        setError('Menu yuklenirken bir hata olustu');
        return;
      }

      const nextCategories = (productsResponse.data?.categories || []).sort(
        (a, b) => (a.SortOrder || 0) - (b.SortOrder || 0) || a.Name.localeCompare(b.Name, 'tr'),
      );

      const nextProducts = (productsResponse.data?.allProducts || []).map((product) => ({
        ...product,
        RestaurantName: restaurantResponse.data?.Name || 'Bilinmeyen magaza',
      }));

      const imageUrls = collectImageUrls(restaurantResponse.data?.ImageUrl, nextProducts.map((product) => product.ImageUrl));
      await preloadImages(imageUrls);

      setCategories(nextCategories);
      setProducts(nextProducts);
    } catch (err) {
      console.error('Veri yuklenemedi:', err);
      setError('Menu yuklenirken bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const handlePreviousProduct = useCallback(() => {
    const currentIndex = allProducts.findIndex((product) => product.Id === selectedProduct?.Id);
    if (currentIndex > 0) setSelectedProduct(allProducts[currentIndex - 1]);
  }, [allProducts, selectedProduct?.Id]);

  const handleNextProduct = useCallback(() => {
    const currentIndex = allProducts.findIndex((product) => product.Id === selectedProduct?.Id);
    if (currentIndex < allProducts.length - 1) setSelectedProduct(allProducts[currentIndex + 1]);
  }, [allProducts, selectedProduct?.Id]);

  const canGoPrevious = useMemo(() => {
    if (!selectedProduct) return false;
    return allProducts.findIndex((product) => product.Id === selectedProduct.Id) > 0;
  }, [allProducts, selectedProduct]);

  const canGoNext = useMemo(() => {
    if (!selectedProduct) return false;
    const index = allProducts.findIndex((product) => product.Id === selectedProduct.Id);
    return index < allProducts.length - 1;
  }, [allProducts, selectedProduct]);

  if (loading) {
    return (
      <div className="pb-8">
        <HeaderSkeleton />
        <PageShell width="full" className="mt-4 grid gap-4">
          <div className="rounded-[28px] border border-white/70 bg-white px-5 py-4 text-sm font-semibold text-dark-lighter shadow-card">
            Menu hazirlaniyor. Tum urunler yukleniyor.
          </div>
          {[1, 2, 3, 4].map((i) => (
            <ProductSkeleton key={i} />
          ))}
        </PageShell>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="pb-8 pt-6">
        <PageShell width="content">
          <SurfaceCard tone="muted" className="p-8 text-center sm:p-12">
            <h2 className="gm-display text-4xl">Bir sorun olustu</h2>
            <p className="mt-3 text-sm leading-7 text-dark-lighter sm:text-base">{error || 'Magaza bulunamadi'}</p>
            <Button className="mt-6" onClick={() => navigate('/')}>
              Ana sayfaya don
            </Button>
          </SurfaceCard>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="pb-8 pt-4 lg:pb-12">
      <PageShell width="full" className="space-y-4">
        <SurfaceCard className="relative overflow-hidden border border-white/15 p-0">
          <div className="absolute inset-0">
            {restaurant.ImageUrl ? (
              <img src={restaurant.ImageUrl} alt={restaurant.Name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(135deg,#8c477c,#d16b53)]" />
            )}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,18,24,0.58)_0%,rgba(31,24,30,0.24)_42%,rgba(18,14,18,0.36)_100%)]" />
          <div className="absolute inset-x-5 top-0 hidden h-20 rounded-full bg-white/18 blur-3xl sm:block" />

          <div className="relative space-y-4 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              {!viewOnly && (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/14 text-white backdrop-blur-sm transition-all hover:bg-white/22 sm:backdrop-blur-md"
                  aria-label="Geri don"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={restaurant.IsActive ? 'success' : 'danger'}>{restaurant.IsActive ? 'Acik' : 'Kapali'}</Badge>
                  {restaurant.IsFeatured && (
                    <Badge tone="warning">
                      <Sparkles className="h-3 w-3" />
                      One cikan
                    </Badge>
                  )}
                </div>

                <h1 className="mt-2 line-clamp-2 text-xl font-black leading-tight tracking-tight text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.3)] sm:text-2xl">
                  {restaurant.Name}
                </h1>

                {restaurant.Rating && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-white/90 sm:text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/12 px-3 py-2 backdrop-blur-md">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                      {restaurant.Rating}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRestaurantDetails((current) => !current)}
              className="inline-flex w-auto items-center gap-2 self-start rounded-full border border-white/45 bg-[linear-gradient(180deg,rgba(255,248,246,0.78)_0%,rgba(243,231,238,0.72)_100%)] px-3.5 py-2.5 text-left text-[12px] font-bold text-dark shadow-[0_10px_24px_rgba(67,36,56,0.12)] backdrop-blur-sm transition-all duration-200 hover:border-white/60 hover:bg-[linear-gradient(180deg,rgba(255,250,248,0.88)_0%,rgba(245,235,241,0.82)_100%)] sm:w-full sm:justify-between sm:gap-3 sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-sm sm:backdrop-blur-xl"
            >
              <span>{showRestaurantDetails ? 'Gizle' : 'Detaylar'}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-primary transition-transform duration-200 sm:h-4 sm:w-4', showRestaurantDetails && 'rotate-180')} />
            </button>

            <div
              className={cn(
                'grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out',
                showRestaurantDetails ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <div className="relative overflow-hidden rounded-[24px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,248,246,0.82)_0%,rgba(241,230,236,0.78)_100%)] p-4 text-dark shadow-[0_20px_60px_rgba(67,36,56,0.12)] backdrop-blur-md sm:p-5 sm:backdrop-blur-xl">
                  <div className="absolute inset-x-4 top-0 hidden h-16 rounded-full bg-white/40 blur-3xl sm:block" />

                  <div className="relative space-y-4">
                    {restaurant.Description ? (
                      <p className="text-sm leading-6 text-dark-lighter sm:text-[15px]">
                        {restaurant.Description}
                      </p>
                    ) : (
                      <p className="text-sm leading-6 text-dark-lighter sm:text-[15px]">
                        Bu magazanin menusu ve teslimat bilgileri burada yer aliyor.
                      </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      {!viewOnly && restaurant.DeliveryTime && (
                        <div className="rounded-[20px] border border-white/55 bg-white/42 px-4 py-3 backdrop-blur-sm">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">Teslimat</p>
                          <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-dark sm:text-[15px]">
                            <Clock3 className="h-4 w-4 text-primary" />
                            <span>{restaurant.DeliveryTime}</span>
                          </div>
                        </div>
                      )}

                      {!viewOnly && restaurant.MinOrder && (
                        <div className="rounded-[20px] border border-white/55 bg-white/42 px-4 py-3 backdrop-blur-sm">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">Minimum siparis</p>
                          <div className="mt-1.5 text-sm font-semibold text-dark sm:text-[15px]">{restaurant.MinOrder} TL</div>
                        </div>
                      )}

                      {restaurant.Address && (
                        <div className="rounded-[20px] border border-white/55 bg-white/42 px-4 py-3 backdrop-blur-sm sm:col-span-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">Adres</p>
                          <div className="mt-1.5 flex items-start gap-2 text-sm leading-6 text-dark-lighter sm:text-[15px]">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span className="line-clamp-3">{restaurant.Address}</span>
                          </div>
                        </div>
                      )}

                      {restaurant.Rating && (
                        <div className={cn('rounded-[20px] border border-white/55 bg-white/42 px-4 py-3 backdrop-blur-sm', restaurant.Address ? 'sm:col-span-2' : '')}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">Puan</p>
                          <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-dark sm:text-[15px]">
                            <Star className="h-4 w-4 fill-current text-amber-300" />
                            <span>{restaurant.Rating}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </PageShell>

      {categoriesWithProducts.length > 0 && (
        <div className="sticky z-30" style={{ top: 'var(--gm-header-height, 112px)' }}>
          <PageShell width="full">
            <div ref={navbarRef} className="scrollbar-hide flex gap-2 overflow-x-auto rounded-[22px] border border-white/70 bg-white p-2 shadow-sm sm:bg-white/92 sm:shadow-card sm:backdrop-blur-xl">
              {categoriesWithProducts.map((category) => (
                <Chip
                  key={category.Id}
                  data-cat={category.Id}
                  active={activeCategory === category.Id}
                  className={cn('shrink-0 px-4 py-2.5', activeCategory === category.Id && 'text-white')}
                  onClick={() => scrollToCategory(category.Id)}
                >
                  {category.Name}
                </Chip>
              ))}
            </div>
          </PageShell>
        </div>
      )}

      <PageShell width="full" className="mt-4">
        <div className="space-y-6">
          {categoriesWithProducts.length === 0 ? (
            <SurfaceCard tone="muted" className="p-10 text-center">
              <h3 className="gm-display text-4xl">Menu henuz bos</h3>
              <p className="mt-3 text-sm leading-7 text-dark-lighter">Bu magazada henuz urun bulunmuyor.</p>
            </SurfaceCard>
          ) : (
            categoriesWithProducts.map((category, categoryIndex) => {
              const categoryProducts = productsByCategory[category.Id] || [];
              if (!categoryProducts.length) return null;

              return (
                <section key={category.Id} className="space-y-3">
                  <div
                    ref={(element) => {
                      if (element) categoryRefs.current[category.Id] = element;
                      else delete categoryRefs.current[category.Id];
                    }}
                    data-category-id={category.Id}
                    className="scroll-mt-40"
                  >
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Kategori</p>
                        <h2 className="mt-1 text-xl font-bold text-dark sm:text-2xl">{category.Name}</h2>
                      </div>
                      <Badge tone="primary">{categoryProducts.length} urun</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {categoryProducts.map((product, productIndex) => (
                      <div key={product.Id}>
                        <ProductRowCard
                          product={product}
                          onProductClick={handleProductClick}
                          isViewOnly={viewOnly}
                          prioritizeImage={categoryIndex === 0 && productIndex < 6}
                          imageLoadingMode="eager"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
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
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        isViewOnly={viewOnly}
      />
    </div>
  );
}

export default RestaurantMenu;
