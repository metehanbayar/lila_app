import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import StatusScreen from '../components/StatusScreen';
import { Badge, SurfaceCard } from '../components/ui/primitives';
import { getPaymentStatus } from '../services/api';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('transactionId');
  const orderId = searchParams.get('orderId');
  const isOffline = searchParams.get('offline') === '1';
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isOffline) {
      setLoading(false);
      return;
    }

    if (transactionId) {
      getPaymentStatus(transactionId)
        .then((response) => {
          if (response.success) setPaymentData(response.data);
        })
        .catch((error) => {
          console.error('Odeme durumu sorgulanamadi:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [transactionId, isOffline]);

  return (
    <StatusScreen
      icon={CheckCircle}
      tone="success"
      title={isOffline ? 'Siparis onaylandi' : 'Odeme basarili'}
      description={
        isOffline
          ? 'Siparisiniz onaylandi. Kapi da odeme secenegiyle devam edebilirsiniz.'
          : 'Odemeniz basariyla alindi. Siparisiniz isleme alindi.'
      }
      details={
        <SurfaceCard tone="muted" className="mx-auto max-w-xl p-5 text-left">
          {loading ? (
            <p className="text-sm text-dark-lighter">Islem bilgileri yukleniyor...</p>
          ) : isOffline ? (
            <div className="space-y-3">
              {orderId && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-lighter">Siparis numarasi</p>
                  <p className="mt-1 text-2xl font-black text-primary-dark">#{orderId}</p>
                </div>
              )}
              <Badge tone="success">Kapida odeme</Badge>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-lighter">Islem numarasi</p>
                <p className="mt-1 text-2xl font-black text-primary-dark">{paymentData?.paymentTransactionId || transactionId || '-'}</p>
              </div>
              {(paymentData?.orderNumber || orderId) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-lighter">Siparis numarasi</p>
                  <p className="mt-1 text-xl font-bold text-dark">{paymentData?.orderNumber || orderId}</p>
                </div>
              )}
            </div>
          )}
        </SurfaceCard>
      }
      notes={
        <p>
          Siparisinizle ilgili bir sorun yasarsaniz siparis numaranizi kullanarak destek ekibine ulasabilirsiniz.
        </p>
      }
      primaryAction={{
        label: 'Ana sayfaya don',
        icon: <Home className="h-4 w-4" />,
        onClick: () => navigate('/'),
      }}
      secondaryAction={
        orderId
          ? {
              label: 'Siparislerim',
              icon: <ShoppingBag className="h-4 w-4" />,
              onClick: () => navigate('/my-orders'),
            }
          : null
      }
    />
  );
}

export default PaymentSuccess;
