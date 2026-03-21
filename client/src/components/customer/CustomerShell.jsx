import { Heart, ShoppingBag, User2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { PageShell, SurfaceCard, cn } from '../ui/primitives';

const items = [
  { to: '/profile', label: 'Profil', icon: User2 },
  { to: '/my-orders', label: 'Siparisler', icon: ShoppingBag },
  { to: '/favorites', label: 'Favoriler', icon: Heart },
];

function CustomerShell({ title, description, actions, children }) {
  const location = useLocation();

  return (
    <PageShell width="full" className="py-6 sm:py-8 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)] lg:items-start">
        <SurfaceCard className="overflow-hidden p-4 sm:p-5 lg:sticky lg:top-24">
          <div className="mb-5 space-y-2">
            <span className="gm-eyebrow">Hesabim</span>
            <div>
              <h1 className="gm-display text-3xl sm:text-4xl">Hizli erisim</h1>
              <p className="mt-2 text-sm leading-6 text-dark-lighter">
                Hesap, siparis ve favori ekranlari tek bir mobil oncelikli shell icinde duzenlendi.
              </p>
            </div>
          </div>

          <nav className="grid gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200',
                    active
                      ? 'border-primary/25 bg-primary text-white shadow-lg shadow-primary/20'
                      : 'border-surface-border bg-surface-muted text-dark hover:border-primary/20 hover:bg-white',
                  )}
                >
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', active ? 'bg-white/14' : 'bg-white')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SurfaceCard>

        <div className="space-y-4 sm:space-y-5">
          {(title || description || actions) && (
            <SurfaceCard tone="muted" className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  {title && <h2 className="gm-display text-3xl sm:text-4xl">{title}</h2>}
                  {description && <p className="max-w-2xl text-sm leading-6 text-dark-lighter sm:text-base">{description}</p>}
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
              </div>
            </SurfaceCard>
          )}

          {children}
        </div>
      </div>
    </PageShell>
  );
}

export default CustomerShell;
