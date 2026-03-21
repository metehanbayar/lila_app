import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
  Copy,
  Gift,
  Percent,
  Sparkles,
  Star,
  Store,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import ProductDetailModal from '../components/ProductDetailModal';
import FeaturedTicker from '../components/customer/FeaturedTicker';
import { getActivePromotions, getCategories, getFeaturedProducts, getRestaurants } from '../services/api';
import { Badge, Button, PageShell, SectionHeader, SurfaceCard } from '../components/ui/primitives';

const CategoryButton = memo(({ category, onClick }) => {
  const IconComponent = LucideIcons[category.Icon] || LucideIcons.Utensils;

  return (
    <button
      onClick={onClick}
      className="group flex min-w-[120px] items-center gap-3 rounded-[24px] border border-surface-border bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-[18px] text-white shadow-lg shadow-black/10"
        style={{ background: category.Color || '#8C477C' }}
      >
        <IconComponent className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-dark">{category.Name}</p>
        <p className="text-xs text-dark-lighter">Kategori</p>
      </div>
    </button>
  );
});

const CampaignBanner = memo(({ campaigns, onCampaignClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (campaigns.length <= 1) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [campaigns.length]);

  if (!campaigns?.length) return null;

  const campaign = campaigns[currentIndex];
  const isPercentage = campaign.DiscountType === 'percentage';

  return (
    <SurfaceCard
      tone="hero"
      className="relative overflow-hidden p-5 sm:p-7 lg:p-8"
      onClick={() => onCampaignClick?.(campaign)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <Badge className="border border-white/20 bg-white/12 text-white">
            <Sparkles className="h-3 w-3" />
            Aktif kampanya
          </Badge>
          <div className="space-y-3">
            <h3 className="font-display text-4xl leading-none sm:text-5xl lg:text-6xl">
              {isPercentage ? `%${campaign.DiscountValue} indirim` : `${campaign.DiscountValue} TL avantaj`}
            </h3>
            <p className="max-w-xl text-sm leading-7 text-white/82 sm:text-base">
              {campaign.Description || 'Siparis akisini hizlandiran, net ve premium kampanya deneyimi.'}
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white/12 px-4 py-3 text-sm font-semibold">
            <span className="text-white/72">Kod</span>
            <span className="text-lg font-black tracking-[0.14em]">{campaign.Code}</span>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/20 bg-white/12 shadow-lg shadow-black/10">
            {isPercentage ? <Percent className="h-10 w-10 text-white" /> : <Gift className="h-10 w-10 text-white" />}
          </div>
          {campaigns.length > 1 && (
            <div className="flex gap-2">
              {campaigns.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-200 ${idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/35'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
});

const RestaurantCard = memo(({ restaurant, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <article
      onClick={onClick}
      className="group overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative h-52 overflow-hidden">
        {restaurant.ImageUrl ? (
          <>
            {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#f2e6ef,#f2ede8)]" />}
            <img
              src={restaurant.ImageUrl}
              alt={restaurant.Name}
              className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#8c477c,#d16b53)]">
            <span className="font-display text-7xl text-white/45">{restaurant.Name?.charAt(0) || 'R'}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge tone={restaurant.IsActive ? 'success' : 'danger'}>{restaurant.IsActive ? 'Acik' : 'Kapali'}</Badge>
          {restaurant.IsFeatured && (
            <Badge className="bg-accent text-white">
              <Sparkles className="h-3 w-3" />
              Populer
            </Badge>
          )}
        </div>

        {restaurant.DeliveryTime && (
          <div className="absolute bottom-4 right-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-dark shadow-lg">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              {restaurant.DeliveryTime}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-dark">{restaurant.Name}</h3>
            {restaurant.Description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-dark-lighter">{restaurant.Description}</p>}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-current" />
            4.8
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">Ucretsiz teslimat</Badge>
          {restaurant.MinOrder && <Badge tone="warning">Min. {restaurant.MinOrder} TL</Badge>}
        </div>
      </div>
    </article>
  );
});

const CampaignSkeleton = memo(() => <div className="h-[260px] animate-pulse rounded-[32px] bg-[linear-gradient(135deg,#eadce7,#f3ebe6)]" />);
const CategorySkeleton = memo(() => (
  <div className="flex gap-3 overflow-hidden">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-20 w-36 animate-pulse rounded-[24px] bg-white shadow-card" />
    ))}
  </div>
));
const RestaurantSkeleton = memo(() => <div className="h-[332px] animate-pulse rounded-[32px] bg-white shadow-card" />);

function Home() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [restaurantsRes, campaignsRes, categoriesRes, featuredRes] = await Promise.all([
        getRestaurants(),
        getActivePromotions(),
        getCategories(),
        getFeaturedProducts(),
      ]);

      if (restaurantsRes.success) {
        setRestaurants(restaurantsRes.data || []);
      } else {
        setError('Restoranlar yuklenemedi');
      }

      if (campaignsRes.success) {
        setCampaigns(campaignsRes.data || []);
      }

      if (categoriesRes.success) {
        const activeCategories = (categoriesRes.data || [])
          .filter((cat) => cat.IsActive !== false)
          .sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
        setCategories(activeCategories);
      }

      if (featuredRes.success) {
        setFeaturedProducts(featuredRes.data || []);
      }
    } catch (err) {
      console.error('Veri yuklenirken hata:', err);
      setError('Baglanti hatasi olustu');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantClick = useCallback(
    (restaurant) => {
      if (restaurant.Slug) {
        navigate(`/restaurant/${restaurant.Slug}`);
      }
    },
    [navigate],
  );

  const handleCampaignClick = useCallback((campaign) => {
    if (campaign.Code) {
      navigator.clipboard.writeText(campaign.Code);
    }
  }, []);

  const handleCategoryClick = useCallback(
    (category) => {
      navigate(`/search?q=${encodeURIComponent(category.Name)}`);
    },
    [navigate],
  );

  const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleNextProduct = useCallback(() => {
    if (!selectedProduct || featuredProducts.length <= 1) return;
    const index = featuredProducts.findIndex((product) => product.Id === selectedProduct.Id);
    const nextIndex = (index + 1) % featuredProducts.length;
    setSelectedProduct(featuredProducts[nextIndex]);
  }, [selectedProduct, featuredProducts]);

  const handlePrevProduct = useCallback(() => {
    if (!selectedProduct || featuredProducts.length <= 1) return;
    const index = featuredProducts.findIndex((product) => product.Id === selectedProduct.Id);
    const prevIndex = (index - 1 + featuredProducts.length) % featuredProducts.length;
    setSelectedProduct(featuredProducts[prevIndex]);
  }, [selectedProduct, featuredProducts]);

  if (loading) {
    return (
      <div className="pb-8 pt-4 sm:pt-6 lg:pb-12">
        <PageShell width="full" className="space-y-6">
          <CampaignSkeleton />
          <CategorySkeleton />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <RestaurantSkeleton key={i} />
            ))}
          </div>
        </PageShell>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-8 pt-6">
        <PageShell width="content">
          <SurfaceCard tone="muted" className="p-8 text-center sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-card">
              <Store className="h-9 w-9 text-primary" />
            </div>
            <h2 className="gm-display mt-6 text-4xl">Bir sorun olustu</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-dark-lighter sm:text-base">{error}</p>
            <Button className="mt-6" onClick={loadData}>
              Tekrar dene
            </Button>
          </SurfaceCard>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="pb-8 pt-4 sm:pt-6 lg:pb-12">
      <PageShell width="full" className="space-y-6 sm:space-y-8">
        <SurfaceCard tone="hero" className="overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),320px] lg:items-end">
            <div className="space-y-5">
              <span className="gm-eyebrow border-white/20 bg-white/10 text-white">Mobil once, premium akıs</span>
              <div className="space-y-4">
                <h1 className="font-display text-5xl leading-none sm:text-6xl lg:text-7xl">
                  Restoran sec, urunu bul, hizla siparis ver.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
                  Telefon ekraninda hizli, desktopta ferah bir akis. Restoranlar, kampanyalar ve one cikan urunler tek bir
                  editorial landing yapisinda toplandi.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="bg-white text-dark hover:bg-white/92" onClick={() => navigate('/search')}>
                  Kesfet
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => navigate('/favorites')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-white/14"
                >
                  Favorilere git
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Restoran</p>
                <p className="mt-2 text-3xl font-black">{restaurants.length}</p>
                <p className="mt-1 text-sm text-white/72">Aktif liste</p>
              </div>
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Kategori</p>
                <p className="mt-2 text-3xl font-black">{categories.length}</p>
                <p className="mt-1 text-sm text-white/72">Hizli kesfet</p>
              </div>
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">One cikan</p>
                <p className="mt-2 text-3xl font-black">{featuredProducts.length}</p>
                <p className="mt-1 text-sm text-white/72">Secili urun</p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <CampaignBanner campaigns={campaigns} onCampaignClick={handleCampaignClick} />

        {featuredProducts.length > 0 && <FeaturedTicker products={featuredProducts} onProductClick={handleProductClick} />}

        {categories.length > 0 && (
          <SurfaceCard tone="muted" className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Hizli gecis</p>
                <h2 className="text-lg font-bold text-dark sm:text-xl">Kategoriler</h2>
              </div>
              <button onClick={() => navigate('/search')} className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                Tumunu gor
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
              {categories.map((category) => (
                <CategoryButton key={category.Id} category={category} onClick={() => handleCategoryClick(category)} />
              ))}
            </div>
          </SurfaceCard>
        )}

        <SectionHeader
          eyebrow="Restoranlar"
          title="Yakininizdaki mekanlar"
          description={`${restaurants.length} restoran bulundu. Mobilde tek elle rahat, desktopta daha genis editorial grid kullaniliyor.`}
          action={
            <button className="inline-flex items-center gap-2 text-sm font-bold text-primary" onClick={() => navigate('/search')}>
              Kategorilerde ara
              <ArrowRight className="h-4 w-4" />
            </button>
          }
        />

        {restaurants.length === 0 ? (
          <SurfaceCard tone="muted" className="p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-card">
              <Store className="h-9 w-9 text-primary" />
            </div>
            <h3 className="gm-display mt-6 text-4xl">Henuz restoran yok</h3>
            <p className="mt-3 text-sm leading-7 text-dark-lighter">Yakinda yeni mekanlar eklenecek.</p>
          </SurfaceCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.Id} restaurant={restaurant} onClick={() => handleRestaurantClick(restaurant)} />
            ))}
          </div>
        )}
      </PageShell>

      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onNext={handleNextProduct}
        onPrevious={handlePrevProduct}
        canGoNext={featuredProducts.length > 1}
        canGoPrevious={featuredProducts.length > 1}
      />
    </div>
  );
}

export default Home;
