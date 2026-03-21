import { useState, useEffect } from 'react';
import { Sparkles, Utensils } from 'lucide-react';

function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Splash ekran animasyonu
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Animasyon bittikten sonra exit animasyonu
          setIsExiting(true);
          setTimeout(() => {
            onComplete();
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 25); // ~1.25 saniyede tamamlanır

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${isExiting ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
        }`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600">
        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl animate-float" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8">
        {/* Logo Container */}
        <div className="relative mb-10">
          {/* Outer glow ring */}
          <div className="absolute inset-0 bg-white/20 rounded-[40px] blur-2xl scale-150 animate-pulse" />

          {/* Logo box */}
          <div className="relative w-36 h-36 bg-white rounded-[32px] shadow-2xl flex items-center justify-center transform transition-all duration-700 hover:scale-105">
            {/* Inner gradient */}
            <div className="absolute inset-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-[24px]" />

            {/* Icon */}
            <Utensils className="relative w-16 h-16 text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-pink-600" style={{ stroke: 'url(#iconGradient)' }} />
            <svg width="0" height="0">
              <defs>
                <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9333ea" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Sparkle effects */}
          <div className="absolute -top-3 -right-3 animate-bounce" style={{ animationDelay: '0s' }}>
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/40 rotate-12">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.3s' }}>
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-400/40 -rotate-12">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight text-center drop-shadow-lg">
          Global Menu
        </h1>
        <p className="text-white/80 text-base sm:text-lg mb-10 text-center max-w-xs">
          Lezzetli yemekler, hızlı teslimat
        </p>

        {/* Progress Bar */}
        <div className="w-72 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-white via-white to-white/80 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Loading text */}
        <div className="mt-6 flex items-center gap-2">
          <span className="text-white/60 text-sm font-medium">Yükleniyor</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Version info */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/40 text-xs font-medium">v2.0.0</p>
      </div>
    </div>
  );
}

export default SplashScreen;
