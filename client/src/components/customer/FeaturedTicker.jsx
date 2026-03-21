import { memo, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

const FeaturedTicker = ({ products, onProductClick }) => {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  if (!products?.length) return null;

  const displayProducts = [...products, ...products, ...products];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return undefined;

    let animationFrameId;
    let lastTimestamp = 0;
    const speed = 0.42;

    const animate = (timestamp) => {
      if (!isPaused) {
        if (lastTimestamp !== 0) {
          container.scrollLeft += speed;
          const maxScroll = container.scrollWidth / 2;
          if (container.scrollLeft >= maxScroll) {
            container.scrollLeft = 1;
          }
        }
        lastTimestamp = timestamp;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, products.length]);

  return (
    <div className="gm-page-shell mb-8">
      <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/82 px-3 py-3 shadow-card backdrop-blur-xl sm:px-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Secilenler</p>
            <p className="text-sm font-semibold text-dark">One cikan urunler</p>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-2 overflow-x-auto whitespace-nowrap pb-1"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {displayProducts.map((product, idx) => (
            <button
              key={`${product.Id}-${idx}`}
              onClick={() => onProductClick?.(product)}
              className="inline-flex shrink-0 items-center gap-3 rounded-full border border-surface-border bg-surface-muted px-3 py-2 text-left transition-all duration-200 hover:border-primary/20 hover:bg-white"
            >
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white shadow-sm">
                {product.ImageUrl ? (
                  <img src={product.ImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
              </div>

              <div className="min-w-0">
                <p className="max-w-[180px] truncate text-sm font-bold text-dark">{product.Name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="font-black text-primary-dark">{formatCurrency(product.Price)}</span>
                  {product.OldPrice && <span className="text-dark-lighter line-through">{formatCurrency(product.OldPrice)}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(FeaturedTicker);
