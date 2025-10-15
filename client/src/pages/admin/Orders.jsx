import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/admin/Modal';
import Loading from '../../components/Loading';
import { Eye, Filter } from 'lucide-react';
import { getAdminOrders, getAdminOrder, updateOrderStatus } from '../../services/adminApi';

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
        setOrders(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Siparişler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (order) => {
    try {
      const response = await getAdminOrder(order.Id);
      if (response.success) {
        setSelectedOrder(response.data.order);
        setOrderItems(response.data.items);
        setDetailModalOpen(true);
      }
    } catch (err) {
      console.error('Sipariş detayı yüklenemedi:', err);
      alert('Sipariş detayı yüklenirken bir hata oluştu');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
      if (selectedOrder && selectedOrder.Id === orderId) {
        setSelectedOrder({ ...selectedOrder, Status: newStatus });
      }
    } catch (err) {
      console.error('Durum güncelleme hatası:', err);
      alert(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
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

  const statuses = [
    { value: '', label: 'Tümü' },
    { value: 'Pending', label: 'Beklemede' },
    { value: 'Confirmed', label: 'Onaylandı' },
    { value: 'Preparing', label: 'Hazırlanıyor' },
    { value: 'Delivered', label: 'Teslim Edildi' },
    { value: 'Cancelled', label: 'İptal' },
  ];

  if (loading && orders.length === 0) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Siparişler</h1>
            <p className="text-gray-600 mt-1">
              Sipariş yönetimi ve durum takibi
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sipariş No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                      {order.OrderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.CustomerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.CustomerPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(order.TotalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(order.Status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.CreatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-primary hover:text-primary-dark inline-flex items-center gap-1"
                      >
                        <Eye size={16} />
                        Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Toplam {pagination.total} sipariş ({pagination.page} / {pagination.totalPages})
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Sipariş Detayı"
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Sipariş No</label>
                  <p className="text-lg font-semibold text-primary mt-1">
                    {selectedOrder.OrderNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sipariş Tarihi</label>
                  <p className="mt-1">{formatDate(selectedOrder.CreatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Müşteri Adı</label>
                  <p className="mt-1">{selectedOrder.CustomerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefon</label>
                  <p className="mt-1">{selectedOrder.CustomerPhone}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Adres</label>
                  <p className="mt-1">{selectedOrder.CustomerAddress}</p>
                </div>
                {selectedOrder.Notes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Notlar</label>
                    <p className="mt-1 text-gray-600">{selectedOrder.Notes}</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sipariş Durumu
                </label>
                <select
                  value={selectedOrder.Status}
                  onChange={(e) => handleStatusChange(selectedOrder.Id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Pending">Beklemede</option>
                  <option value="Confirmed">Onaylandı</option>
                  <option value="Preparing">Hazırlanıyor</option>
                  <option value="Delivered">Teslim Edildi</option>
                  <option value="Cancelled">İptal</option>
                </select>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Sipariş Ürünleri</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Ürün
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          Fiyat
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                          Adet
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          Toplam
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orderItems.map((item) => (
                        <tr key={item.Id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.ProductName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">
                            {formatCurrency(item.ProductPrice)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.Quantity}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            {formatCurrency(item.Subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-900">
                          Toplam
                        </td>
                        <td className="px-4 py-3 text-lg font-bold text-primary text-right">
                          {formatCurrency(selectedOrder.TotalAmount)}
                        </td>
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

