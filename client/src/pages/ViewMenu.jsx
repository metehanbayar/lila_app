import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, Eye, MapPin, Star } from 'lucide-react';
import ProductDetailModal from '../components/ProductDetailModal';
import { getProductsByRestaurant, getRestaurantBySlug } from '../services/api';
import { Badge, PageShell, SurfaceCard, cn } from '../components/ui/primitives';

const HeroSkeleton = memo(() => (
  <PageShell width="full" className="pt-4 sm:pt-6">
    <div className="h-[320px] animate-pulse rounded-[34px] bg-[linear-gradient(135deg,#eadce7,#f3ebe6)]" />
  </PageShell>
));

const ProductSkeleton = memo(() => <div className="h-40 animate-pulse rounded-[28px] bg-white shadow-card" />);

const ViewProductCard = memo(({ product }) => {
  const hasVariants = product.variants && product.variants.length > 0;
  const defaultVariant = hasVariants ? product.variants.find((variant) => variant.IsDefault) || product.variants[0] : null;
  const displayPrice = defaultVariant ? defaultVariant.Price : product.Price;

  return (
    <article
      onClick={() => product.onClick?.(product)}
      className="group overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="grid gap-4 p-3 sm:grid-cols-[132px,minmax(0,1fr)] sm:p-4">
        <div className="overflow-hidden rounded-[24px] bg-surface-muted">
          {product.ImageUrl ? (
            <img src={product.ImageUrl} alt={product.Name} className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-full" loading="lazy" />
          ) : (
            <div className="flex h-32 items-center justify-center bg-[linear-gradient(135deg,#f6ecef,#f6eee8)] sm:h-full">
              <span className="font-display text-4xl text-primary/30">{product.Name?.charAt(0) || 'U'}</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-base font-bold leading-6 text-dark sm:text-lg">{product.Name}</h3>
            {product.Description && <p className="line-clamp-2 text-sm leading-6 text-dark-lighter">{product.Description}</p>}
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              {hasVariants && <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dark-lighter">Baslayan fiyat</p>}
              <p className="mt-1 text-2xl font-black text-primary-dark">{Number(displayPrice).toFixed(2)} TL</p>
            </div>
            {hasVariants && <Badge tone="primary">{product.variants.length} secenek</Badge>}
          </div>
        </div>
      </div>
    </article>
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

  useEffect(() => {
    if (categoriesWithProducts.length > 0 && !activeCategory) {
      setActiveCategory(categoriesWithProducts[0].Id);
    }
  }, [categoriesWithProducts, activeCategory]);

  useEffect(() => {
    if (categoriesWithProducts.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const newActiveId = Number(visible[0].target.dataset.categoryId);
          if (newActiveId !== activeCategory) {
            setActiveCategory(newActiveId);
            const button = navbarRef.current?.querySelector(`[data-cat="${newActiveId}"]`);
            button?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
    );

    Object.values(categoryRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [categoriesWithProducts, activeCategory]);

  const scrollToCategory = useCallback((categoryId) => {
    const element = categoryRefs.current[categoryId];
    if (!element) return;
    const offset = window.innerWidth >= 1024 ? 120 : 168;
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setActiveCategory(categoryId);
  }, []);

  const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const allProducts = useMemo(() => products, [products]);

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
    return index !== -1 && index < allProducts.length - 1;
  }, [allProducts, selectedProduct]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);
      const restaurantResponse = await getRestaurantBySlug(slug);

      if (restaurantResponse.success) {
        setRestaurant(restaurantResponse.data);
        const productsResponse = await getProductsByRestaurant(restaurantResponse.data.Id, 'view');

        if (productsResponse.success) {
          setCategories(productsResponse.data.categories);
          setProducts(productsResponse.data.allProducts);
        }
      } else {
        setError('Restoran bulunamadi');
      }
    } catch (err) {
      console.error('Veri yuklenemedi:', err);
      setError('Menu yuklenirken bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-8">
        <HeroSkeleton />
        <PageShell width="full" className="mt-6 grid gap-4 lg:grid-cols-[280px,minmax(0,1fr)]">
          <div className="hidden lg:block h-[360px] animate-pulse rounded-[30px] bg-white shadow-card" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
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
            <p className="mt-3 text-sm leading-7 text-dark-lighter sm:text-base">{error || 'Restoran bulunamadi'}</p>
            <Button className="mt-6" onClick={() => navigate('/')}>
              Ana sayfaya don
            </Button>
          </SurfaceCard>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="pb-8 pt-4 sm:pt-6 lg:pb-12">
      <PageShell width="full">
        <SurfaceCard tone="hero" className="relative overflow-hidden p-5 sm:p-7 lg:p-8">
          <div className="absolute inset-0">
            {restaurant.ImageUrl ? (
              <>
                <img src={restaurant.ImageUrl} alt={restaurant.Name} className="h-full w-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,27,29,0.05),rgba(36,27,29,0.48))]" />
              </>
            ) : null}
          </div>

          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-white/14"
              >
                <ArrowLeft className="h-4 w-4" />
                Geri don
              </button>
              <Badge className="border border-white/20 bg-white/12 text-white">
                <Eye className="h-3 w-3" />
                Sadece goruntuleme
              </Badge>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-white/12 shadow-lg shadow-black/10">
                {restaurant.ImageUrl ? (
                  <img src={restaurant.ImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-4xl text-white">{restaurant.Name?.charAt(0) || 'R'}</span>
                )}
              </div>

              <div className="min-w-0 space-y-3">
                <h1 className="font-display text-4xl leading-none sm:text-5xl lg:text-6xl">{restaurant.Name}</h1>
                {restaurant.Description && <p className="max-w-2xl text-sm leading-7 text-white/82 sm:text-base">{restaurant.Description}</p>}
                <div className="flex flex-wrap gap-3 text-sm font-medium text-white/80">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                    <Star className="h-4 w-4 fill-current text-amber-300" />
                    4.8
                  </span>
                  {restaurant.DeliveryTime && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                      <Clock3 className="h-4 w-4 text-white" />
                      {restaurant.DeliveryTime}
                    </span>
                  )}
                  {restaurant.Address && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                      <MapPin className="h-4 w-4 text-white" />
                      <span className="max-w-[240px] truncate">{restaurant.Address}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </PageShell>

      {categoriesWithProducts.length > 0 && (
        <div className="sticky top-[102px] z-30 mt-4 lg:hidden">
          <PageShell width="full">
            <div ref={navbarRef} className="scrollbar-hide flex gap-2 overflow-x-auto rounded-[24px] border border-white/70 bg-white/88 p-2 shadow-card backdrop-blur-xl">
              {categoriesWithProducts.map((category) => (
                <button
                  key={category.Id}
                  data-cat={category.Id}
                  onClick={() => scrollToCategory(category.Id)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                    activeCategory === category.Id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-muted text-dark-lighter',
                  )}
                >
                  {category.Name}
                </button>
              ))}
            </div>
          </PageShell>
        </div>
      )}

      <PageShell width="full" className="mt-6 grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <SurfaceCard className="sticky top-[118px] p-4">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Bolumler</p>
              <h2 className="text-xl font-bold text-dark">Kategori gecisi</h2>
            </div>
            <div className="grid gap-2">
              {categoriesWithProducts.map((category) => (
                <button
                  key={category.Id}
                  onClick={() => scrollToCategory(category.Id)}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200',
                    activeCategory === category.Id
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-surface-muted text-dark-lighter hover:bg-white hover:text-dark',
                  )}
                >
                  {category.Name}
                </button>
              ))}
            </div>
          </SurfaceCard>
        </aside>

        <div className="space-y-8">
          {categoriesWithProducts.length === 0 ? (
            <SurfaceCard tone="muted" className="p-10 text-center">
              <h3 className="gm-display text-4xl">Menu henuz bos</h3>
              <p className="mt-3 text-sm leading-7 text-dark-lighter">Bu restoranda henuz goruntulenebilir urun yok.</p>
            </SurfaceCard>
          ) : (
            categoriesWithProducts.map((category) => {
              const categoryProducts = productsByCategory[category.Id] || [];
              if (!categoryProducts.length) return null;

              return (
                <section key={category.Id} className="space-y-4">
                  <div
                    ref={(el) => {
                      if (el) categoryRefs.current[category.Id] = el;
                      else delete categoryRefs.current[category.Id];
                    }}
                    data-category-id={category.Id}
                  >
                    <SurfaceCard tone="muted" className="p-5 sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Kategori</p>
                          <h2 className="gm-display mt-2 text-3xl sm:text-4xl">{category.Name}</h2>
                        </div>
                        <Badge tone="primary">{categoryProducts.length} urun</Badge>
                      </div>
                    </SurfaceCard>
                  </div>

                  <div className="grid gap-4">
                    {categoryProducts.map((product) => (
                      <ViewProductCard key={product.Id} product={{ ...product, onClick: handleProductClick }} />
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
        isViewOnly
      />
    </div>
  );
}

export default ViewMenu;
