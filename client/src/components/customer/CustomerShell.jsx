import { Heart, ShoppingBag, User2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { PageShell, cn } from '../ui/primitives';

const items = [
  { to: '/profile', label: 'Profil', icon: User2 },
  { to: '/my-orders', label: 'Siparisler', icon: ShoppingBag },
  { to: '/favorites', label: 'Favoriler', icon: Heart },
];

function CustomerShell({ title, description, actions, children }) {
  const location = useLocation();

  return (
    <PageShell width="full" className="py-4 sm:py-6 lg:py-8">
      <div className="grid gap-4 lg:grid-cols-[220px,minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-2 lg:overflow-visible lg:pb-0">
            {items.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex shrink-0 items-center gap-3 rounded-[20px] border px-4 py-3 text-sm font-semibold transition-all duration-200 lg:w-full',
                    active
                      ? 'border-primary/25 bg-primary text-white shadow-lg shadow-primary/20'
                      : 'border-surface-border bg-white text-dark hover:border-primary/20',
                  )}
                >
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-2xl', active ? 'bg-white/14' : 'bg-surface-muted')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {(title || description || actions) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                {title && <h1 className="text-2xl font-black tracking-tight text-dark sm:text-3xl">{title}</h1>}
                {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-lighter">{description}</p>}
              </div>
              {actions && <div className="shrink-0">{actions}</div>}
            </div>
          )}

          {children}
        </div>
      </div>
    </PageShell>
  );
}

export default CustomerShell;
