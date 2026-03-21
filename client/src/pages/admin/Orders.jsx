import { useEffect, useState } from 'react';
import { Eye, Filter } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import Loading from '../../components/Loading';
import {
  getAdminOrder,
  getAdminOrders,
  updateOrderStatus,
} from '../../services/adminApi';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [filterStatus, pagination.page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filterStatus) {
        params.status = filterStatus;
      }

      const response = await getAdminOrders(params);
      if (response.success) {
        setOrders(response.data || []);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Siparisler yuklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (order) => {
    try {
      const response = await getAdminOrder(order.Id);
      if (response.success) {
        setSelectedOrder(response.data.order);
        setOrderItems(response.data.items || []);
        setDetailModalOpen(true);
      }
    } catch (err) {
      console.error('Siparis detayi yuklenemedi:', err);
      window.alert('Siparis detayi yuklenirken bir hata olustu');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
      if (selectedOrder && selectedOrder.Id === orderId) {
        setSelectedOrder({ ...selectedOrder, Status: newStatus });
      }
    } catch (err) {
      console.error('Durum guncelleme hatasi:', err);
      window.alert(err.response?.data?.message || 'Bir hata olustu');
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
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusBadge = (status) => {
    const badges = {
      Pending: { label: 'Beklemede', class: 'bg-yellow-100 text-yellow-800' },
      Confirmed: { label: 'Onaylandi', class: 'bg-blue-100 text-blue-800' },
      Preparing: { label: 'Hazirlaniyor', class: 'bg-purple-100 text-purple-800' },
      Delivered: { label: 'Teslim edildi', class: 'bg-green-100 text-green-800' },
      Cancelled: { label: 'Iptal', class: 'bg-red-100 text-red-800' },
    };

    const badge = badges[status] || badges.Pending;
    return <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.class}`}>{badge.label}</span>;
  };

  const statuses = [
    { value: '', label: 'Tumu' },
    { value: 'Pending', label: 'Beklemede' },
    { value: 'Confirmed', label: 'Onaylandi' },
    { value: 'Preparing', label: 'Hazirlaniyor' },
    { value: 'Delivered', label: 'Teslim edildi' },
    { value: 'Cancelled', label: 'Iptal' },
  ];

  const columns = [
    { header: 'Siparis No', render: (row) => <span className="font-bold text-primary">{row.OrderNumber}</span> },
    { header: 'Musteri', field: 'CustomerName' },
    { header: 'Telefon', field: 'CustomerPhone' },
    { header: 'Tutar', render: (row) => <span className="font-semibold text-dark">{formatCurrency(row.TotalAmount)}</span> },
    { header: 'Durum', render: (row) => getStatusBadge(row.Status) },
    { header: 'Tarih', render: (row) => <span className="text-dark-lighter">{formatDate(row.CreatedAt)}</span> },
  ];

  if (loading && orders.length === 0) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Operasyon</p>
            <h1 className="mt-2 text-3xl font-bold text-dark">Siparisler</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-lighter">
              Mobilde kart gorunumu, desktopta daha rahat tablo akisiyla siparis takibi.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-[24px] border border-white/70 bg-white px-4 py-3 shadow-card">
            <Filter className="h-4 w-4 text-primary" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="min-w-[180px] border-0 bg-transparent p-0 text-sm font-medium text-dark focus:ring-0"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          emptyMessage="Henuz siparis yok"
          actions={[
            {
              label: 'Detay',
              icon: Eye,
              variant: 'primary',
              onClick: handleViewDetails,
            },
          ]}
        />

        {pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-dark-lighter">
              Toplam {pagination.total} siparis, sayfa {pagination.page} / {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="rounded-2xl border border-surface-border bg-surface-muted px-4 py-3 text-sm font-bold text-dark transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Onceki
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="rounded-2xl border border-surface-border bg-surface-muted px-4 py-3 text-sm font-bold text-dark transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}

        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Siparis detayi"
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-surface-border bg-surface-muted p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Siparis no</p>
                  <p className="mt-2 text-xl font-bold text-dark">{selectedOrder.OrderNumber}</p>
                </div>
                <div className="rounded-[22px] border border-surface-border bg-surface-muted p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Tarih</p>
                  <p className="mt-2 text-sm text-dark">{formatDate(selectedOrder.CreatedAt)}</p>
                </div>
                <div className="rounded-[22px] border border-surface-border bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Musteri</p>
                  <p className="mt-2 text-sm text-dark">{selectedOrder.CustomerName}</p>
                </div>
                <div className="rounded-[22px] border border-surface-border bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Telefon</p>
                  <p className="mt-2 text-sm text-dark">{selectedOrder.CustomerPhone}</p>
                </div>
                <div className="rounded-[22px] border border-surface-border bg-white p-4 md:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Adres</p>
                  <p className="mt-2 text-sm leading-6 text-dark">{selectedOrder.CustomerAddress}</p>
                </div>
                {selectedOrder.Notes && (
                  <div className="rounded-[22px] border border-surface-border bg-white p-4 md:col-span-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Notlar</p>
                    <p className="mt-2 text-sm leading-6 text-dark-lighter">{selectedOrder.Notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-dark">Siparis durumu</label>
                <select
                  value={selectedOrder.Status}
                  onChange={(e) => handleStatusChange(selectedOrder.Id, e.target.value)}
                >
                  <option value="Pending">Beklemede</option>
                  <option value="Confirmed">Onaylandi</option>
                  <option value="Preparing">Hazirlaniyor</option>
                  <option value="Delivered">Teslim edildi</option>
                  <option value="Cancelled">Iptal</option>
                </select>
              </div>

              <div className="rounded-[28px] border border-white/70 bg-white shadow-card">
                <div className="border-b border-surface-border px-5 py-4">
                  <h3 className="text-lg font-bold text-dark">Siparis urunleri</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-muted">
                      <tr>
                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Urun</th>
                        <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Fiyat</th>
                        <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Adet</th>
                        <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {orderItems.map((item) => (
                        <tr key={item.Id}>
                          <td className="px-5 py-4 text-sm text-dark">{item.ProductName}</td>
                          <td className="px-5 py-4 text-right text-sm text-dark-lighter">{formatCurrency(item.ProductPrice)}</td>
                          <td className="px-5 py-4 text-center text-sm text-dark-lighter">{item.Quantity}</td>
                          <td className="px-5 py-4 text-right text-sm font-bold text-dark">{formatCurrency(item.Subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-surface-muted">
                      <tr>
                        <td colSpan="3" className="px-5 py-4 text-sm font-bold text-dark">Toplam</td>
                        <td className="px-5 py-4 text-right text-lg font-black text-primary">{formatCurrency(selectedOrder.TotalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default Orders;
