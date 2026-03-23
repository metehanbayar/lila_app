import { ChevronRight, Heart, Plus, Sparkles } from 'lucide-react';
import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addToFavorites, removeFromFavorites } from '../services/customerApi';
import useCartStore from '../store/cartStore';
import useCustomerStore from '../store/customerStore';
import { showSingleAddSuccess } from '../utils/addToCartFeedback';
import { getProductListImage } from '../utils/imageVariants';
import { Badge, cn } from './ui/primitives';

const formatPrice = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

function ProductRowCard({ product, onProductClick, isViewOnly = false, prioritizeImage = false, imageLoadingMode = 'lazy' }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated, isFavorite, addToFavoritesLocal, removeFromFavoritesLocal } = useCustomerStore();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const hasVariants = product.variants && product.variants.length > 1;
  const isActive = product.IsActive !== false;
  const favorite = isFavorite(product.Id);
  const productImageUrl = getProductListImage(product);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isActive) return;
    const sourceElement = e.currentTarget.closest('[data-product-card]')?.querySelector('[data-add-to-cart-image="true"]');

    if (hasVariants) {
      onProductClick?.(product);
      return;
    }

    addItem(product);
    showSingleAddSuccess({
      product,
      quantity: 1,
      source: 'menu-card',
      sourceElement,
    });
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
      data-product-card="true"
      onClick={() => onProductClick?.(product)}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-[28px] border p-3.5 transition-all duration-300 sm:p-4',
        isActive
          ? 'border-white/70 bg-white shadow-card md:hover:-translate-y-1 md:hover:shadow-card-hover'
          : 'border-surface-border bg-surface-muted opacity-75',
      )}
    >
      <div className="grid grid-cols-[96px,minmax(0,1fr)] items-start gap-3.5 sm:grid-cols-[136px,minmax(0,1fr)] sm:gap-4">
        <div className="flex flex-col gap-2">
          <div data-add-to-cart-image="true" className="relative aspect-square overflow-hidden rounded-[22px] bg-surface-muted sm:rounded-[24px]">
            {productImageUrl ? (
              <img
                src={productImageUrl}
                alt={product.Name}
                className="gm-image-drift h-full w-full object-cover"
                decoding="async"
                loading={imageLoadingMode}
                fetchPriority={prioritizeImage ? 'high' : 'auto'}
              />
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

            {!isViewOnly && (
              <button
                onClick={handleFavoriteToggle}
                disabled={isFavoriteLoading}
                className={cn(
                  'absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-[18px] border transition-all duration-200 sm:h-11 sm:w-11 sm:rounded-2xl',
                  favorite ? 'border-primary/20 bg-primary text-white' : 'border-white/60 bg-white/88 text-dark hover:text-primary',
                )}
              >
                <Heart className="h-4 w-4" fill={favorite ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>

          {hasVariants && (
            <div className="flex justify-start">
              <Badge tone="primary" className="px-3 py-1.5 text-[11px]">
                {product.variants.length} secenek
              </Badge>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-3.5">
          <div className="gm-content-settle space-y-2.5">
            <h3 className="line-clamp-2 text-[15px] font-bold leading-5 text-dark sm:text-lg sm:leading-6">{product.Name}</h3>
            {product.Description && <p className="line-clamp-2 text-[12px] leading-5 text-dark-lighter sm:text-sm sm:leading-6">{product.Description}</p>}
          </div>

          <div className="rounded-[20px] bg-surface-muted/78 p-2.5 sm:rounded-none sm:bg-transparent sm:p-0">
            <div className="space-y-2.5 sm:flex sm:items-end sm:justify-between sm:gap-3 sm:space-y-0">
              <div className="gm-price-settle space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 leading-none">
                  <span className="text-[1.05rem] font-black text-primary-dark sm:text-2xl">{formatPrice(product.Price)} TL</span>
                {product.OldPrice && product.OldPrice > product.Price && (
                  <span className="text-sm text-dark-lighter line-through">{formatPrice(product.OldPrice)} TL</span>
                )}
                </div>
                {hasVariants && <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dark-lighter">Baslayan fiyat</p>}
              </div>

              {!isViewOnly && (
                <button
                  onClick={handleAddToCart}
                  disabled={!isActive}
                  className={cn(
                    'inline-flex min-h-[46px] w-full shrink-0 items-center justify-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold transition-all duration-200 sm:min-w-[132px] sm:w-auto sm:gap-2 sm:px-4 sm:py-3 sm:text-sm',
                    isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 md:hover:-translate-y-0.5' : 'bg-white text-dark-lighter',
                  )}
                >
                  {isActive ? (
                    hasVariants ? (
                      <>
                        Sec
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
                        Ekle
                      </>
                    )
                  ) : (
                    'Mevcut degil'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductRowCard);
