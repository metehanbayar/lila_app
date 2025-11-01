import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import Loading from '../../components/Loading';
import ImagePicker from '../../components/admin/ImagePicker';
import { Plus, Trash2, GripVertical, ArrowUpDown, Power, PowerOff } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getAdminProducts,
  getAdminRestaurants,
  getAdminCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getProductVariants,
  bulkUpdateProductVariants,
  reorderProducts,
} from '../../services/adminApi';

// Sürüklenebilir Ürün Satırı
function SortableProductRow({ product, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.Id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-white border rounded-lg ${
        isDragging ? 'shadow-lg z-50' : 'shadow-sm'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded"
      >
        <GripVertical className="text-gray-400" size={20} />
      </div>
      
      {product.ImageUrl && (
        <img
          src={product.ImageUrl}
          alt={product.Name}
          className="w-16 h-16 object-cover rounded"
        />
      )}
      
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{product.Name}</div>
        <div className="text-sm text-gray-600">
          {product.RestaurantName} {product.CategoryName && `• ${product.CategoryName}`}
        </div>
      </div>
      
      <div className="font-semibold text-primary">
        {formatCurrency(product.Price)}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Düzenle
        </button>
        <button
          onClick={() => onDelete(product)}
          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Sil
        </button>
      </div>
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortModeOpen, setSortModeOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sortFilterRestaurant, setSortFilterRestaurant] = useState('');
  const [sortFilterCategory, setSortFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    restaurantId: '',
    categoryId: '',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isFeatured: false,
    displayOrder: 0,
    isActive: true,
  });
  const [variants, setVariants] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, restaurantsRes, categoriesRes] = await Promise.all([
        getAdminProducts(),
        getAdminRestaurants(),
        getAdminCategories(),
      ]);

      if (productsRes.success) {
        setProducts(productsRes.data);
      }
      if (restaurantsRes.success) {
        setRestaurants(restaurantsRes.data.filter((r) => r.IsActive));
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.data.filter((c) => c.IsActive));
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Kategoriler artık ortak, restoran bazlı filtrelemeye gerek yok

  const handleOpenModal = async (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        restaurantId: product.RestaurantId,
        categoryId: product.CategoryId || '',
        name: product.Name,
        description: product.Description || '',
        price: product.Price,
        imageUrl: product.ImageUrl || '',
        isFeatured: product.IsFeatured,
        displayOrder: product.DisplayOrder || 0,
        isActive: product.IsActive,
      });
      // Varyantları yükle
      await loadVariants(product.Id);
    } else {
      setEditingProduct(null);
      const defaultRestaurantId = restaurants[0]?.Id || '';
      setFormData({
        restaurantId: defaultRestaurantId,
        categoryId: '',
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        isFeatured: false,
        displayOrder: 0,
        isActive: true,
      });
      setVariants([createEmptyVariant()]);
    }
    setModalOpen(true);
  };

  const loadVariants = async (productId) => {
    try {
      const response = await getProductVariants(productId);
      if (response.success && response.data.length > 0) {
        const normalizedVariants = response.data.map(v => ({
          id: v.Id,
          name: v.Name,
          price: v.Price,
          isDefault: v.IsDefault,
          displayOrder: v.DisplayOrder,
        }));
        setVariants(normalizedVariants);
      } else {
        setVariants([createEmptyVariant()]);
      }
    } catch (err) {
      console.error('Varyant yükleme hatası:', err);
      setVariants([createEmptyVariant()]);
    }
  };

  const createEmptyVariant = () => ({
    id: null,
    name: '',
    price: '',
    isDefault: false,
    displayOrder: 0,
  });

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setVariants([]);
  };

  const handleAddVariant = () => {
    setVariants([...variants, createEmptyVariant()]);
  };

  const handleRemoveVariant = (index) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants.length > 0 ? newVariants : [createEmptyVariant()]);
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: value,
    };

    // Eğer isDefault true yapılıyorsa, diğerlerini false yap
    if (field === 'isDefault' && value === true) {
      newVariants.forEach((v, i) => {
        if (i !== index) {
          v.isDefault = false;
        }
      });
    }

    setVariants(newVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        categoryId: formData.categoryId || null,
      };
      
      let productId;
      if (editingProduct) {
        await updateProduct(editingProduct.Id, data);
        productId = editingProduct.Id;
      } else {
        const result = await createProduct(data);
        productId = result.data.Id;
      }

      // Varyantları kaydet
      const validVariants = variants.filter(v => {
        const name = v.name || '';
        const price = v.price;
        return name.trim() && price;
      });

      if (validVariants.length > 0) {
        // Varsayılan varyant yoksa ilkini varsayılan yap
        if (!validVariants.some(v => v.isDefault)) {
          validVariants[0].isDefault = true;
        }

        const variantsData = validVariants.map((v, index) => ({
          id: v.id || null,
          name: v.name.trim(),
          price: parseFloat(v.price),
          isDefault: v.isDefault || false,
          displayOrder: v.displayOrder || index,
        }));

        await bulkUpdateProductVariants(productId, variantsData);
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = !product.IsActive;
      await updateProductStatus(product.Id, newStatus);
      
      // UI'ı hemen güncelle
      setProducts(products.map(p => 
        p.Id === product.Id ? { ...p, IsActive: newStatus } : p
      ));
    } catch (err) {
      console.error('Durum güncelleme hatası:', err);
      alert(err.response?.data?.message || 'Durum güncellenirken bir hata oluştu');
    }
  };

  const handleDelete = async (product) => {
    if (window.confirm(`${product.Name} ürününü silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteProduct(product.Id);
        loadData();
      } catch (err) {
        console.error('Silme hatası:', err);
        alert(err.response?.data?.message || 'Bir hata oluştu');
      }
    }
  };

  const getFilteredProductsForSort = () => {
    let filtered = products;

    if (sortFilterRestaurant) {
      filtered = filtered.filter(p => p.RestaurantId === parseInt(sortFilterRestaurant));
    }

    if (sortFilterCategory) {
      filtered = filtered.filter(p => p.CategoryId === parseInt(sortFilterCategory));
    }

    return filtered.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
  };

  const handleProductDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const filteredProducts = getFilteredProductsForSort();
    const oldIndex = filteredProducts.findIndex(p => p.Id === active.id);
    const newIndex = filteredProducts.findIndex(p => p.Id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(filteredProducts, oldIndex, newIndex);
    
    // UI'ı hemen güncelle
    const updatedProducts = products.map(product => {
      const newProduct = newOrder.find(np => np.Id === product.Id);
      if (newProduct) {
        const index = newOrder.indexOf(newProduct);
        return { ...product, DisplayOrder: index };
      }
      return product;
    });
    
    setProducts(updatedProducts);

    // Backend'e gönder
    try {
      const productOrders = newOrder.map((product, index) => ({
        productId: product.Id,
        displayOrder: index,
      }));

      await reorderProducts(productOrders);
    } catch (err) {
      console.error('Ürün sıralama hatası:', err);
      alert('Sıralama kaydedilemedi');
      await loadData();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const columns = [
    { header: 'ID', field: 'Id' },
    { header: 'Restoran', field: 'RestaurantName' },
    { header: 'Kategori', field: 'CategoryName' },
    { header: 'Ürün Adı', field: 'Name' },
    {
      header: 'Fiyat',
      render: (row) => formatCurrency(row.Price),
    },
    {
      header: 'Öne Çıkan',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.IsFeatured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.IsFeatured ? 'Evet' : 'Hayır'}
        </span>
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
            <h1 className="text-3xl font-bold text-gray-800">Ürünler</h1>
            <p className="text-gray-600 mt-1">Ürün yönetimi ve düzenleme</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSortModeOpen(true)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowUpDown size={20} />
              Sırala
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Yeni Ürün
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={products}
          actions={[
            {
              label: 'Düzenle',
              icon: null,
              variant: 'primary',
              onClick: handleOpenModal,
            },
            {
              type: 'switch',
              field: 'IsActive',
              onClick: handleToggleStatus,
            },
            {
              label: 'Sil',
              icon: Trash2,
              variant: 'danger',
              onClick: handleDelete,
            },
          ]}
          emptyMessage="Henüz ürün eklenmemiş"
        />

        {/* Sıralama Modal */}
        <Modal
          isOpen={sortModeOpen}
          onClose={() => setSortModeOpen(false)}
          title="Ürün Sıralama"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Ürünleri sürükleyerek yeniden sıralayabilirsiniz. Filtre seçerek belirli bir restoran veya kategori için sıralama yapabilirsiniz.
            </p>

            {/* Filtreler */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restoran Filtresi
                </label>
                <select
                  value={sortFilterRestaurant}
                  onChange={(e) => {
                    setSortFilterRestaurant(e.target.value);
                    setSortFilterCategory('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Tüm Restoranlar</option>
                  {restaurants.map(r => (
                    <option key={r.Id} value={r.Id}>{r.Name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori Filtresi
                </label>
                <select
                  value={sortFilterCategory}
                  onChange={(e) => setSortFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!sortFilterRestaurant}
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map(c => (
                    <option key={c.Id} value={c.Id}>{c.Name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sürüklenebilir Ürün Listesi */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleProductDragEnd}
            >
              <SortableContext
                items={getFilteredProductsForSort().map(p => p.Id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getFilteredProductsForSort().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Filtreye uygun ürün bulunamadı
                    </div>
                  ) : (
                    getFilteredProductsForSort().map(product => (
                      <SortableProductRow
                        key={product.Id}
                        product={product}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => setSortModeOpen(false)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </Modal>

        {/* Ürün Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restoran *
                </label>
                <select
                  required
                  value={formData.restaurantId}
                  onChange={(e) =>
                    setFormData({ ...formData, restaurantId: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Restoran Seçin</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.Id} value={restaurant.Id}>
                      {restaurant.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: parseInt(e.target.value) || '' })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Kategori Seçin (İsteğe Bağlı)</option>
                  {categories.map((category) => (
                    <option key={category.Id} value={category.Id}>
                      {category.Name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Adı *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiyat (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sıralama
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <ImagePicker
              label="Ürün Görseli"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />

            {/* Varyant Yönetimi */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Porsiyon/Varyant Seçenekleri
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Farklı fiyat seçenekleri ekleyin (Örn: Tam Porsiyon, Yarım Porsiyon)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Varyant Ekle</span>
                </button>
              </div>

              <div className="space-y-2">
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      {/* Varyant Adı */}
                      <input
                        type="text"
                        value={variant.name || ''}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        placeholder="Örn: Tam Porsiyon"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                      />

                      {/* Fiyat */}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price || ''}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        placeholder="Fiyat (₺)"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                      />

                      {/* Varsayılan */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`default-${index}`}
                          checked={variant.isDefault || false}
                          onChange={(e) => handleVariantChange(index, 'isDefault', e.target.checked)}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor={`default-${index}`} className="text-sm text-gray-700">
                          Varsayılan
                        </label>
                      </div>
                    </div>

                    {/* Sil Butonu */}
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      disabled={variants.length === 1}
                      className="p-2 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Varyantı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">
                  Öne Çıkan
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Aktif
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
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

export default Products;

