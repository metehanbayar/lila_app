import { Check, Heart, Plus, Sparkles } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addToFavorites, removeFromFavorites } from '../services/customerApi';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { safeSetTimeout } from '../utils/performance';
import { Badge, cn } from './ui/primitives';

function ProductCard({ product, onProductClick }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useCustomerStore((state) => state.isAuthenticated);
  const isFavorite = useCustomerStore((state) => state.isFavorite);
  const addToFavoritesLocal = useCustomerStore((state) => state.addToFavoritesLocal);
  const removeFromFavoritesLocal = useCustomerStore((state) => state.removeFromFavoritesLocal);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isActive = product.IsActive !== false;

  const formatPrice = useCallback((value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : '0.00';
  }, []);

  const handleAddToCart = useCallback(
    (e) => {
      e.stopPropagation();
      if (!isActive) return;
      addItem(product);
      setShowToast(true);
    },
    [product, addItem, isActive],
  );

  useEffect(() => {
    if (!showToast) return undefined;
    const timer = safeSetTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleCardClick = useCallback(() => {
    onProductClick?.(product);
  }, [product, onProductClick]);

  const handleFavoriteToggle = useCallback(
    async (e) => {
      e.stopPropagation();

      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      setIsFavoriteLoading(true);
      const favorite = isFavorite(product.Id);

      try {
        if (favorite) {
          await removeFromFavorites(product.Id);
          removeFromFavoritesLocal(product.Id);
        } else {
          await addToFavorites(product.Id);
          addToFavoritesLocal(product.Id);
        }
      } catch (error) {
        console.error('Favori islemi hatasi:', error);
      } finally {
        setIsFavoriteLoading(false);
      }
    },
    [product.Id, isAuthenticated, isFavorite, removeFromFavoritesLocal, addToFavoritesLocal, navigate],
  );

  const favorite = isFavorite(product.Id);

  return (
    <>
      {showToast && (
        <div className="fixed right-4 top-4 z-50 max-w-sm animate-slideInRight rounded-[28px] border border-white/70 bg-white/92 p-4 shadow-premium backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20">
              <Check className="h-5 w-5" strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-dark">Sepete eklendi</p>
              <p className="mt-1 truncate text-xs text-dark-lighter">{product.Name}</p>
              <button
                onClick={() => {
                  setShowToast(false);
                  safeSetTimeout(() => navigate('/cart'), 200);
                }}
                className="mt-3 text-xs font-bold text-primary hover:text-primary-dark"
              >
                Sepete git
              </button>
            </div>
            <button onClick={() => setShowToast(false)} className="rounded-xl p-2 text-dark-lighter hover:bg-surface-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <article
        onClick={handleCardClick}
        className={cn(
          'group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[30px] border transition-all duration-300',
          isActive
            ? 'border-white/70 bg-white shadow-card hover:-translate-y-1 hover:shadow-card-hover'
            : 'border-surface-border bg-surface-muted opacity-75',
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {product.ImageUrl ? (
            <>
              {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#f2e6ef,#f2ede8)]" />}
              <img
                src={product.ImageUrl}
                alt={product.Name}
                className={cn(
                  'h-full w-full object-cover transition-all duration-700 group-hover:scale-105',
                  imageLoaded ? 'opacity-100' : 'opacity-0',
                  !isActive && 'grayscale',
                )}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f6ecef,#f6eee8)]">
              <span className="font-display text-5xl text-primary/30">{product.Name?.charAt(0) || 'U'}</span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

          {product.IsFeatured && (
            <div className="absolute left-3 top-3">
              <Badge tone="warning" className="bg-accent/90 text-white">
                <Sparkles className="h-3 w-3" />
                One cikan
              </Badge>
            </div>
          )}

          <button
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading}
            className={cn(
              'absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-200',
              favorite
                ? 'border-primary/20 bg-primary text-white shadow-lg shadow-primary/20'
                : 'border-white/60 bg-white/88 text-dark hover:text-primary',
            )}
            title={favorite ? 'Favorilerden cikar' : 'Favorilere ekle'}
          >
            <Heart className="h-4 w-4" fill={favorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-base font-bold leading-6 text-dark">{product.Name}</h3>
            {product.Description && <p className="line-clamp-2 text-sm leading-6 text-dark-lighter">{product.Description}</p>}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dark-lighter">Fiyat</p>
              <p className="mt-1 text-2xl font-black text-primary-dark">{formatPrice(product.Price)} TL</p>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isActive}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5'
                  : 'bg-white text-dark-lighter',
              )}
            >
              {isActive ? (
                <>
                  <Plus className="h-4 w-4" strokeWidth={3} />
                  Ekle
                </>
              ) : (
                'Mevcut degil'
              )}
            </button>
          </div>
        </div>

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-dark px-4 py-2 text-xs font-bold text-white">Su an mevcut degil</span>
          </div>
        )}
      </article>
    </>
  );
}

export default memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.Id === nextProps.product.Id &&
    prevProps.product.ImageUrl === nextProps.product.ImageUrl &&
    prevProps.product.Name === nextProps.product.Name &&
    prevProps.product.Price === nextProps.product.Price &&
    prevProps.product.IsActive === nextProps.product.IsActive &&
    prevProps.product.IsFeatured === nextProps.product.IsFeatured &&
    prevProps.onProductClick === nextProps.onProductClick
  );
});
