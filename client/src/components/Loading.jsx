import { Loader2, UtensilsCrossed } from 'lucide-react';

function Loading({ message = 'Yukleniyor...' }) {
  return (
    <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[32px] bg-transparent px-6 py-12">
      <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top_left,rgba(140,71,124,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(209,107,83,0.16),transparent_26%)]" />
      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/18 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/70 bg-white shadow-premium">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="gm-display text-3xl">Birazdan hazir</h3>
          <p className="text-sm font-medium text-dark-lighter sm:text-base">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default Loading;
