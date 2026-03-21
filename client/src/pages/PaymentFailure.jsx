import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Home, RotateCw as RefreshCw, XCircle } from 'lucide-react';
import StatusScreen from '../components/StatusScreen';
import { SurfaceCard } from '../components/ui/primitives';

function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorParam = searchParams.get('error');
  const orderId = searchParams.get('orderId');
  const error = errorParam ? decodeURIComponent(errorParam) : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [error, orderId]);

  const handleRetry = () => {
    if (orderId) {
      navigate('/checkout', { state: { retry: true, orderId } });
    } else {
      navigate('/cart');
    }
  };

  return (
    <StatusScreen
      icon={XCircle}
      tone="error"
      title="Odeme basarisiz"
      description="Odeme islemi tamamlanamadi. Kartinizdan herhangi bir tutar cekilmemistir."
      details={
        <SurfaceCard tone="muted" className="mx-auto max-w-xl p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-lighter">Hata mesaji</p>
          <p className="mt-2 text-base font-semibold text-dark">{error || 'Odeme islemi sirasinda bir hata olustu.'}</p>
        </SurfaceCard>
      }
      notes={
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 font-semibold">
            <CreditCard className="h-4 w-4" />
            Olası nedenler
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Kart bilgileri hatali olabilir.</li>
            <li>Kart limiti yetersiz olabilir.</li>
            <li>Banka ek dogrulama istemis olabilir.</li>
            <li>Baglantiniz kesintiye ugramis olabilir.</li>
          </ul>
        </div>
      }
      primaryAction={{
        label: 'Tekrar dene',
        icon: <RefreshCw className="h-4 w-4" />,
        onClick: handleRetry,
      }}
      secondaryAction={{
        label: 'Ana sayfaya don',
        icon: <Home className="h-4 w-4" />,
        onClick: () => navigate('/'),
      }}
    />
  );
}

export default PaymentFailure;
