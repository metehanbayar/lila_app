import { memo, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

const FeaturedTicker = ({ products, onProductClick }) => {
    const scrollRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);

    if (!products || products.length === 0) return null;

    // Kesintisiz döngü için ürünleri çoğaltalım
    const displayProducts = [...products, ...products, ...products, ...products];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
        }).format(amount);
    };

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        let animationFrameId;
        let lastTimestamp = 0;
        const speed = 0.5; // Saniyedeki piksel hızı yerine yaklaşık hız sabiti

        const animate = (timestamp) => {
            if (!isPaused) {
                if (lastTimestamp !== 0) {
                    container.scrollLeft += speed;

                    // Döngü mantığı: İlk setin sonuna gelince başa sar
                    const maxScroll = container.scrollWidth / 2;
                    if (container.scrollLeft >= maxScroll) {
                        container.scrollLeft = 1; // 0'a çekince zıplama olmasın diye 1
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
        <div className="relative w-full bg-white border-b border-gray-100 mb-6 py-2.5">
            <div
                ref={scrollRef}
                className="flex overflow-x-auto scrollbar-hide whitespace-nowrap px-4 gap-2 cursor-grab active:cursor-grabbing"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                {displayProducts.map((product, idx) => (
                    <div
                        key={`${product.Id}-${idx}`}
                        onClick={() => onProductClick?.(product)}
                        className="inline-flex items-center gap-2 px-4 py-1.5 cursor-pointer group hover:bg-gray-50 transition-colors border border-gray-100 rounded-full flex-shrink-0 bg-gray-50/30"
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-purple-100 shadow-sm">
                            {product.ImageUrl ? (
                                <img src={product.ImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-purple-50">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-900 group-hover:text-purple-600 transition-colors leading-tight">
                                {product.Name}
                            </span>
                            <div className="flex items-center gap-1.5 leading-none mt-0.5">
                                <span className="text-[10px] font-black text-purple-600">
                                    {formatCurrency(product.Price)}
                                </span>
                                {product.OldPrice && (
                                    <span className="text-[9px] text-gray-400 line-through">
                                        {formatCurrency(product.OldPrice)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {product.OldPrice && (
                            <div className="bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                %{Math.round(((product.OldPrice - product.Price) / product.OldPrice) * 100)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
        </div>
    );
};

export default memo(FeaturedTicker);
