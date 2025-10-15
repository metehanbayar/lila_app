import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import Loading from '../../components/Loading';
import IconPicker from '../../components/admin/IconPicker';
import ColorPicker from '../../components/admin/ColorPicker';
import { Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/adminApi';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Utensils',
    color: 'bg-gray-500',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const categoriesRes = await getAdminCategories();

      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.Name,
        icon: category.Icon || 'Utensils',
        color: category.Color || 'bg-gray-500',
        isActive: category.IsActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        icon: 'Utensils',
        color: 'bg-gray-500',
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.Id, formData);
      } else {
        await createCategory(formData);
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (category) => {
    if (window.confirm(`${category.Name} kategorisini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteCategory(category.Id);
        loadData();
      } catch (err) {
        console.error('Silme hatası:', err);
        alert(err.response?.data?.message || 'Bir hata oluştu');
      }
    }
  };

  const columns = [
    { header: 'ID', field: 'Id' },
    {
      header: 'İkon',
       render: (row) => {
         const IconComponent = LucideIcons[row.Icon] || LucideIcons.Utensils;
        return (
          <div className={`w-10 h-10 rounded-lg ${row.Color || 'bg-gray-500'} flex items-center justify-center`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
        );
      },
    },
    { header: 'Kategori Adı', field: 'Name' },
    {
      header: 'Renk',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${row.Color || 'bg-gray-500'}`} />
          <span className="text-xs text-gray-500">{row.Color}</span>
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
  ];

  if (loading) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Kategoriler</h1>
            <p className="text-gray-600 mt-1">
              Global kategori yönetimi - Tüm restoranlar için ortak kategoriler
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Yeni Kategori
          </button>
        </div>

        {/* Bilgi Kutusu */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Not:</strong> Kategoriler tüm restoranlar için ortaktır. 
            Eklediğiniz her kategori tüm restoranlarda kullanılabilir.
          </p>
        </div>

        {/* Kategoriler Tablosu */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Tüm Kategoriler
          </h2>
          <DataTable
            columns={columns}
            data={categories}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            emptyMessage="Henüz kategori eklenmemiş"
          />
        </div>

        {/* Kategori Ekleme/Düzenleme Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kategori Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori Adı *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="Örn: Pizzalar, Tatlılar, İçecekler"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bu kategori tüm restoranlar tarafından kullanılabilir
              </p>
            </div>

            {/* İkon Seçici */}
            <IconPicker
              value={formData.icon}
              onChange={(icon) => setFormData({ ...formData, icon })}
            />

            {/* Renk Seçici */}
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
            />

            {/* Aktif/Pasif */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Kategori Aktif
              </label>
            </div>

            {/* Önizleme */}
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-3">ÖNİZLEME</p>
              <div className="flex items-center gap-3">
                 <div className={`w-14 h-14 rounded-xl ${formData.color} flex items-center justify-center shadow-lg`}>
                   {(() => {
                     const IconComponent = LucideIcons[formData.icon] || LucideIcons.Utensils;
                    return <IconComponent className="w-8 h-8 text-white" />;
                  })()}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{formData.name || 'Kategori Adı'}</p>
                  <p className="text-xs text-gray-500">{formData.icon} • {formData.color}</p>
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors font-medium shadow-lg shadow-primary/25"
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

export default Categories;
