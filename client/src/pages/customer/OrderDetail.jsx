import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, FileText, Loader2, MapPin, Phone, ShoppingCart, User } from 'lucide-react';
import CustomerShell from '../../components/customer/CustomerShell';
import Loading from '../../components/Loading';
import { getProductById } from '../../services/api';
import { getMyOrderDetail } from '../../services/customerApi';
import useCartStore from '../../store/cartStore';
import { showBulkAddSuccess } from '../../utils/addToCartFeedback';
import { Badge, Button, SurfaceCard } from '../../components/ui/primitives';

function OrderDetail() {
  const { orderNumber } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [feedback, setFeedback] = useState({ tone: '', message: '' });

  useEffect(() => {
    loadOrderDetail();
  }, [orderNumber]);

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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusInfo = (status) => {
    const statuses = {
      Pending: { label: 'Beklemede', badgeClass: 'bg-amber-100 text-amber-800', description: 'Siparisiniz alindi, onay bekleniyor.' },
      Confirmed: { label: 'Onaylandi', badgeClass: 'bg-blue-100 text-blue-800', description: 'Siparisiniz onaylandi.' },
      Preparing: { label: 'Hazirlaniyor', badgeClass: 'bg-primary/10 text-primary-dark', description: 'Siparisiniz hazirlaniyor.' },
      Delivered: { label: 'Teslim edildi', badgeClass: 'bg-green-100 text-green-800', description: 'Siparisiniz teslim edildi.' },
      Cancelled: { label: 'Iptal', badgeClass: 'bg-red-100 text-red-700', description: 'Siparis iptal edildi.' },
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

      showBulkAddSuccess({
        addedCount: count,
        source: 'reorder',
      });
      setFeedback({ tone: '', message: '' });
    } catch (error) {
      console.error('Tekrar siparis hatasi:', error);
      setFeedback({ tone: 'error', message: 'Urunler sepete eklenirken bir hata olustu' });
    } finally {
      setReorderLoading(false);
    }
  };

  if (loading) {
    return (
      <CustomerShell title="Siparis detayi" description="Siparis detaylari.">
        <SurfaceCard tone="muted" className="p-6">
          <Loading message="Siparis detaylari yukleniyor..." />
        </SurfaceCard>
      </CustomerShell>
    );
  }

  if (!order) {
    return (
      <CustomerShell title="Siparis detayi" description="Siparis detaylari.">
        <SurfaceCard tone="muted" className="p-8 text-center">
          <p className="text-sm text-dark-lighter">Siparis bulunamadi.</p>
        </SurfaceCard>
      </CustomerShell>
    );
  }

  const statusInfo = getStatusInfo(order.Status);

  return (
    <CustomerShell title={`Siparis ${order.OrderNumber}`} description="Siparis detaylari.">
        <SurfaceCard className="p-4 sm:p-5">
          {feedback.message && (
            <div className={`mb-4 rounded-[22px] px-4 py-3 text-sm font-medium ${feedback.tone === 'error' ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {feedback.message}
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusInfo.badgeClass}>{statusInfo.label}</Badge>
                <span className="text-sm text-dark-lighter">{formatDate(order.CreatedAt)}</span>
              </div>
              <p className="mt-2 text-lg font-bold text-dark">{statusInfo.description}</p>
            </div>

            <Button onClick={handleReorder} disabled={reorderLoading} className="w-full sm:w-auto">
              {reorderLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ekleniyor...
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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)]">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Teslimat</p>
              <h2 className="mt-1 text-xl font-bold text-dark">Musteri bilgileri</h2>
            </div>
            <div className="grid gap-3">
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
                <h2 className="mt-1 text-xl font-bold text-dark">{items.length} urun</h2>
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
                      <p className="text-sm font-bold text-dark sm:text-base">
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

            <div className="mt-4 flex items-center justify-between rounded-[22px] bg-surface-muted px-4 py-4">
              <span className="text-base font-bold text-dark">Toplam</span>
              <span className="text-2xl font-black text-primary-dark">{formatCurrency(order.TotalAmount)}</span>
            </div>
          </SurfaceCard>
        </div>
      </CustomerShell>
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
