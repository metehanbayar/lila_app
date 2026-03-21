import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock3, MapPin, Sparkles, Star } from 'lucide-react';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductRowCard from '../components/ProductRowCard';
import { getProductsByRestaurant, getRestaurantBySlug } from '../services/api';
import { Badge, Button, PageShell, SurfaceCard, cn } from '../components/ui/primitives';

const HeroSkeleton = memo(() => (
  <PageShell width="full" className="pt-4 sm:pt-6">
    <div className="h-[320px] animate-pulse rounded-[34px] bg-[linear-gradient(135deg,#eadce7,#f3ebe6)]" />
  </PageShell>
));

const ProductSkeleton = memo(() => <div className="h-40 animate-pulse rounded-[28px] bg-white shadow-card" />);

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

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);
      const restaurantResponse = await getRestaurantBySlug(slug);

      if (restaurantResponse.success) {
        setRestaurant(restaurantResponse.data);
        const productsResponse = await getProductsByRestaurant(restaurantResponse.data.Id, 'order');

        if (productsResponse.success) {
          setCategories(productsResponse.data.categories);
          setProducts(
            productsResponse.data.allProducts.map((product) => ({
              ...product,
              RestaurantName: restaurantResponse.data?.Name || 'Bilinmeyen restoran',
            })),
          );
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

  const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleAddToCartGlobal = useCallback((product) => {
    setToast({ name: product.Name, quantity: 1 });
    setTimeout(() => setToast(null), 3000);
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

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr),280px] lg:items-end">
            <div className="space-y-5">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-white/14"
              >
                <ArrowLeft className="h-4 w-4" />
                Geri don
              </button>

              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-white/12 shadow-lg shadow-black/10">
                  {restaurant.LogoUrl ? (
                    <img src={restaurant.LogoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-4xl text-white">{restaurant.Name?.charAt(0) || 'R'}</span>
                  )}
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={restaurant.IsActive ? 'success' : 'danger'}>{restaurant.IsActive ? 'Acik' : 'Kapali'}</Badge>
                      {restaurant.IsFeatured && (
                        <Badge className="bg-white/12 text-white">
                          <Sparkles className="h-3 w-3" />
                          Onerilen restoran
                        </Badge>
                      )}
                    </div>
                    <h1 className="font-display text-4xl leading-none sm:text-5xl lg:text-6xl">{restaurant.Name}</h1>
                    {restaurant.Description && <p className="max-w-2xl text-sm leading-7 text-white/82 sm:text-base">{restaurant.Description}</p>}
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm font-medium text-white/80">
                    {restaurant.Rating && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                        <Star className="h-4 w-4 fill-current text-amber-300" />
                        {restaurant.Rating}
                      </span>
                    )}
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

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Kategori</p>
                <p className="mt-2 text-3xl font-black">{categoriesWithProducts.length}</p>
                <p className="mt-1 text-sm text-white/72">Aktif bolum</p>
              </div>
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Urun</p>
                <p className="mt-2 text-3xl font-black">{products.length}</p>
                <p className="mt-1 text-sm text-white/72">Menudeki toplam</p>
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
              <p className="mt-3 text-sm leading-7 text-dark-lighter">Bu restoranda henuz urun bulunmuyor.</p>
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
        <div className="fixed inset-x-4 bottom-24 z-50 animate-slideUp sm:left-auto sm:right-6 sm:w-[360px]">
          <div className="rounded-[28px] border border-white/70 bg-white/92 p-4 shadow-premium backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20">
                <Check className="h-5 w-5" strokeWidth={3} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-dark">Sepete eklendi</p>
                <p className="truncate text-xs text-dark-lighter">{toast.name}</p>
              </div>
              <button onClick={() => navigate('/cart')} className="text-sm font-bold text-primary">
                Sepete git
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantMenu;
