import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/admin/StatCard';
import Loading from '../../components/Loading';
import { getDashboardStats, getRecentOrders } from '../../services/adminApi';
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Clock,
} from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, ordersResponse] = await Promise.all([
        getDashboardStats(),
        getRecentOrders(),
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      if (ordersResponse.success) {
        setRecentOrders(ordersResponse.data);
      }
    } catch (err) {
      console.error('Dashboard yükleme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu');
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

  if (loading) return <AdminLayout><Loading /></AdminLayout>;

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Genel bakış ve istatistikler</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            icon={Store}
            title="Toplam Restoran"
            value={stats?.restaurants || 0}
            color="primary"
          />
          <StatCard
            icon={Package}
            title="Toplam Ürün"
            value={stats?.products || 0}
            color="secondary"
          />
          <StatCard
            icon={ShoppingBag}
            title="Toplam Sipariş"
            value={stats?.totalOrders || 0}
            color="dark"
          />
          <StatCard
            icon={Clock}
            title="Bugünkü Siparişler"
            value={stats?.todayOrders || 0}
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            title="Toplam Ciro"
            value={formatCurrency(stats?.totalRevenue || 0)}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="Bugünkü Ciro"
            value={formatCurrency(stats?.todayRevenue || 0)}
            color="yellow"
          />
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Son Siparişler</h2>
          </div>
          
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <div key={order.Id} className="p-4 hover:bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Sipariş No</span>
                    <span className="text-sm font-semibold text-primary">{order.OrderNumber}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Müşteri</span>
                    <span className="text-sm text-gray-900 text-right">{order.CustomerName}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Telefon</span>
                    <span className="text-sm text-gray-900">{order.CustomerPhone}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Tutar</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.TotalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Durum</span>
                    {getStatusBadge(order.Status)}
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Tarih</span>
                    <span className="text-xs text-gray-500 text-right">{formatDate(order.CreatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Dashboard;

