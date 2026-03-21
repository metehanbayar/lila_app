import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Gift, Layers3, Search, Store } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import StoreCard from '../components/StoreCard';
import { getActivePromotions, getCategories, getRestaurants } from '../services/api';
import { Badge, Button, Chip, PageShell, SurfaceCard } from '../components/ui/primitives';

const CategorySkeleton = memo(() => (
  <div className="flex gap-2 overflow-hidden">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-11 w-28 animate-pulse rounded-full bg-white shadow-card" />
    ))}
  </div>
));

const StoreSkeleton = memo(() => (
  <div className="h-[220px] animate-pulse rounded-[28px] bg-white shadow-card" />
));

const QuickCategory = memo(({ category, onClick }) => {
  const IconComponent = LucideIcons[category.Icon] || LucideIcons.Utensils;

  return (
    <Chip className="gap-2 px-4 py-3" onClick={onClick}>
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

function Home() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

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
        setError('Magazalar yuklenemedi');
      }

      if (campaignsRes.success) {
        setCampaigns(campaignsRes.data || []);
      }

      if (categoriesRes.success) {
        setCategories(
          (categoriesRes.data || [])
            .filter((category) => category.IsActive !== false)
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
      const params = new URLSearchParams({
        categoryId: String(category.Id),
        categoryName: category.Name,
      });
      navigate(`/search?${params.toString()}`);
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

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 8);

  if (loading) {
    return (
      <div className="pb-8 pt-4 lg:pb-12">
        <PageShell width="full" className="space-y-4">
          <div className="h-44 animate-pulse rounded-[32px] bg-[linear-gradient(135deg,#eadce7,#f3ebe6)]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <StoreSkeleton key={i} />
            ))}
          </div>
          <CategorySkeleton />
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
        <SurfaceCard className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-5 px-5 py-6 sm:px-6 sm:py-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Cok magaza vitrini</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-dark sm:text-4xl">
                  Konumu sec, magazani bul, siparisi yormadan tamamla.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-dark-lighter sm:text-base">
                  Magaza listesi once gelir. Menuler sade kalir. Arama ve kampanya ilk ekranda net gorunur.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="justify-center" onClick={() => navigate('/search')}>
                  <Search className="h-4 w-4" />
                  Magaza veya urun ara
                </Button>
                <Button variant="secondary" className="justify-center" onClick={() => navigate('/favorites')}>
                  Favoriler
                </Button>
              </div>
            </div>

            <div className="flex items-center bg-[linear-gradient(160deg,#fbf7f4,#f6edf2)] px-5 py-6 sm:px-6 sm:py-7">
              <div className="space-y-4">
                <Badge tone="primary">Hizli akis</Badge>
                <div className="space-y-3 text-sm leading-7 text-dark-lighter">
                  <p>1. Konum bilgisi header uzerinde kalir.</p>
                  <p>2. Kampanya ve arama ilk kararda gorunur.</p>
                  <p>3. Magaza kartlari tek bakista secim yaptirir.</p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        {campaigns.length > 0 && (
          <button
            type="button"
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

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Magazalar</p>
            <h2 className="mt-1 text-xl font-bold text-dark sm:text-2xl">Once magazayi sec, sonra menuye gir.</h2>
          </div>
          <Badge tone="primary">{restaurants.length} magaza</Badge>
        </div>

        {restaurants.length === 0 ? (
          <SurfaceCard tone="muted" className="p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-card">
              <Store className="h-9 w-9 text-primary" />
            </div>
            <h3 className="gm-display mt-6 text-4xl">Henuz magaza yok</h3>
            <p className="mt-3 text-sm leading-7 text-dark-lighter">Yakinda yeni magazalar eklenecek.</p>
          </SurfaceCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => (
              <StoreCard key={restaurant.Id} restaurant={restaurant} onClick={() => handleRestaurantClick(restaurant)} />
            ))}
          </div>
        )}

        {categories.length > 0 && (
          <SurfaceCard tone="muted" className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Ikincil filtreler</p>
                <h3 className="mt-1 text-lg font-bold text-dark">Kategoriler</h3>
              </div>

              {categories.length > 8 && (
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-2"
                  onClick={() => setShowAllCategories((value) => !value)}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
                  {showAllCategories ? 'Daralt' : 'Tum kategoriler'}
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {visibleCategories.map((category) => (
                <QuickCategory key={category.Id} category={category} onClick={() => handleCategoryClick(category)} />
              ))}
            </div>

            <div className="inline-flex items-center gap-2 text-sm font-medium text-dark-lighter">
              <Layers3 className="h-4 w-4 text-primary" />
              Kategoriler ana karar alani degil, hizli kisayol olarak durur.
            </div>
          </SurfaceCard>
        )}
      </PageShell>
    </div>
  );
}

export default Home;
