import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button, SurfaceCard } from './ui/primitives';

function EmptyState({ icon: Icon = ShoppingBag, title, message, actionText, actionPath }) {
  const navigate = useNavigate();

  return (
    <SurfaceCard tone="muted" className="mx-auto flex min-h-[320px] max-w-3xl flex-col items-center justify-center px-6 py-12 text-center sm:px-10">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-card">
        <Icon className="h-10 w-10 text-primary" />
      </div>
      <h2 className="gm-display text-3xl sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-dark-lighter sm:text-base">{message}</p>
      {actionText && actionPath && (
        <Button className="mt-6" onClick={() => navigate(actionPath)}>
          {actionText}
        </Button>
      )}
    </SurfaceCard>
  );
}

export default EmptyState;
