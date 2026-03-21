import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock3, MapPin, Sparkles, Star } from 'lucide-react';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductRowCard from '../components/ProductRowCard';
import { getProductsByRestaurant, getRestaurantBySlug } from '../services/api';
import { Badge, Button, Chip, PageShell, SurfaceCard, cn } from '../components/ui/primitives';

const HeaderSkeleton = memo(() => (
  <PageShell width="full" className="pt-4">
    <div className="h-32 animate-pulse rounded-[28px] bg-[linear-gradient(135deg,#eadce7,#f3ebe6)]" />
  </PageShell>
));

const ProductSkeleton = memo(() => <div className="h-36 animate-pulse rounded-[28px] bg-white shadow-card" />);

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
      { rootMargin: '-120px 0px -70% 0px', threshold: 0 },
    );

    Object.values(categoryRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [categoriesWithProducts, activeCategory]);

  const scrollToCategory = useCallback((categoryId) => {
    const element = categoryRefs.current[categoryId];
    if (!element) return;
    const offset = window.innerWidth >= 1024 ? 150 : 154;
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
    <div className="pb-8 pt-4 lg:pb-12">
      <PageShell width="full" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-dark transition-all hover:bg-white hover:shadow-card"
              aria-label="Geri don"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-surface-muted shadow-sm">
              {restaurant.LogoUrl ? (
                <img src={restaurant.LogoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl text-primary">{restaurant.Name?.charAt(0) || 'R'}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge tone={restaurant.IsActive ? 'success' : 'danger'}>{restaurant.IsActive ? 'Acik' : 'Kapali'}</Badge>
                {restaurant.IsFeatured && (
                  <Badge tone="warning">
                    <Sparkles className="h-3 w-3" />
                    Populer
                  </Badge>
                )}
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-dark sm:text-3xl">{restaurant.Name}</h1>
              {restaurant.Description && <p className="mt-2 max-w-3xl text-sm leading-6 text-dark-lighter">{restaurant.Description}</p>}

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-dark-lighter sm:text-sm">
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
                {restaurant.Address && (
                  <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-surface-muted px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{restaurant.Address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
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
              <p className="mt-3 text-sm leading-7 text-dark-lighter">Bu restoranda henuz urun bulunmuyor.</p>
            </SurfaceCard>
          ) : (
            categoriesWithProducts.map((category) => {
              const categoryProducts = productsByCategory[category.Id] || [];
              if (!categoryProducts.length) return null;

              return (
                <section key={category.Id} className="space-y-3">
                  <div
                    ref={(el) => {
                      if (el) categoryRefs.current[category.Id] = el;
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
              <button onClick={() => navigate('/cart')} className="text-sm font-bold text-primary">
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
