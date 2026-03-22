import { Heart, Plus, Sparkles } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addToFavorites, removeFromFavorites } from '../services/customerApi';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { showSingleAddSuccess } from '../utils/addToCartFeedback';
import { getProductListImage } from '../utils/imageVariants';
import { Badge, cn } from './ui/primitives';

function ProductCard({ product, onProductClick }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useCustomerStore((state) => state.isAuthenticated);
  const isFavorite = useCustomerStore((state) => state.isFavorite);
  const addToFavoritesLocal = useCustomerStore((state) => state.addToFavoritesLocal);
  const removeFromFavoritesLocal = useCustomerStore((state) => state.removeFromFavoritesLocal);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isActive = product.IsActive !== false;
  const productImageUrl = getProductListImage(product);

  const formatPrice = useCallback((value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : '0.00';
  }, []);

  const handleAddToCart = useCallback(
    (e) => {
      e.stopPropagation();
      if (!isActive) return;
      const sourceElement = e.currentTarget.closest('[data-product-card]')?.querySelector('[data-add-to-cart-image="true"]');
      addItem(product);
      showSingleAddSuccess({
        product,
        quantity: 1,
        source: 'grid-card',
        sourceElement,
      });
    },
    [product, addItem, isActive],
  );

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
    <article
      data-product-card="true"
      onClick={handleCardClick}
      className={cn(
        'group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[30px] border transition-all duration-300',
        isActive
          ? 'border-white/70 bg-white shadow-card hover:-translate-y-1 hover:shadow-card-hover'
          : 'border-surface-border bg-surface-muted opacity-75',
      )}
    >
        <div data-add-to-cart-image="true" className="relative aspect-[4/3] overflow-hidden">
          {productImageUrl ? (
            <>
              {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#f2e6ef,#f2ede8)]" />}
              <img
                src={productImageUrl}
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
  );
}

export default memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.Id === nextProps.product.Id &&
    prevProps.product.ImageUrl === nextProps.product.ImageUrl &&
    prevProps.product.ImageThumbUrl === nextProps.product.ImageThumbUrl &&
    prevProps.product.Name === nextProps.product.Name &&
    prevProps.product.Price === nextProps.product.Price &&
    prevProps.product.IsActive === nextProps.product.IsActive &&
    prevProps.product.IsFeatured === nextProps.product.IsFeatured &&
    prevProps.onProductClick === nextProps.onProductClick
  );
});
