import { useState } from 'react';
import { Clock3, Star } from 'lucide-react';
import { Badge } from './ui/primitives';

function resolveRating(restaurant) {
  const rawRating = restaurant?.Rating ?? restaurant?.rating ?? restaurant?.AverageRating ?? restaurant?.averageRating;
  const numericRating = Number(rawRating);

  if (!Number.isFinite(numericRating) || numericRating <= 0) {
    return null;
  }

  return numericRating.toFixed(1);
}

function StoreCard({ restaurant, onClick, className = '' }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const rating = resolveRating(restaurant);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full overflow-hidden rounded-[28px] border border-white/70 bg-white text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${className}`.trim()}
    >
      <div className="relative h-40 overflow-hidden sm:h-44">
        {restaurant.ImageUrl ? (
          <>
            {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#f2e6ef,#f2ede8)]" />}
            <img
              src={restaurant.ImageUrl}
              alt={restaurant.Name}
              className={`gm-image-drift h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#8c477c,#d16b53)]">
            <span className="font-display text-6xl text-white/45">{restaurant.Name?.charAt(0) || 'M'}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge tone={restaurant.IsActive ? 'success' : 'danger'}>{restaurant.IsActive ? 'Acik' : 'Kapali'}</Badge>
          {restaurant.IsFeatured && <Badge tone="warning">One cikan</Badge>}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="gm-content-settle min-w-0">
            <h3 className="truncate text-lg font-bold text-dark">{restaurant.Name}</h3>
            {restaurant.Description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-dark-lighter">{restaurant.Description}</p>}
          </div>
          {rating && (
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              <Star className="h-3.5 w-3.5 fill-current" />
              {rating}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-dark-lighter">
          {restaurant.DeliveryTime && (
            <span className="gm-price-settle inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-2">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              {restaurant.DeliveryTime}
            </span>
          )}
          {restaurant.MinOrder && <span className="gm-price-settle rounded-full bg-surface-muted px-3 py-2">Min. {restaurant.MinOrder} TL</span>}
        </div>
      </div>
    </button>
  );
}

export default StoreCard;
