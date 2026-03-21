import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Check, FileText, Loader2, MapPin, Phone, ShoppingCart, User } from 'lucide-react';
import CustomerShell from '../../components/customer/CustomerShell';
import Loading from '../../components/Loading';
import { getProductById } from '../../services/api';
import { getMyOrderDetail } from '../../services/customerApi';
import useCartStore from '../../store/cartStore';
import { safeSetTimeout } from '../../utils/performance';
import { Badge, Button, SurfaceCard } from '../../components/ui/primitives';

function OrderDetail() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  useEffect(() => {
    loadOrderDetail();
  }, [orderNumber]);

  useEffect(() => {
    if (!showToast) return undefined;
    const timer = safeSetTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await getMyOrderDetail(orderNumber);
      if (response.success) {
        setOrder(response.data.order);
        setItems(response.data.items);
      }
    } catch (err) {
      console.error('Siparis detayi yuklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusInfo = (status) => {
    const statuses = {
      Pending: {
        label: 'Beklemede',
        cardClass: 'bg-amber-50 border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800',
        textClass: 'text-amber-800',
        description: 'Siparisiniz alindi, onay bekleniyor.',
      },
      Confirmed: {
        label: 'Onaylandi',
        cardClass: 'bg-blue-50 border-blue-200',
        badgeClass: 'bg-blue-100 text-blue-800',
        textClass: 'text-blue-800',
        description: 'Siparisiniz onaylandi.',
      },
      Preparing: {
        label: 'Hazirlaniyor',
        cardClass: 'bg-primary/10 border-primary/20',
        badgeClass: 'bg-primary/15 text-primary-dark',
        textClass: 'text-primary-dark',
        description: 'Siparisiniz hazirlaniyor.',
      },
      Delivered: {
        label: 'Teslim edildi',
        cardClass: 'bg-green-50 border-green-200',
        badgeClass: 'bg-green-100 text-green-800',
        textClass: 'text-green-800',
        description: 'Siparisiniz teslim edildi.',
      },
      Cancelled: {
        label: 'Iptal',
        cardClass: 'bg-red-50 border-red-200',
        badgeClass: 'bg-red-100 text-red-700',
        textClass: 'text-red-700',
        description: 'Siparis iptal edildi.',
      },
    };
    return statuses[status] || statuses.Pending;
  };

  const handleReorder = async () => {
    setReorderLoading(true);
    let count = 0;

    try {
      for (const item of items) {
        const productResponse = await getProductById(item.ProductId);

        if (productResponse.success) {
          const product = productResponse.data;
          let selectedVariant = null;
          if (item.VariantId && product.variants?.length) {
            selectedVariant = product.variants.find((variant) => variant.Id === item.VariantId);
          }
          addItem(product, selectedVariant, item.Quantity);
          count += item.Quantity;
        }
      }

      setAddedCount(count);
      setShowToast(true);
    } catch (error) {
      console.error('Tekrar siparis hatasi:', error);
      alert('Urunler sepete eklenirken bir hata olustu');
    } finally {
      setReorderLoading(false);
    }
  };

  if (loading) {
    return (
      <CustomerShell title="Siparis detayi" description="Siparis kalemleri ve teslimat bilgileri yukleniyor.">
        <SurfaceCard tone="muted" className="p-6">
          <Loading message="Siparis detaylari yukleniyor..." />
        </SurfaceCard>
      </CustomerShell>
    );
  }

  if (!order) {
    return (
      <CustomerShell title="Siparis detayi" description="Bu siparis bulunamadi.">
        <SurfaceCard tone="muted" className="p-8 text-center">
          <p className="text-sm text-dark-lighter">Siparis bulunamadi.</p>
        </SurfaceCard>
      </CustomerShell>
    );
  }

  const statusInfo = getStatusInfo(order.Status);

  return (
    <>
      {showToast && (
        <div className="fixed right-4 top-4 z-50 max-w-sm animate-slideInRight rounded-[28px] border border-white/70 bg-white/92 p-4 shadow-premium backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20">
              <Check className="h-5 w-5" strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-dark">Sepete eklendi</h4>
              <p className="mt-1 text-xs text-dark-lighter">{addedCount} urun sepete eklendi</p>
              <button
                onClick={() => {
                  setShowToast(false);
                  safeSetTimeout(() => navigate('/cart'), 200);
                }}
                className="mt-3 text-xs font-bold text-primary"
              >
                Sepete git
              </button>
            </div>
            <button onClick={() => setShowToast(false)} className="rounded-xl p-2 text-dark-lighter hover:bg-surface-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <CustomerShell title={`Siparis ${order.OrderNumber}`} description="Siparis ozeti, teslimat ve urun kalemleri ayni ekranda.">
        <SurfaceCard className={`border p-5 sm:p-6 ${statusInfo.cardClass}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusInfo.badgeClass}>{statusInfo.label}</Badge>
                <span className="text-sm font-semibold text-dark-lighter">{formatDate(order.CreatedAt)}</span>
              </div>
              <h2 className={`mt-3 text-2xl font-bold ${statusInfo.textClass}`}>{statusInfo.description}</h2>
            </div>
            <Button onClick={handleReorder} disabled={reorderLoading}>
              {reorderLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sepete ekleniyor...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Tekrar siparis et
                </>
              )}
            </Button>
          </div>
        </SurfaceCard>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)]">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Teslimat</p>
              <h3 className="text-2xl font-bold text-dark">Musteri bilgileri</h3>
            </div>
            <div className="grid gap-4">
              <InfoRow icon={User} label="Ad soyad" value={order.CustomerName} />
              <InfoRow icon={Phone} label="Telefon" value={order.CustomerPhone} />
              <InfoRow icon={MapPin} label="Adres" value={order.CustomerAddress} />
              {order.Notes && <InfoRow icon={FileText} label="Notlar" value={order.Notes} />}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Siparis kalemleri</p>
                <h3 className="text-2xl font-bold text-dark">{items.length} urun</h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-2 text-sm font-semibold text-dark-lighter">
                <Calendar className="h-4 w-4" />
                {formatDate(order.CreatedAt)}
              </span>
            </div>

            <div className="grid gap-3">
              {items.map((item) => (
                <div key={item.Id} className="rounded-[22px] border border-surface-border bg-surface-muted px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-dark">
                        {item.ProductName}
                        {item.VariantName && <span className="font-medium text-dark-lighter"> ({item.VariantName})</span>}
                      </p>
                      <p className="mt-2 text-sm text-dark-lighter">
                        {formatCurrency(item.ProductPrice)} x {item.Quantity}
                      </p>
                    </div>
                    <p className="text-lg font-black text-primary-dark">{formatCurrency(item.Subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[24px] border border-surface-border bg-white px-4 py-4">
              <span className="text-base font-bold text-dark">Toplam</span>
              <span className="text-2xl font-black text-primary-dark">{formatCurrency(order.TotalAmount)}</span>
            </div>
          </SurfaceCard>
        </div>
      </CustomerShell>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-surface-border bg-surface-muted px-4 py-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white text-primary shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dark-lighter">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-dark">{value}</p>
      </div>
    </div>
  );
}

export default OrderDetail;
