import { Loader2, UtensilsCrossed } from 'lucide-react';

function Loading({ message = 'Yükleniyor...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 flex flex-col items-center p-8">
        {/* Animated logo container */}
        <div className="relative mb-8">
          {/* Outer glow ring */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-30 animate-pulse scale-150" />

          {/* Spinning ring */}
          <div className="relative w-20 h-20">
            <svg className="w-full h-full animate-spin" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradientStroke)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="200"
                strokeDashoffset="150"
              />
              <defs>
                <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">{message}</h3>
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loading;
