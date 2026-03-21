import { useEffect, useState } from 'react';
import { Clock3, Sparkles, UtensilsCrossed } from 'lucide-react';

function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExiting(true);
          setTimeout(() => {
            onComplete();
          }, 420);
          return 100;
        }

        return prev + 2;
      });
    }, 22);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-500 ${
        isExiting ? 'scale-[1.03] opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#2d1b28_0%,#6d365f_35%,#d16b53_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,244,236,0.18),transparent_30%)]" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-8 right-[-4rem] h-80 w-80 rounded-full bg-[#f1c5b4]/20 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between px-6 py-10 sm:px-10 sm:py-12">
        <div className="flex items-center justify-between text-white/72">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Globalmenu
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur-md sm:inline-flex">
            <Clock3 className="h-4 w-4" />
            Hizli hazirlaniyor
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr),320px]">
            <div className="space-y-6 text-white">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/15 bg-white/12 shadow-[0_30px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:h-28 sm:w-28">
                <UtensilsCrossed className="h-11 w-11 sm:h-12 sm:w-12" />
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/62">Mobile first ordering</p>
                <h1 className="font-display text-[clamp(3rem,12vw,6rem)] leading-[0.9]">
                  Globalmenu
                </h1>
                <p className="max-w-xl text-sm leading-7 text-white/78 sm:text-base">
                  Restoran, menu ve siparis akisini premium ama hizli bir yuzeyde topluyoruz.
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/12 bg-white/10 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="space-y-5 text-white">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/62">Hazirlanan deneyim</p>
                  <div className="mt-3 grid gap-3">
                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                      <p className="text-sm font-semibold">Siparis akisi</p>
                      <p className="mt-1 text-sm text-white/68">Sepet, checkout ve durum ekranlari yukleniyor.</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                      <p className="text-sm font-semibold">Responsive shell</p>
                      <p className="mt-1 text-sm text-white/68">Telefon icin rahat, desktop icin ferah duzen kuruluyor.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/68">Yukleme</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/14">
                    <div
                      className="relative h-full rounded-full bg-[linear-gradient(90deg,#fff3ea_0%,#ffffff_35%,#f6d6c7_100%)] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)] animate-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs font-medium tracking-[0.18em] text-white/42">
          Warming up your menu surface
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
