import { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Splash ekran animasyonu
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnimating(false);
          // Animasyon bittikten sonra kısa bir bekleme
          setTimeout(() => {
            onComplete();
          }, 300);
          return 100;
        }
        return prev + 1;
      });
    }, 20); // ~2 saniyede tamamlanır

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Logo Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center transform transition-all duration-700 hover:scale-110">
            <ShoppingBag className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
          
          {/* Sparkle effects */}
          <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDelay: '0s' }}>
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.3s' }}>
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div className="absolute top-1/2 -left-4 animate-bounce" style={{ animationDelay: '0.6s' }}>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
          Global Menu
        </h1>
        <p className="text-white/80 text-sm mb-8">
          Hızlı teslimat, lezzetli yemekler
        </p>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex gap-1 mt-4">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>

      {/* Version info */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-xs">
        v1.0.0
      </div>
    </div>
  );
}

export default SplashScreen;

