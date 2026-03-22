import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Gift, Store, Tag } from 'lucide-react';
import StoreCard from '../components/StoreCard';
import Reveal from '../components/ui/Reveal';
import { getActivePromotions, getRestaurants } from '../services/api';
import { Badge, Button, PageShell, SurfaceCard } from '../components/ui/primitives';
import { getSafeCampaignSubtitle, getSafeCampaignTitle } from '../utils/contentSanitizer';
import { getRestaurantCardImage } from '../utils/imageVariants';
import { preloadImages } from '../utils/pagePreload';

const StoreSkeleton = memo(() => (
  <div className="h-[220px] animate-pulse rounded-[28px] bg-white shadow-card" />
));

const campaignThemeMap = {
  purple: {
    icon: 'bg-[#f5f0ff] text-[#6d28d9]',
    pill: 'border-[#7c3aed]/15 bg-[#f5f0ff] text-[#5b21b6]',
    selector: 'border-surface-border bg-white text-dark-lighter hover:border-[#7c3aed]/18 hover:text-[#5b21b6]',
    selectorActive: 'border-[#7c3aed]/18 bg-[#f5f0ff] text-[#5b21b6]',
    button: 'border border-[#7c3aed]/18 bg-[#f5f0ff] text-[#5b21b6] hover:bg-[#ede9fe]',
  },
  green: {
    icon: 'bg-[#eefbf1] text-[#15803d]',
    pill: 'border-[#15803d]/15 bg-[#eefbf1] text-[#166534]',
    selector: 'border-surface-border bg-white text-dark-lighter hover:border-[#15803d]/18 hover:text-[#166534]',
    selectorActive: 'border-[#15803d]/18 bg-[#eefbf1] text-[#166534]',
    button: 'border border-[#15803d]/18 bg-[#eefbf1] text-[#166534] hover:bg-[#dcfce7]',
  },
  orange: {
    icon: 'bg-[#fff3e9] text-[#ea580c]',
    pill: 'border-[#ea580c]/15 bg-[#fff3e9] text-[#c2410c]',
    selector: 'border-surface-border bg-white text-dark-lighter hover:border-[#ea580c]/18 hover:text-[#c2410c]',
    selectorActive: 'border-[#ea580c]/18 bg-[#fff3e9] text-[#c2410c]',
    button: 'border border-[#ea580c]/18 bg-[#fff3e9] text-[#c2410c] hover:bg-[#ffedd5]',
  },
  red: {
    icon: 'bg-[#fff1f1] text-[#dc2626]',
    pill: 'border-[#dc2626]/15 bg-[#fff1f1] text-[#b91c1c]',
    selector: 'border-surface-border bg-white text-dark-lighter hover:border-[#dc2626]/18 hover:text-[#b91c1c]',
    selectorActive: 'border-[#dc2626]/18 bg-[#fff1f1] text-[#b91c1c]',
    button: 'border border-[#dc2626]/18 bg-[#fff1f1] text-[#b91c1c] hover:bg-[#fee2e2]',
  },
  default: {
    icon: 'bg-primary/10 text-primary',
    pill: 'border-primary/15 bg-primary/10 text-primary',
    selector: 'border-surface-border bg-white text-dark-lighter hover:border-primary/18 hover:text-primary',
    selectorActive: 'border-primary/18 bg-primary/10 text-primary',
    button: 'border border-primary/18 bg-primary/10 text-primary hover:bg-primary/15',
  },
};

function getCampaignTheme(color) {
  if (!color) {
    return campaignThemeMap.default;
  }

  return campaignThemeMap[String(color).trim().toLowerCase()] || campaignThemeMap.default;
}

function formatCampaignCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

function getCampaignSummary(campaign) {
  if (!campaign) {
    return '';
  }

  const discountValue = Number(campaign.DiscountValue);
  const minimumAmount = Number(campaign.MinimumAmount);
  const maxDiscount = Number(campaign.MaxDiscount);
  const normalizedType = String(campaign.DiscountType || '').trim().toLowerCase();

  let benefit = '';

  if (Number.isFinite(discountValue) && discountValue > 0) {
    if (normalizedType === 'percentage') {
      benefit = `%${discountValue} indirim`;
    } else {
      const formattedDiscount = formatCampaignCurrency(discountValue);
      benefit = formattedDiscount ? `${formattedDiscount} TL indirim` : '';
    }
  }

  const conditions = [];

  if (Number.isFinite(minimumAmount) && minimumAmount > 0) {
    const formattedMinimum = formatCampaignCurrency(minimumAmount);
    if (formattedMinimum) {
      conditions.push(`${formattedMinimum} TL uzeri`);
    }
  }

  if (normalizedType === 'percentage' && Number.isFinite(maxDiscount) && maxDiscount > 0) {
    const formattedMaxDiscount = formatCampaignCurrency(maxDiscount);
    if (formattedMaxDiscount) {
      conditions.push(`maks ${formattedMaxDiscount} TL`);
    }
  }

  const summary = [benefit, ...conditions].filter(Boolean).join(' / ');

  if (summary) {
    return summary;
  }

  return campaign.DisplaySubtitle || campaign.Description || '';
}

async function copyText(text) {
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
}

function Home() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);
  const [copiedCampaignId, setCopiedCampaignId] = useState(null);
  const [campaignMotionKey, setCampaignMotionKey] = useState(0);
  const [campaignMotionClass, setCampaignMotionClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const campaignTouchStartRef = useRef({ x: null, y: null });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!campaigns.length) {
      setActiveCampaignIndex(0);
      return;
    }

    if (activeCampaignIndex > campaigns.length - 1) {
      setActiveCampaignIndex(0);
    }
  }, [activeCampaignIndex, campaigns.length]);

  useEffect(() => {
    if (!copiedCampaignId) return undefined;

    const timeoutId = window.setTimeout(() => {
      setCopiedCampaignId(null);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copiedCampaignId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [restaurantsRes, campaignsRes] = await Promise.all([
        getRestaurants(),
        getActivePromotions(),
      ]);

      if (restaurantsRes.success) {
        const nextRestaurants = restaurantsRes.data || [];
        setRestaurants(nextRestaurants);
        preloadImages(nextRestaurants.slice(0, 8).map((restaurant) => getRestaurantCardImage(restaurant))).catch(() => {});
      } else {
        setError('Magazalar yuklenemedi');
      }

      if (campaignsRes.success) {
        setCampaigns(campaignsRes.data || []);
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

  const handleCampaignCopy = useCallback(async (campaign) => {
    if (!campaign?.Code) return;

    const copied = await copyText(campaign.Code);
    setCopiedCampaignId(copied ? campaign.Id : null);
  }, []);

  const animateCampaign = useCallback((direction) => {
    setCampaignMotionClass(direction === 'backward' ? 'animate-campaign-backward' : 'animate-campaign-forward');
    setCampaignMotionKey((current) => current + 1);
  }, []);

  const activateCampaign = useCallback(
    (nextIndex, direction = 'forward') => {
      if (!campaigns.length) return;

      const normalizedIndex = ((nextIndex % campaigns.length) + campaigns.length) % campaigns.length;

      if (normalizedIndex === activeCampaignIndex) {
        return;
      }

      animateCampaign(direction);
      setActiveCampaignIndex(normalizedIndex);
    },
    [activeCampaignIndex, animateCampaign, campaigns.length],
  );

  const showNextCampaign = useCallback(() => {
    if (campaigns.length <= 1) return;

    activateCampaign(activeCampaignIndex + 1, 'forward');
  }, [activateCampaign, activeCampaignIndex, campaigns.length]);

  const showPreviousCampaign = useCallback(() => {
    if (campaigns.length <= 1) return;

    activateCampaign(activeCampaignIndex - 1, 'backward');
  }, [activateCampaign, activeCampaignIndex, campaigns.length]);

  useEffect(() => {
    if (campaigns.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      showNextCampaign();
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [campaigns.length, showNextCampaign]);

  const handleCampaignTouchStart = useCallback((event) => {
    const touch = event.touches?.[0];

    if (!touch) return;

    campaignTouchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, []);

  const handleCampaignTouchEnd = useCallback(
    (event) => {
      const touch = event.changedTouches?.[0];
      const startX = campaignTouchStartRef.current.x;
      const startY = campaignTouchStartRef.current.y;

      campaignTouchStartRef.current = { x: null, y: null };

      if (!touch || startX === null || startY === null) return;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
        return;
      }

      if (deltaX < 0) {
        showNextCampaign();
        return;
      }

      showPreviousCampaign();
    },
    [showNextCampaign, showPreviousCampaign],
  );

  const handleCampaignTouchCancel = useCallback(() => {
    campaignTouchStartRef.current = { x: null, y: null };
  }, []);

  const activeCampaign = campaigns[activeCampaignIndex] || null;
  const campaignTheme = getCampaignTheme(activeCampaign?.BgColor);
  const campaignSummary = getCampaignSummary(activeCampaign);
  const campaignTitle = getSafeCampaignTitle(activeCampaign);
  const campaignSubtitle = getSafeCampaignSubtitle(activeCampaign, { title: campaignTitle, summary: campaignSummary });

  if (loading) {
    return (
      <div className="pb-8 pt-4 lg:pb-12">
        <PageShell width="full" className="space-y-4">
          <div className="h-44 animate-pulse rounded-[32px] bg-[linear-gradient(135deg,#eadce7,#f3ebe6)]" />
          <div className="rounded-[28px] border border-white/70 bg-white px-5 py-4 text-sm font-semibold text-dark-lighter shadow-card">
            Ana sayfa hazirlaniyor. Magazalar yukleniyor.
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <StoreSkeleton key={i} />
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
          <Reveal variant="section-enter">
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
          </Reveal>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="pb-8 pt-4 lg:pb-12">
      <PageShell width="full" className="space-y-4 sm:space-y-5">
        {activeCampaign && (
          <Reveal variant="section-enter">
            <SurfaceCard
              className="overflow-hidden rounded-[20px] border border-surface-border bg-white px-3 py-2.5 shadow-card sm:px-3.5 sm:py-3"
              onTouchStart={handleCampaignTouchStart}
              onTouchEnd={handleCampaignTouchEnd}
              onTouchCancel={handleCampaignTouchCancel}
            >
              <div key={`${activeCampaign.Id}-${campaignMotionKey}`} className={campaignMotionClass}>
                <div className="flex items-center gap-2.5">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] ${campaignTheme.icon}`}
                    >
                      {activeCampaign.IconType?.toLowerCase() === 'gift' ? (
                        <Gift className="h-3.5 w-3.5" />
                      ) : (
                        <Tag className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate text-sm font-bold text-dark sm:text-[15px]">{campaignTitle}</h2>
                        {campaigns.length > 1 && (
                          <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-dark-lighter">
                            {activeCampaignIndex + 1}/{campaigns.length}
                          </span>
                        )}
                      </div>
                      {campaignSummary && <p className="mt-0.5 truncate text-[11px] font-medium text-dark-lighter sm:text-xs">{campaignSummary}</p>}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] ${campaignTheme.pill}`}
                        >
                          {activeCampaign.Code}
                        </span>
                        {campaignSubtitle && campaignSubtitle !== campaignSummary && (
                          <span className="hidden truncate text-xs font-medium text-dark-lighter md:block">{campaignSubtitle}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCampaignCopy(activeCampaign)}
                    aria-label={`${activeCampaign.Code} kodunu kopyala`}
                    className={`inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition-colors sm:h-9 sm:px-3 ${campaignTheme.button}`}
                  >
                    {copiedCampaignId === activeCampaign.Id ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Kopyalandi</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Kopyala</span>
                      </>
                    )}
                  </button>
                </div>

                {campaigns.length > 1 && (
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    {campaigns.map((campaign, index) => {
                      const selected = index === activeCampaignIndex;
                      return (
                        <button
                          key={campaign.Id}
                          type="button"
                          onClick={() => activateCampaign(index, index > activeCampaignIndex ? 'forward' : 'backward')}
                          aria-label={`${campaign.Code} kampanyasini goster`}
                          className={`h-2 w-2 shrink-0 rounded-full transition-all ${
                            selected ? 'scale-110 bg-primary' : 'bg-dark-lighter/25 hover:bg-dark-lighter/45'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </SurfaceCard>
          </Reveal>
        )}

        <Reveal variant="section-enter">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Magazalar</p>
              <h2 className="mt-1 text-xl font-bold text-dark sm:text-2xl">Size uygun magazalar</h2>
            </div>
            <Badge tone="primary">{restaurants.length} magaza</Badge>
          </div>
        </Reveal>

        {restaurants.length === 0 ? (
          <Reveal variant="reveal-soft">
            <SurfaceCard tone="muted" className="p-10 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-card">
                <Store className="h-9 w-9 text-primary" />
              </div>
              <h3 className="gm-display mt-6 text-4xl">Henuz magaza yok</h3>
              <p className="mt-3 text-sm leading-7 text-dark-lighter">Yakinda yeni magazalar eklenecek.</p>
            </SurfaceCard>
          </Reveal>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant, index) => (
              <Reveal key={restaurant.Id} variant="reveal-up" delay={Math.min(index, 5) * 55}>
                <StoreCard
                  restaurant={restaurant}
                  onClick={() => handleRestaurantClick(restaurant)}
                  imageLoadingMode={index < 6 ? 'eager' : 'lazy'}
                  prioritizeImage={index < 6}
                />
              </Reveal>
            ))}
          </div>
        )}

      </PageShell>
    </div>
  );
}

export default Home;
