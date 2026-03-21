import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock3, Gift, Search, Star, Store } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getActivePromotions, getCategories, getRestaurants } from '../services/api';
import { Badge, Button, Chip, PageShell, SurfaceCard } from '../components/ui/primitives';

const CategorySkeleton = memo(() => (
  <div className="flex gap-2 overflow-hidden">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-11 w-28 animate-pulse rounded-full bg-white shadow-card" />
    ))}
  </div>
));

const RestaurantSkeleton = memo(() => (
  <div className="h-[220px] animate-pulse rounded-[28px] bg-white shadow-card" />
));

const QuickCategory = memo(({ category, onClick }) => {
  const IconComponent = LucideIcons[category.Icon] || LucideIcons.Utensils;

  return (
    <Chip className="shrink-0 gap-2 px-4 py-3" onClick={onClick}>
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full text-white"
        style={{ background: category.Color || '#8C477C' }}
      >
        <IconComponent className="h-3.5 w-3.5" />
      </span>
      <span>{category.Name}</span>
    </Chip>
  );
});

const RestaurantCard = memo(({ restaurant, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <article
      onClick={onClick}
      className="group overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative h-40 overflow-hidden sm:h-44">
        {restaurant.ImageUrl ? (
          <>
            {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#f2e6ef,#f2ede8)]" />}
            <img
              src={restaurant.ImageUrl}
              alt={restaurant.Name}
              className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#8c477c,#d16b53)]">
            <span className="font-display text-6xl text-white/45">{restaurant.Name?.charAt(0) || 'R'}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge tone={restaurant.IsActive ? 'success' : 'danger'}>{restaurant.IsActive ? 'Acik' : 'Kapali'}</Badge>
          {restaurant.IsFeatured && <Badge tone="warning">Populer</Badge>}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-dark">{restaurant.Name}</h3>
            {restaurant.Description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-dark-lighter">{restaurant.Description}</p>}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-current" />
            4.8
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-dark-lighter">
          {restaurant.DeliveryTime && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-2">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              {restaurant.DeliveryTime}
            </span>
          )}
          {restaurant.MinOrder && <span className="rounded-full bg-surface-muted px-3 py-2">Min. {restaurant.MinOrder} TL</span>}
        </div>
      </div>
    </article>
  );
});

function Home() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [restaurantsRes, campaignsRes, categoriesRes] = await Promise.all([
        getRestaurants(),
        getActivePromotions(),
        getCategories(),
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
        setCategories(
          (categoriesRes.data || [])
            .filter((cat) => cat.IsActive !== false)
            .sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0)),
        );
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

  const handleCategoryClick = useCallback(
    (category) => {
      navigate(`/search?q=${encodeURIComponent(category.Name)}`);
    },
    [navigate],
  );

  const handleCampaignCopy = useCallback(async (campaign) => {
    if (!campaign?.Code || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(campaign.Code);
    } catch {
      // noop
    }
  }, []);

  if (loading) {
    return (
      <div className="pb-8 pt-4 lg:pb-12">
        <PageShell width="full" className="space-y-4">
          <div className="h-36 animate-pulse rounded-[28px] bg-[linear-gradient(135deg,#eadce7,#f3ebe6)]" />
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
    <div className="pb-8 pt-4 lg:pb-12">
      <PageShell width="full" className="space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Hizli siparis</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-dark sm:text-3xl">Restoran secip hemen siparise gecin.</h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="justify-center" onClick={() => navigate('/search')}>
              <Search className="h-4 w-4" />
              Restoran veya urun ara
            </Button>
            <Button variant="secondary" className="justify-center" onClick={() => navigate('/favorites')}>
              Favoriler
            </Button>
          </div>
        </div>

        {campaigns.length > 0 && (
          <button
            onClick={() => handleCampaignCopy(campaigns[0])}
            className="flex w-full items-center justify-between gap-3 rounded-[22px] border border-primary/15 bg-primary/5 px-4 py-3 text-left transition-all hover:border-primary/25 hover:bg-primary/10"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-primary text-white">
                <Gift className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-dark">
                  {campaigns[0].DisplayTitle || campaigns[0].Description || 'Aktif kampanya'}
                </p>
                <p className="text-xs font-semibold text-dark-lighter">Kod: {campaigns[0].Code} kopyalamak icin dokun</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          </button>
        )}

        {categories.length > 0 && (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <QuickCategory key={category.Id} category={category} onClick={() => handleCategoryClick(category)} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Restoranlar</p>
            <h2 className="mt-1 text-xl font-bold text-dark sm:text-2xl">Yakindaki mekanlar</h2>
          </div>
          <Badge tone="primary">{restaurants.length} mekan</Badge>
        </div>

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
    </div>
  );
}

export default Home;
