import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import Loading from '../../components/Loading';
import { Plus, User, Mail, Store, Lock } from 'lucide-react';
import useAdminStore from '../../store/adminStore';
import {
  getAdminUsers,
  getAdminRestaurants,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  updateAdminUserStatus,
} from '../../services/adminApi';

function Users() {
  const { admin, isSystemAdmin } = useAdminStore();
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    restaurantId: '',
    isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, restaurantsRes] = await Promise.all([
        getAdminUsers(),
        isSystemAdmin() ? getAdminRestaurants() : Promise.resolve({ success: true, data: [] }),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data);
      }
      
      if (restaurantsRes.success && restaurantsRes.data) {
        setRestaurants(restaurantsRes.data);
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      alert('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.Username,
        password: '', // Şifre gösterilmez
        fullName: user.FullName,
        email: user.Email || '',
        restaurantId: user.RestaurantId || '',
        isActive: user.IsActive,
      });
      setShowPassword(false);
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        restaurantId: admin?.restaurantId || '',
        isActive: true,
      });
      setShowPassword(true);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      restaurantId: admin?.restaurantId || '',
      isActive: true,
    });
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // Şifre boşsa ve güncelleme yapılıyorsa, şifreyi gönderme
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }

      // Restoran bazlı kullanıcı ise restaurantId'yi mevcut admin'in restaurantId'si ile sabitle
      if (!isSystemAdmin()) {
        submitData.restaurantId = admin.restaurantId;
      } else if (!submitData.restaurantId) {
        submitData.restaurantId = null; // Sistem admin'i
      }

      if (editingUser) {
        await updateAdminUser(editingUser.Id, submitData);
      } else {
        if (!submitData.password) {
          alert('Yeni kullanıcı için şifre gereklidir');
          return;
        }
        await createAdminUser(submitData);
      }
      
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (user) => {
    if (window.confirm(`${user.FullName} kullanıcısını silmek (pasif etmek) istediğinizden emin misiniz?`)) {
      try {
        await deleteAdminUser(user.Id);
        loadData();
      } catch (err) {
        console.error('Silme hatası:', err);
        alert(err.response?.data?.message || 'Bir hata oluştu');
      }
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await updateAdminUserStatus(user.Id, !user.IsActive);
      loadData();
    } catch (err) {
      console.error('Durum güncelleme hatası:', err);
      alert(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    { header: 'ID', field: 'Id' },
    { header: 'Kullanıcı Adı', field: 'Username' },
    { header: 'Tam Ad', field: 'FullName' },
    {
      header: 'E-posta',
      render: (row) => (
        <span className="text-sm text-gray-700">{row.Email || '-'}</span>
      ),
    },
    {
      header: 'Restoran',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {row.RestaurantName || (
            <span className="text-gray-400 italic">Sistem Admin</span>
          )}
        </span>
      ),
    },
    {
      header: 'Durum',
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
            row.IsActive
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {row.IsActive ? 'Aktif' : 'Pasif'}
        </button>
      ),
    },
    {
      header: 'Son Giriş',
      render: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.LastLogin)}</span>
      ),
    },
    {
      header: 'Oluşturulma',
      render: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.CreatedAt)}</span>
      ),
    },
  ];

  if (loading) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">Kullanıcılar</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Admin kullanıcı yönetimi
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-dark text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base font-medium whitespace-nowrap"
          >
            <Plus size={20} className="flex-shrink-0" />
            <span>Yeni Kullanıcı</span>
          </button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={users}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          emptyMessage="Henüz kullanıcı eklenmemiş"
        />

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <User className="inline w-4 h-4 mr-1" />
                Kullanıcı Adı *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                autoComplete="username"
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="kullanici_adi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Lock className="inline w-4 h-4 mr-1" />
                Şifre {editingUser ? '(Değiştirmek için doldurun)' : '*'}
              </label>
              <input
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete={editingUser ? "new-password" : "current-password"}
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tam Ad *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ahmet Yılmaz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="inline w-4 h-4 mr-1" />
                E-posta
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="email"
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="ornek@email.com"
              />
            </div>

            {isSystemAdmin() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Store className="inline w-4 h-4 mr-1" />
                  Restoran (Sistem Admin için boş bırakın)
                </label>
                <select
                  value={formData.restaurantId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, restaurantId: e.target.value || null })
                  }
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Sistem Admin</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.Id} value={restaurant.Id}>
                      {restaurant.Name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isSystemAdmin() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <Store className="inline w-4 h-4 mr-1" />
                  Bu kullanıcı <strong>{admin?.restaurantName}</strong> restoranına bağlı olacak.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Aktif
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                {editingUser ? 'Güncelle' : 'Oluştur'}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default Users;

