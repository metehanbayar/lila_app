import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Clock3, MapPin, Sparkles, Star } from 'lucide-react';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductRowCard from '../components/ProductRowCard';
import { getProductsByRestaurant, getRestaurantBySlug } from '../services/api';
import { Badge, Button, Chip, PageShell, SurfaceCard, cn } from '../components/ui/primitives';

const INITIAL_PRODUCTS_PER_CATEGORY = 4;

const HeaderSkeleton = memo(() => (
  <PageShell width="full" className="pt-4">
    <div className="h-48 animate-pulse rounded-[28px] bg-[linear-gradient(135deg,#eadce7,#f3ebe6)]" />
  </PageShell>
));

const ProductSkeleton = memo(() => <div className="h-32 animate-pulse rounded-[28px] bg-white shadow-card" />);

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
  const [expandedCategories, setExpandedCategories] = useState({});
  const categoryRefs = useRef({});
  const navbarRef = useRef(null);

  useEffect(() => {
    loadRestaurantData();
  }, [slug]);

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
    if (categoriesWithProducts.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibleEntries.length === 0) return;

        const nextActiveCategory = Number(visibleEntries[0].target.dataset.categoryId);
        if (nextActiveCategory !== activeCategory) {
          setActiveCategory(nextActiveCategory);
          const button = navbarRef.current?.querySelector(`[data-cat="${nextActiveCategory}"]`);
          button?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      },
      { rootMargin: '-120px 0px -65% 0px', threshold: 0 },
    );

    Object.values(categoryRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [categoriesWithProducts, activeCategory]);

  const scrollToCategory = useCallback((categoryId) => {
    const element = categoryRefs.current[categoryId];
    if (!element) return;

    const offset = window.innerWidth >= 1024 ? 154 : 160;
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setActiveCategory(categoryId);
  }, []);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);
      setExpandedCategories({});
      setActiveCategory(null);

      const restaurantResponse = await getRestaurantBySlug(slug);

      if (!restaurantResponse.success) {
        setError('Magaza bulunamadi');
        return;
      }

      setRestaurant(restaurantResponse.data);

      const productsResponse = await getProductsByRestaurant(restaurantResponse.data.Id, 'order');
      if (!productsResponse.success) {
        setError('Menu yuklenirken bir hata olustu');
        return;
      }

      const nextCategories = (productsResponse.data?.categories || []).sort(
        (a, b) => (a.SortOrder || 0) - (b.SortOrder || 0) || a.Name.localeCompare(b.Name, 'tr'),
      );

      setCategories(nextCategories);
      setProducts(
        (productsResponse.data?.allProducts || []).map((product) => ({
          ...product,
          RestaurantName: restaurantResponse.data?.Name || 'Bilinmeyen magaza',
        })),
      );
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

  const handleAddToCartGlobal = useCallback((product) => {
    setToast({ name: product.Name });
    setTimeout(() => setToast(null), 2500);
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
        <SurfaceCard className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-dark transition-all hover:bg-white hover:shadow-card"
                  aria-label="Geri don"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

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

                  <h1 className="mt-3 text-2xl font-black tracking-tight text-dark sm:text-3xl">{restaurant.Name}</h1>
                  {restaurant.Description && <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-lighter">{restaurant.Description}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-semibold text-dark-lighter sm:text-sm">
                {restaurant.Rating && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-2">
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    {restaurant.Rating}
                  </span>
                )}
                {restaurant.DeliveryTime && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-2">
                    <Clock3 className="h-3.5 w-3.5 text-primary" />
                    {restaurant.DeliveryTime}
                  </span>
                )}
                {restaurant.MinOrder && <span className="rounded-full bg-surface-muted px-3 py-2">Min. {restaurant.MinOrder} TL</span>}
                {restaurant.Address && (
                  <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-surface-muted px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{restaurant.Address}</span>
                  </span>
                )}
              </div>

              <div className="rounded-[24px] border border-surface-border bg-surface-muted/70 px-4 py-3 text-sm leading-7 text-dark-lighter">
                Kategori bazli akis acik. Her bolum ilk etapta 4 urun gosterir, devamini ihtiyac halinde acarsin.
              </div>
            </div>

            <div className="min-h-[220px] bg-surface-muted">
              {restaurant.ImageUrl ? (
                <img src={restaurant.ImageUrl} alt={restaurant.Name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-[linear-gradient(135deg,#8c477c,#d16b53)]">
                  <span className="font-display text-7xl text-white/45">{restaurant.Name?.charAt(0) || 'M'}</span>
                </div>
              )}
            </div>
          </div>
        </SurfaceCard>
      </PageShell>

      {categoriesWithProducts.length > 0 && (
        <div className="sticky top-[94px] z-30 mt-4">
          <PageShell width="full">
            <div ref={navbarRef} className="scrollbar-hide flex gap-2 overflow-x-auto rounded-[22px] border border-white/70 bg-white/92 p-2 shadow-card backdrop-blur-xl">
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
            categoriesWithProducts.map((category) => {
              const categoryProducts = productsByCategory[category.Id] || [];
              if (!categoryProducts.length) return null;

              const isExpanded = Boolean(expandedCategories[category.Id]);
              const visibleProducts = isExpanded ? categoryProducts : categoryProducts.slice(0, INITIAL_PRODUCTS_PER_CATEGORY);
              const hasMoreProducts = categoryProducts.length > INITIAL_PRODUCTS_PER_CATEGORY;

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
                    {visibleProducts.map((product) => (
                      <ProductRowCard
                        key={product.Id}
                        product={product}
                        onProductClick={handleProductClick}
                        onAddToCart={handleAddToCartGlobal}
                      />
                    ))}
                  </div>

                  {hasMoreProducts && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategories((current) => ({
                          ...current,
                          [category.Id]: !current[category.Id],
                        }))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-white px-4 py-3 text-sm font-bold text-primary shadow-card transition-all hover:-translate-y-0.5"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      {isExpanded ? 'Daha az goster' : `Tumunu gor (${categoryProducts.length})`}
                    </button>
                  )}
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
      />

      {toast && (
        <div className="fixed inset-x-4 bottom-24 z-50 animate-slideUp sm:left-auto sm:right-6 sm:w-[320px]">
          <div className="rounded-[24px] border border-white/70 bg-white/92 p-4 shadow-premium backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-secondary text-white shadow-lg shadow-secondary/20">
                <Check className="h-4 w-4" strokeWidth={3} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-dark">Sepete eklendi</p>
                <p className="truncate text-xs text-dark-lighter">{toast.name}</p>
              </div>
              <button type="button" onClick={() => navigate('/cart')} className="text-sm font-bold text-primary">
                Sepet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantMenu;
