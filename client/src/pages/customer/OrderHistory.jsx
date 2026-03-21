import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Package, Wallet } from 'lucide-react';
import CustomerShell from '../../components/customer/CustomerShell';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import { getMyOrders } from '../../services/customerApi';
import { Button, SurfaceCard } from '../../components/ui/primitives';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [pagination.page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getMyOrders(pagination.page, pagination.limit);
      if (response.success) {
        setOrders(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Siparisler yuklenemedi:', err);
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
    new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusBadgeClass = (status) => {
    const classes = {
      Pending: 'bg-amber-100 text-amber-800',
      Confirmed: 'bg-blue-100 text-blue-800',
      Preparing: 'bg-primary/10 text-primary-dark',
      Delivered: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-700',
    };
    return classes[status] || classes.Pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      Pending: 'Beklemede',
      Confirmed: 'Onaylandi',
      Preparing: 'Hazirlaniyor',
      Delivered: 'Teslim edildi',
      Cancelled: 'Iptal',
    };
    return labels[status] || 'Beklemede';
  };

  return (
    <CustomerShell
      title="Siparis gecmisi"
      description="Tum siparislerin burada toplanir. Mobilde kart akisi, desktopta daha ferah liste kullanilir."
    >
      {loading && orders.length === 0 ? (
        <SurfaceCard tone="muted" className="p-6">
          <Loading message="Siparisler yukleniyor..." />
        </SurfaceCard>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Henuz siparisiniz yok"
          message="Ilk siparisinizi vererek baslayin."
          actionText="Menuye git"
          actionPath="/"
        />
      ) : (
        <>
          <div className="grid gap-4">
            {orders.map((order) => (
              <Link
                key={order.Id}
                to={`/my-orders/${order.OrderNumber}`}
                className="group rounded-[28px] border border-white/70 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
                      <Package className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-dark">{order.OrderNumber}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(order.Status)}`}>
                          {getStatusLabel(order.Status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-dark-lighter">{order.CustomerName}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-dark-lighter">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.CreatedAt)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          {formatCurrency(order.TotalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-dark-lighter transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <SurfaceCard tone="muted" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-dark-lighter">
                Toplam {pagination.total} siparis ({pagination.page} / {pagination.totalPages})
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  Onceki
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </SurfaceCard>
          )}
        </>
      )}
    </CustomerShell>
  );
}

export default OrderHistory;
