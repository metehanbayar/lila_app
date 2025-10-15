import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Check, X, Navigation, Loader2 } from 'lucide-react';
import { 
  getAddresses, 
  createAddress, 
  updateAddress, 
  setDefaultAddress, 
  deleteAddress 
} from '../services/customerApi';
import LocationPickerModal from './LocationPickerModal';
import useCustomerStore from '../store/customerStore';

function AddressManager({ isOpen, onClose, onSelectAddress }) {
  const { isAuthenticated } = useCustomerStore();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [formData, setFormData] = useState({
    addressName: '',
    fullAddress: '',
    isDefault: false
  });
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Sadece modal açıksa VE kullanıcı giriş yapmışsa adresleri yükle
    if (isOpen && isAuthenticated) {
      loadAddresses();
    }
  }, [isOpen, isAuthenticated]);

  const loadAddresses = async () => {
    // Ekstra güvenlik kontrolü
    if (!isAuthenticated) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await getAddresses();
      if (response.success) {
        setAddresses(response.data);
      }
    } catch (err) {
      console.error('Adresler yüklenemedi:', err);
      setError('Adresler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationConfirm = (address) => {
    setFormData((prev) => ({ ...prev, fullAddress: address }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.addressName.trim()) {
      setError('Adres ismi gereklidir');
      return;
    }

    if (!formData.fullAddress.trim()) {
      setError('Adres seçimi gereklidir');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      if (editingId) {
        const response = await updateAddress(editingId, formData);
        if (response.success) {
          await loadAddresses();
          resetForm();
        }
      } else {
        const response = await createAddress(formData);
        if (response.success) {
          await loadAddresses();
          resetForm();
        }
      }
    } catch (err) {
      console.error('Adres kaydedilemedi:', err);
      setError(err.response?.data?.message || 'Adres kaydedilirken hata oluştu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (address) => {
    setFormData({
      addressName: address.AddressName,
      fullAddress: address.FullAddress,
      isDefault: address.IsDefault
    });
    setEditingId(address.Id);
    setShowAddForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await deleteAddress(id);
      if (response.success) {
        await loadAddresses();
      }
    } catch (err) {
      console.error('Adres silinemedi:', err);
      alert(err.response?.data?.message || 'Adres silinirken hata oluştu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefault = async (id) => {
    setActionLoading(true);
    try {
      const response = await setDefaultAddress(id);
      if (response.success) {
        await loadAddresses();
      }
    } catch (err) {
      console.error('Varsayılan adres ayarlanamadı:', err);
      alert(err.response?.data?.message || 'Varsayılan adres ayarlanırken hata oluştu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectForOrder = (address) => {
    if (onSelectAddress) {
      onSelectAddress({
        addressName: address.AddressName,
        fullAddress: address.FullAddress
      });
    }
    onClose();
  };

  const resetForm = () => {
    setFormData({
      addressName: '',
      fullAddress: '',
      isDefault: false
    });
    setEditingId(null);
    setShowAddForm(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">
              {onSelectAddress ? 'Adres Seçin' : 'Adreslerim'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : showAddForm ? (
              /* Add/Edit Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres İsmi *
                  </label>
                  <input
                    type="text"
                    value={formData.addressName}
                    onChange={(e) => setFormData({ ...formData, addressName: e.target.value })}
                    placeholder="Örn: Ev, İş, Anne Evi"
                    maxLength={50}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres *
                  </label>
                  
                  {formData.fullAddress ? (
                    <div className="space-y-2">
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {formData.fullAddress}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Adresi Değiştir</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-4 border-2 border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <MapPin className="w-5 h-5" />
                      <span className="font-medium">Haritadan Adres Seç</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Varsayılan adres olarak ayarla
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
                  >
                    {actionLoading ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            ) : (
              /* Address List */
              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Henüz kayıtlı adresiniz yok</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      <span>İlk Adresi Ekle</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {addresses.map((address) => (
                      <div
                        key={address.Id}
                        className={`border rounded-lg p-4 transition-all ${
                          address.IsDefault ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                        } ${onSelectAddress ? 'cursor-pointer hover:shadow-md' : ''}`}
                        onClick={onSelectAddress ? () => handleSelectForOrder(address) : undefined}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MapPin className={`w-5 h-5 ${address.IsDefault ? 'text-primary' : 'text-gray-500'}`} />
                            <span className="font-semibold text-gray-800">{address.AddressName}</span>
                            {address.IsDefault && (
                              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                Varsayılan
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleEdit(address)}
                              disabled={actionLoading}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                              title="Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(address.Id)}
                              disabled={actionLoading}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {address.FullAddress}
                        </p>
                        
                        {!onSelectAddress && (
                          <div className="flex gap-2">
                            {!address.IsDefault && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetDefault(address.Id);
                                }}
                                disabled={actionLoading}
                                className="text-xs px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-colors disabled:opacity-50"
                              >
                                Varsayılan Yap
                              </button>
                            )}
                          </div>
                        )}
                        
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Yeni Adres Ekle</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!showAddForm && !loading && addresses.length > 0 && !onSelectAddress && (
            <div className="p-4 border-t">
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationConfirm}
      />
    </>
  );
}

export default AddressManager;

