import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import Loading from '../../components/Loading';
import ImagePicker from '../../components/admin/ImagePicker';
import { Plus } from 'lucide-react';
import {
  getAdminRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '../../services/adminApi';

function Restaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#EC4899',
    imageUrl: '',
    isActive: true,
    deliveryTime: '',
    minOrder: '',
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const response = await getAdminRestaurants();
      if (response.success) {
        setRestaurants(response.data);
      }
    } catch (err) {
      console.error('Restoranlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (restaurant = null) => {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setFormData({
        name: restaurant.Name,
        slug: restaurant.Slug,
        description: restaurant.Description || '',
        color: restaurant.Color,
        imageUrl: restaurant.ImageUrl || '',
        isActive: restaurant.IsActive,
        deliveryTime: restaurant.DeliveryTime || '',
        minOrder: restaurant.MinOrder || '',
      });
    } else {
      setEditingRestaurant(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        color: '#EC4899',
        imageUrl: '',
        isActive: true,
        deliveryTime: '',
        minOrder: '',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRestaurant(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRestaurant) {
        await updateRestaurant(editingRestaurant.Id, formData);
      } else {
        await createRestaurant(formData);
      }
      handleCloseModal();
      loadRestaurants();
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (restaurant) => {
    if (window.confirm(`${restaurant.Name} restoranını silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteRestaurant(restaurant.Id);
        loadRestaurants();
      } catch (err) {
        console.error('Silme hatası:', err);
        alert(err.response?.data?.message || 'Bir hata oluştu');
      }
    }
  };

  const columns = [
    { header: 'ID', field: 'Id' },
    { header: 'Ad', field: 'Name' },
    { header: 'Slug', field: 'Slug' },
    {
      header: 'Teslimat',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {row.DeliveryTime || '-'}
        </span>
      ),
    },
    {
      header: 'Min. Sipariş',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {row.MinOrder ? `${row.MinOrder} ₺` : '-'}
        </span>
      ),
    },
    {
      header: 'Görsel',
      render: (row) => (
        row.ImageUrl ? (
          <img
            src={row.ImageUrl}
            alt={row.Name}
            className="w-16 h-10 object-cover rounded border border-gray-200"
          />
        ) : (
          <span className="text-gray-400 text-sm">Görsel yok</span>
        )
      ),
    },
    {
      header: 'Renk',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: row.Color }}
          />
          <span>{row.Color}</span>
        </div>
      ),
    },
    {
      header: 'Durum',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.IsActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {row.IsActive ? 'Aktif' : 'Pasif'}
        </span>
      ),
    },
    {
      header: 'Fiş Template',
      render: (row) => (
        <button
          onClick={() => navigate(`/admin/restaurants/${row.Id}/receipt-template`)}
          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm font-medium"
        >
          🎨 Düzenle
        </button>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">Restoranlar</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Restoran yönetimi ve düzenleme</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-dark text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base font-medium whitespace-nowrap"
          >
            <Plus size={20} className="flex-shrink-0" />
            <span>Yeni Restoran</span>
          </button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={restaurants}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          emptyMessage="Henüz restoran eklenmemiş"
        />

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingRestaurant ? 'Restoran Düzenle' : 'Yeni Restoran'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Restoran Adı *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Slug (URL) *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="lila-steakhouse"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <ImagePicker
              label="Restoran Görseli"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tema Rengi
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-14 sm:w-16 h-10 sm:h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Teslimat Süresi
                </label>
                <input
                  type="text"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  placeholder="30-45 dk"
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Minimum Sipariş (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minOrder}
                  onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                  placeholder="50"
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="ml-2 text-sm sm:text-base text-gray-700">
                Aktif
              </label>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-primary hover:bg-primary-dark active:bg-primary-dark text-white rounded-lg transition-colors font-medium"
              >
                Kaydet
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default Restaurants;

