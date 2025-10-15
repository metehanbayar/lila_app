import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Package, TrendingUp, ShoppingBag, Edit2, Heart, BookMarked } from 'lucide-react';
import useCustomerStore from '../../store/customerStore';
import { getStatistics, updateProfile, getFavorites } from '../../services/customerApi';
import AppLayout from '../../components/AppLayout';
import Loading from '../../components/Loading';
import AddressManager from '../../components/AddressManager';

function Profile() {
  const { customer, updateProfile: updateStoreProfile, logout, setFavorites } = useCustomerStore();
  const [stats, setStats] = useState(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: customer?.fullName || '',
    phone: customer?.phone || '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);

  useEffect(() => {
    loadStatistics();
    loadFavorites();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await getStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('İstatistikler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await getFavorites();
      if (response.success) {
        setFavoritesCount(response.data.length);
        // Store'a favori ID'leri kaydet
        const favoriteIds = response.data.map(p => p.Id);
        setFavorites(favoriteIds);
      }
    } catch (err) {
      console.error('Favoriler yüklenemedi:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const response = await updateProfile(formData);
      if (response.success) {
        updateStoreProfile(response.data);
        setEditing(false);
      }
    } catch (err) {
      console.error('Profil güncellenemedi:', err);
      alert(err.response?.data?.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setSaveLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Profilim</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Hesap bilgileriniz ve istatistikleriniz
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors font-medium"
            >
              Çıkış Yap
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="text-primary" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Toplam Sipariş</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats?.totalOrders || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Toplam Harcama</p>
                  <p className="text-base sm:text-xl font-bold text-gray-800 break-all">
                    {formatCurrency(stats?.totalSpent || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="text-blue-600" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Aktif Sipariş</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">
                    {stats?.ordersByStatus?.filter(s => ['Pending', 'Confirmed', 'Preparing'].includes(s.Status))
                      .reduce((sum, s) => sum + s.count, 0) || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="text-red-500" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Favorilerim</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">{favoritesCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Hesap Bilgileri</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium"
                >
                  <Edit2 size={16} />
                  <span>Düzenle</span>
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>


                <div className="flex gap-2 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        fullName: customer?.fullName || '',
                        phone: customer?.phone || '',
                      });
                    }}
                    className="flex-1 px-4 py-2.5 sm:py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 px-4 py-2.5 sm:py-2 text-sm bg-primary hover:bg-primary-dark active:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                  >
                    {saveLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="text-gray-600" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">Ad Soyad</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900 mt-0.5 break-words">
                      {customer?.fullName || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="text-gray-600" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">E-posta</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900 mt-0.5 break-all">
                      {customer?.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="text-gray-600" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">Telefon</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900 mt-0.5 break-words">
                      {customer?.phone || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              to="/my-orders"
              className="bg-white p-4 sm:p-5 rounded-lg shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Package className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-primary transition-colors">
                    Siparişlerim
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">Tüm siparişlerinizi görüntüleyin</p>
                </div>
              </div>
            </Link>

            <Link
              to="/favorites"
              className="bg-white p-4 sm:p-5 rounded-lg shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Heart className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-red-500 transition-colors">
                    Favorilerim
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">Favori ürünlerinizi görün</p>
                </div>
              </div>
            </Link>

            <button
              onClick={() => setShowAddressManager(true)}
              className="bg-white p-4 sm:p-5 rounded-lg shadow-card hover:shadow-card-hover transition-shadow group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                  <BookMarked className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    Adreslerim
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">Kayıtlı adreslerinizi yönetin</p>
                </div>
              </div>
            </button>

            <Link
              to="/"
              className="bg-white p-4 sm:p-5 rounded-lg shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="text-secondary" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-secondary transition-colors">
                    Yeni Sipariş
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">Menüye göz atın</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Address Manager Modal */}
      <AddressManager
        isOpen={showAddressManager}
        onClose={() => setShowAddressManager(false)}
      />
    </AppLayout>
  );
}

export default Profile;

