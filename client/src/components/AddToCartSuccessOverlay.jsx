import { Check, Package, ShoppingBag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import useAddToCartFeedbackStore from '../store/addToCartFeedbackStore';
import { cn } from './ui/primitives';

const FULLSCREEN_TIMING = {
  enter: 280,
  visible: 1080,
  exit: 200,
};

const MINI_TIMING = {
  enter: 220,
  visible: 880,
  exit: 180,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const isFullscreenFeedback = (entry) => entry?.mode === 'bulk' || entry?.source === 'modal';

const getFeedbackTiming = (entry) => (isFullscreenFeedback(entry) ? FULLSCREEN_TIMING : MINI_TIMING);

function AddToCartSuccessOverlay() {
  const navigate = useNavigate();
  const entry = useAddToCartFeedbackStore((state) => state.entry);
  const dismissAddSuccess = useAddToCartFeedbackStore((state) => state.dismissAddSuccess);
  const [renderedEntry, setRenderedEntry] = useState(null);
  const [phase, setPhase] = useState('hidden');

  const finalizeEntry = useCallback(
    (currentEntry, navigateToCart = false) => {
      dismissAddSuccess();
      setRenderedEntry(null);
      setPhase('hidden');

      currentEntry?.onComplete?.();

      if (navigateToCart) {
        navigate('/cart');
      }
    },
    [dismissAddSuccess, navigate],
  );

  useEffect(() => {
    if (!entry) {
      return undefined;
    }

    const timing = getFeedbackTiming(entry);

    setRenderedEntry(entry);
    setPhase('prepare');

    const enterFrame = window.requestAnimationFrame(() => {
      setPhase('visible');
    });

    const exitTimer = window.setTimeout(() => {
      setPhase('exit');
    }, timing.enter + timing.visible);

    const clearTimer = window.setTimeout(() => {
      finalizeEntry(entry);
    }, timing.enter + timing.visible + timing.exit);

    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(exitTimer);
      window.clearTimeout(clearTimer);
    };
  }, [entry, finalizeEntry]);

  const isFullscreen = isFullscreenFeedback(renderedEntry);

  useEffect(() => {
    if (!renderedEntry || !isFullscreen || typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen, renderedEntry]);

  const title = useMemo(() => {
    if (!renderedEntry) {
      return '';
    }

    return renderedEntry.mode === 'bulk' ? 'Urunler sepete eklendi' : 'Sepete eklendi';
  }, [renderedEntry]);

  const subtitle = useMemo(() => {
    if (!renderedEntry) {
      return '';
    }

    if (renderedEntry.mode === 'bulk') {
      return `${renderedEntry.addedCount} urun sepetinize eklendi`;
    }

    if (renderedEntry.variantName) {
      return `${renderedEntry.variantName} secimiyle ${renderedEntry.quantity} adet eklendi`;
    }

    return `${renderedEntry.quantity} adet sepete eklendi`;
  }, [renderedEntry]);

  if (!renderedEntry) {
    return null;
  }

  const timing = getFeedbackTiming(renderedEntry);
  const cardVisible = phase === 'visible';
  const cardExiting = phase === 'exit';
  const progressDuration = `${timing.enter + timing.visible}ms`;

  if (!isFullscreen) {
    return createPortal(
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.6rem+env(safe-area-inset-bottom,0px))] z-[1200] px-4 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[390px]">
        <div
          key={renderedEntry.id}
          className={cn(
            'pointer-events-auto mx-auto w-full max-w-[420px] overflow-hidden rounded-[24px] border border-dark/5 bg-white p-3 shadow-[0_22px_44px_-24px_rgba(36,27,29,0.34)] transition-all duration-300 sm:ml-auto sm:mr-0 sm:p-3.5',
            phase === 'prepare' && 'translate-y-6 scale-[0.95] opacity-0',
            cardVisible && 'translate-y-0 scale-100 opacity-100',
            cardExiting && 'translate-y-4 scale-[0.98] opacity-0',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-primary text-white shadow-lg shadow-primary/18">
              <Check className="h-4 w-4" strokeWidth={3} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-black text-dark">{renderedEntry.productName || title}</p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-dark/80">
                <span>{renderedEntry.cartItemCount} urun</span>
                <span className="h-1 w-1 rounded-full bg-dark/25" />
                <span className="truncate text-primary-dark">{formatCurrency(renderedEntry.cartTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => finalizeEntry(renderedEntry, true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/14 bg-primary/10 px-3 py-2 text-xs font-bold text-primary-dark transition-colors hover:bg-primary/14"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Sepet
            </button>
          </div>

          {renderedEntry.variantName && (
            <div className="mt-2 flex items-center gap-2 pl-14 text-[11px] font-medium text-dark/78">
              <Package className="h-3.5 w-3.5 text-primary/72" />
              <span className="line-clamp-1">{renderedEntry.variantName}</span>
            </div>
          )}

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-dark/8">
            <div
              className="animate-success-progress h-full rounded-full bg-[linear-gradient(90deg,rgba(140,71,124,0.94),rgba(209,107,83,0.88))]"
              style={{ animationDuration: progressDuration }}
            />
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[1200]">
      <div
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(250,246,243,0.94)_42%,rgba(238,227,233,0.86)_100%)] transition-all duration-300',
          phase !== 'hidden' && 'animate-success-backdrop',
          cardVisible && 'opacity-100 backdrop-blur-sm sm:backdrop-blur-md',
          !cardVisible && !cardExiting && 'opacity-0 backdrop-blur-none',
          cardExiting && 'opacity-0 backdrop-blur-none',
        )}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-success-orb absolute left-1/2 top-[14%] hidden h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-white/70 blur-[96px] sm:block" />
        <div className="animate-success-orb absolute right-[8%] top-[20%] hidden h-[260px] w-[260px] rounded-full bg-primary/12 blur-[88px] sm:block" style={{ animationDelay: '0.35s' }} />
        <div className="animate-success-orb absolute bottom-[12%] right-[10%] hidden h-[240px] w-[240px] rounded-full bg-accent/12 blur-[82px] sm:block" style={{ animationDelay: '0.7s' }} />
        <div className="animate-success-orb absolute left-[6%] top-[58%] hidden h-[220px] w-[220px] rounded-full bg-white/60 blur-[82px] sm:block" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative flex h-full items-center justify-center p-4 sm:p-6">
        <div
          key={renderedEntry.id}
          className={cn(
            'relative w-full max-w-[440px] overflow-hidden rounded-[34px] border border-white/90 bg-white/97 p-5 shadow-card backdrop-blur-md transition-all duration-300 sm:p-6 sm:shadow-premium sm:backdrop-blur-2xl',
            phase !== 'hidden' && 'animate-success-card',
            phase === 'prepare' && 'translate-y-4 scale-[0.96] opacity-0',
            cardVisible && 'translate-y-0 scale-100 opacity-100',
            cardExiting && 'animate-success-card-exit',
          )}
        >
          <div className="pointer-events-none absolute inset-x-[-18%] top-0 hidden h-[120px] animate-success-sheen bg-[linear-gradient(105deg,transparent_18%,rgba(255,255,255,0.72)_46%,transparent_74%)] sm:block" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),rgba(140,71,124,0.08)_42%,transparent_72%)]" />

          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
              <div className="absolute inset-0 rounded-full bg-primary/12" />
              <div className="absolute inset-[8%] rounded-full border border-primary/10 bg-primary/5" />
              <div className="animate-success-halo absolute inset-[14%] rounded-full border border-primary/20 opacity-60" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 sm:h-[72px] sm:w-[72px]">
                <Check className="h-7 w-7" strokeWidth={3} />
              </div>
            </div>

            <div className="animate-success-content mt-4 space-y-2" style={{ animationDelay: '80ms' }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Sepet</p>
              <h2 className="text-2xl font-black tracking-tight text-dark sm:text-[2rem]">{title}</h2>
              <p className="text-sm leading-6 text-dark-lighter sm:text-base">{subtitle}</p>
            </div>

            <div className="animate-success-content mt-5 w-full rounded-[28px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.36),rgba(240,236,233,0.52))] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_18px_36px_-30px_rgba(36,27,29,0.12)] backdrop-blur-xl sm:p-5" style={{ animationDelay: '140ms' }}>
              {renderedEntry.mode === 'single' ? (
                <div className="space-y-3">
                  <div className="relative h-36 overflow-hidden rounded-[24px] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] shadow-sm">
                    {renderedEntry.imageUrl ? (
                      <img src={renderedEntry.imageUrl} alt={renderedEntry.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1e4ec,#f2ece5)]">
                        <Package className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_34%,rgba(24,18,24,0.42)_100%)]" />
                    <div className="absolute left-3 top-3 inline-flex items-center rounded-full border border-white/22 bg-black/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                      Adet {renderedEntry.quantity}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1 px-1">
                    <p className="line-clamp-2 text-sm font-bold leading-6 text-dark sm:text-base">{renderedEntry.productName}</p>
                    {renderedEntry.variantName && <p className="mt-1 text-xs font-medium text-dark-lighter sm:text-sm">{renderedEntry.variantName}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-white/55 bg-white/44 text-primary shadow-sm backdrop-blur-sm">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark sm:text-base">{renderedEntry.addedCount} urun hazir</p>
                    <p className="mt-1 text-xs text-dark-lighter sm:text-sm">Tekrar siparis kalemleri sepetinize aktarildi.</p>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[20px] border border-white/55 bg-white/42 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-dark-lighter">Sepetteki urun</p>
                  <p className="mt-1 text-lg font-black text-dark">{renderedEntry.cartItemCount}</p>
                </div>
                <div className="rounded-[20px] border border-white/55 bg-white/42 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-dark-lighter">Yeni toplam</p>
                  <p className="mt-1 text-lg font-black text-primary-dark">{formatCurrency(renderedEntry.cartTotal)}</p>
                </div>
              </div>
            </div>

            <div className="animate-success-content mt-4 w-full rounded-[22px] border border-white/80 bg-white/88 px-4 py-3 text-left shadow-sm" style={{ animationDelay: '180ms' }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-dark-lighter sm:text-sm">Bu bildirim birazdan otomatik kapanacak.</p>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Sure</span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="animate-success-progress h-full rounded-full bg-[linear-gradient(90deg,rgba(140,71,124,0.94),rgba(209,107,83,0.88))]"
                  style={{ animationDuration: progressDuration }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => finalizeEntry(renderedEntry, true)}
              className="animate-success-content mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 sm:text-base"
              style={{ animationDelay: '210ms' }}
            >
              <ShoppingBag className="h-4 w-4" />
              Sepete git
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AddToCartSuccessOverlay;
