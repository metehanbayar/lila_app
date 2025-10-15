import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Calendar, DollarSign } from 'lucide-react';
import { getMyOrders } from '../../services/customerApi';
import AppLayout from '../../components/AppLayout';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

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
      console.error('Siparişler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: { label: 'Beklemede', class: 'bg-yellow-100 text-yellow-800' },
      Confirmed: { label: 'Onaylandı', class: 'bg-blue-100 text-blue-800' },
      Preparing: { label: 'Hazırlanıyor', class: 'bg-purple-100 text-purple-800' },
      Delivered: { label: 'Teslim Edildi', class: 'bg-green-100 text-green-800' },
      Cancelled: { label: 'İptal', class: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] || badges.Pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Sipariş Geçmişim</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Tüm siparişlerinizi görüntüleyin ve takip edin
            </p>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Henüz siparişiniz yok"
              message="İlk siparişinizi vererek başlayın!"
              actionText="Menüye Göz At"
              actionLink="/"
            />
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4">
                {orders.map((order) => (
                  <Link
                    key={order.Id}
                    to={`/my-orders/${order.OrderNumber}`}
                    className="block bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-4 sm:p-5"
                  >
                    {/* Mobile Layout */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="text-primary" size={24} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-primary truncate">
                              {order.OrderNumber}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                              {order.CustomerName}
                            </p>
                          </div>
                          <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Calendar size={14} className="flex-shrink-0" />
                            <span className="truncate">{formatDate(order.CreatedAt)}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-900">
                              <DollarSign size={14} className="flex-shrink-0" />
                              <span>{formatCurrency(order.TotalAmount)}</span>
                            </div>
                            {getStatusBadge(order.Status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Toplam {pagination.total} sipariş ({pagination.page} / {pagination.totalPages})
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Back to Profile */}
          <div className="text-center pt-4">
            <Link
              to="/profile"
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              ← Profilime Dön
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default OrderHistory;

