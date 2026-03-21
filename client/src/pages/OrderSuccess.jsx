import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import StatusScreen from '../components/StatusScreen';
import { SurfaceCard } from '../components/ui/primitives';

function OrderSuccess() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state?.orderData;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <StatusScreen
      icon={CheckCircle}
      tone="success"
      title="Siparis alindi"
      description="Siparisiniz basariyla olusturuldu ve en kisa surede isleme alinacak."
      details={
        <SurfaceCard tone="muted" className="mx-auto max-w-xl p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-lighter">Siparis numarasi</p>
          <p className="mt-2 text-3xl font-black text-primary-dark">{orderNumber}</p>
          {orderData?.orderCount > 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-dark">{orderData.orderCount} ayri siparis olusturuldu</p>
              <div className="space-y-1 text-sm text-dark-lighter">
                {orderData.orders.map((order, idx) => (
                  <p key={idx}>
                    {order.restaurantName}: <span className="font-mono text-dark">{order.orderNumber}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </SurfaceCard>
      }
      notes={<p>Siparis numaranizi saklayin. Siparisinizle ilgili destek taleplerinde bu numara kullanilacaktir.</p>}
      primaryAction={{
        label: 'Ana sayfaya don',
        icon: <Home className="h-4 w-4" />,
        onClick: () => navigate('/'),
      }}
      secondaryAction={{
        label: 'Siparislerim',
        icon: <ShoppingBag className="h-4 w-4" />,
        onClick: () => navigate('/my-orders'),
      }}
    />
  );
}

export default OrderSuccess;
