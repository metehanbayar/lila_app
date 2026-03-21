import { ChevronRight, Heart, Plus, Sparkles } from 'lucide-react';
import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addToFavorites, removeFromFavorites } from '../services/customerApi';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { Badge, cn } from './ui/primitives';

const formatPrice = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

function ProductRowCard({ product, onProductClick, onAddToCart }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated, isFavorite, addToFavoritesLocal, removeFromFavoritesLocal } = useCustomerStore();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasVariants = product.variants && product.variants.length > 1;
  const isActive = product.IsActive !== false;
  const favorite = isFavorite(product.Id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isActive) return;

    if (hasVariants) {
      onProductClick?.(product);
      return;
    }

    addItem(product);
    onAddToCart?.(product);
  };

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsFavoriteLoading(true);

    try {
      if (favorite) {
        await removeFromFavorites(product.Id);
        removeFromFavoritesLocal(product.Id);
      } else {
        await addToFavorites(product.Id);
        addToFavoritesLocal(product.Id);
      }
    } catch (err) {
      console.error('Favori islemi hatasi:', err);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return (
    <article
      onClick={() => onProductClick?.(product)}
      className={cn(
        'group relative overflow-hidden rounded-[28px] border p-3 transition-all duration-300 sm:p-4',
        isActive
          ? 'border-white/70 bg-white shadow-card hover:-translate-y-1 hover:shadow-card-hover'
          : 'border-surface-border bg-surface-muted opacity-75',
      )}
    >
      <div className="grid gap-4 sm:grid-cols-[132px,minmax(0,1fr)]">
        <div className="relative h-32 overflow-hidden rounded-[24px] bg-surface-muted sm:h-full">
          {product.ImageUrl ? (
            <>
              {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#f2e6ef,#f2ede8)]" />}
              <img
                src={product.ImageUrl}
                alt={product.Name}
                className={cn('h-full w-full object-cover transition-all duration-500 group-hover:scale-105', imageLoaded ? 'opacity-100' : 'opacity-0')}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f6ecef,#f6eee8)]">
              <span className="font-display text-4xl text-primary/30">{product.Name?.charAt(0) || 'U'}</span>
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.IsFeatured && (
              <Badge tone="warning" className="bg-accent/90 text-white">
                <Sparkles className="h-3 w-3" />
                Onerilen
              </Badge>
            )}
            {product.OldPrice && product.OldPrice > product.Price && (
              <Badge tone="success">%{Math.round(((product.OldPrice - product.Price) / product.OldPrice) * 100)} indirim</Badge>
            )}
          </div>

          <button
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading}
            className={cn(
              'absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-2xl border transition-all duration-200',
              favorite ? 'border-primary/20 bg-primary text-white' : 'border-white/60 bg-white/88 text-dark hover:text-primary',
            )}
          >
            <Heart className="h-4 w-4" fill={favorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-base font-bold leading-6 text-dark sm:text-lg">{product.Name}</h3>
            {product.Description && <p className="line-clamp-2 text-sm leading-6 text-dark-lighter">{product.Description}</p>}
            {hasVariants && (
              <div className="flex items-center gap-2">
                <Badge tone="primary">{product.variants.length} secenek</Badge>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-primary-dark">{formatPrice(product.Price)} TL</span>
                {product.OldPrice && product.OldPrice > product.Price && (
                  <span className="text-sm text-dark-lighter line-through">{formatPrice(product.OldPrice)} TL</span>
                )}
              </div>
              {hasVariants && <p className="text-xs font-medium uppercase tracking-[0.18em] text-dark-lighter">baslayan fiyat</p>}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isActive}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200',
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5' : 'bg-white text-dark-lighter',
              )}
            >
              {isActive ? (
                hasVariants ? (
                  <>
                    Sec
                    <ChevronRight className="h-4 w-4" strokeWidth={3} />
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" strokeWidth={3} />
                    Ekle
                  </>
                )
              ) : (
                'Mevcut degil'
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductRowCard);
