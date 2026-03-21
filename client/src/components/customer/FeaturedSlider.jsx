import { useState, useEffect, memo } from 'react';
import { ChevronLeft, ChevronRight, Star, Plus } from 'lucide-react';

const FeaturedSlider = ({ products, onProductClick, onAddToCart }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (products.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [products.length]);

    if (!products || products.length === 0) return null;

    const next = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % products.length);
    };

    const prev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    };

    const product = products[currentIndex];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
        }).format(amount);
    };

    return (
        <div className="px-4 mb-4">
            <div
                className="relative group bg-white rounded-2xl overflow-hidden shadow-xl shadow-purple-200/30 cursor-pointer"
                onClick={() => onProductClick?.(product)}
            >
                <div className="flex flex-col md:flex-row h-full">
                    {/* Image Section */}
                    <div className="relative w-full md:w-2/5 h-40 md:h-48">
                        {product.ImageUrl ? (
                            <img
                                src={product.ImageUrl}
                                alt={product.Name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white text-4xl font-black">{product.Name?.charAt(0)}</span>
                            </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                            <div className="px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg">
                                <span className="text-purple-600 text-[10px] font-bold uppercase tracking-wider">🌟 Günün Özel Ürünü</span>
                            </div>
                        </div>

                        {/* Restaurant Info Pin */}
                        <div className="absolute bottom-3 left-3">
                            <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/20">
                                <p className="text-white text-[10px] font-medium">📍 {product.RestaurantName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-4 md:p-5 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Editörün Seçimi</span>
                        </div>

                        <h2 className="text-lg md:text-xl font-black text-gray-900 mb-1 leading-tight line-clamp-1">
                            {product.Name}
                        </h2>

                        <p className="text-gray-500 text-xs mb-4 line-clamp-1">
                            {product.Description || 'Bu lezzeti mutlaka deneyin, pişman olmayacaksınız!'}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-purple-600">
                                        {formatCurrency(product.Price)}
                                    </span>
                                    {product.OldPrice && (
                                        <span className="text-xs font-medium text-gray-400 line-through">
                                            {formatCurrency(product.OldPrice)}
                                        </span>
                                    )}
                                </div>
                                {product.OldPrice && (
                                    <span className="text-[9px] font-bold text-green-500 uppercase">
                                        %{Math.round(((product.OldPrice - product.Price) / product.OldPrice) * 100)} İndirim
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
                                className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-110 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Arrows */}
                {products.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}

                {/* Progress Bar */}
                {products.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
                        <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(FeaturedSlider);
