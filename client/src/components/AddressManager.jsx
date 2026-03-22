import { Suspense, lazy, useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  Edit2,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from '../services/customerApi';
import useCustomerStore from '../store/customerStore';
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  TextInput,
} from './ui/primitives';

const LocationPickerModal = lazy(() => import('./LocationPickerModal'));

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
    isDefault: false,
  });
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadAddresses();
    }
  }, [isOpen, isAuthenticated]);

  const loadAddresses = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError('');
      const response = await getAddresses();
      if (response.success) {
        setAddresses(response.data || []);
      }
    } catch (err) {
      console.error('Adresler yuklenemedi:', err);
      setError('Adresler yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      addressName: '',
      fullAddress: '',
      isDefault: false,
    });
    setEditingId(null);
    setShowAddForm(false);
    setError('');
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
      setError('Adres secimi gereklidir');
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
      setError(err.response?.data?.message || 'Adres kaydedilirken hata olustu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (address) => {
    setFormData({
      addressName: address.AddressName,
      fullAddress: address.FullAddress,
      isDefault: address.IsDefault,
    });
    setEditingId(address.Id);
    setShowAddForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu adresi silmek istediginize emin misiniz?')) {
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
      window.alert(err.response?.data?.message || 'Adres silinirken hata olustu');
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
      console.error('Varsayilan adres ayarlanamadi:', err);
      window.alert(err.response?.data?.message || 'Varsayilan adres ayarlanirken hata olustu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectForOrder = (address) => {
    if (onSelectAddress) {
      onSelectAddress({
        addressName: address.AddressName,
        fullAddress: address.FullAddress,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[180] bg-dark/65 backdrop-blur-md">
        <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Adres modali kapat" />

        <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-none border border-white/10 bg-[#f8f2ee] shadow-premium sm:mt-6 sm:h-[calc(100vh-3rem)] sm:rounded-[32px]">
          <div className="border-b border-surface-border bg-white/86 px-5 py-4 backdrop-blur-xl sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="gm-eyebrow">{onSelectAddress ? 'Adres secimi' : 'Kayitli adresler'}</span>
                <div>
                  <h3 className="gm-display text-3xl sm:text-4xl">
                    {showAddForm ? (editingId ? 'Adresi duzenle' : 'Yeni adres ekle') : onSelectAddress ? 'Adres secin' : 'Adreslerim'}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-lighter">Kayitli adreslerinizi yonetin.</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-2xl bg-surface-muted p-3 text-dark transition-all hover:bg-white hover:shadow-card"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-white shadow-card">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                  <p className="text-sm font-medium text-dark-lighter">Adresler yukleniyor...</p>
                </div>
              </div>
            ) : showAddForm ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr),320px]">
                  <div className="space-y-5">
                    <div className="gm-panel space-y-4">
                      <Field label="Adres ismi">
                        <TextInput
                          value={formData.addressName}
                          onChange={(e) => setFormData({ ...formData, addressName: e.target.value })}
                          placeholder="Orn: Ev, Ofis, Yazlik"
                          maxLength={50}
                        />
                      </Field>

                      <Field label="Secilen adres">
                        {formData.fullAddress ? (
                          <div className="rounded-[22px] border border-surface-border bg-surface-muted p-4 text-sm leading-6 text-dark">
                            {formData.fullAddress}
                          </div>
                        ) : (
                          <div className="rounded-[22px] border border-dashed border-primary/25 bg-primary/5 p-5 text-sm text-primary-dark">
                            Henuz haritadan bir adres secilmedi.
                          </div>
                        )}
                      </Field>

                      <SecondaryButton type="button" className="w-full justify-center" onClick={() => setShowLocationModal(true)}>
                        <Navigation className="h-4 w-4" />
                        {formData.fullAddress ? 'Adresi degistir' : 'Haritadan adres sec'}
                      </SecondaryButton>
                    </div>
                  </div>

                  <div className="gm-panel-muted space-y-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Ayarlar</p>
                      <h4 className="mt-2 text-xl font-bold text-dark">Kayit tercihleri</h4>
                    </div>

                    <label className="flex items-start gap-3 rounded-[22px] border border-surface-border bg-white px-4 py-4">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-surface-border text-primary focus:ring-primary"
                      />
                      <div className="space-y-1">
                        <span className="block text-sm font-semibold text-dark">Varsayilan adres yap</span>
                        <span className="block text-sm leading-6 text-dark-lighter">
                          Checkout ekraninda bu adresi otomatik oner.
                        </span>
                      </div>
                    </label>

                    <div className="rounded-[22px] border border-surface-border bg-white px-4 py-4 text-sm leading-6 text-dark-lighter">
                      Kaydettiginiz adresler sipariste secilebilir.
                    </div>
                  </div>
                </div>

                <div className="gm-sticky-bar rounded-[24px] p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <SecondaryButton type="button" className="w-full justify-center sm:w-auto" onClick={resetForm}>
                      Vazgec
                    </SecondaryButton>
                    <PrimaryButton type="submit" className="w-full justify-center sm:flex-1" disabled={actionLoading}>
                      {actionLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Kaydediliyor
                        </>
                      ) : editingId ? (
                        'Adresi guncelle'
                      ) : (
                        'Adresi kaydet'
                      )}
                    </PrimaryButton>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                {error && (
                  <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Toplam</p>
                    <h4 className="mt-2 text-2xl font-bold text-dark">{addresses.length} kayitli adres</h4>
                  </div>
                  <PrimaryButton type="button" className="justify-center sm:w-auto" onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4" />
                    Yeni adres ekle
                  </PrimaryButton>
                </div>

                {addresses.length === 0 ? (
                  <div className="gm-panel-muted flex min-h-[320px] flex-col items-center justify-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-card">
                      <BookOpen className="h-9 w-9 text-primary" />
                    </div>
                    <h4 className="mt-6 text-2xl font-bold text-dark">Kayitli adres bulunmuyor</h4>
                    <p className="mt-3 max-w-md text-sm leading-6 text-dark-lighter">Yeni bir adres ekleyin.</p>
                    <PrimaryButton type="button" className="mt-6" onClick={() => setShowAddForm(true)}>
                      <Plus className="h-4 w-4" />
                      Ilk adresi ekle
                    </PrimaryButton>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address.Id}
                        className={`rounded-[28px] border p-5 shadow-card transition-all ${
                          address.IsDefault
                            ? 'border-primary/20 bg-white'
                            : 'border-white/70 bg-white/92'
                        } ${onSelectAddress ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover' : ''}`}
                        onClick={onSelectAddress ? () => handleSelectForOrder(address) : undefined}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary text-white shadow-lg shadow-primary/20">
                                <MapPin className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-lg font-bold text-dark">{address.AddressName}</p>
                                <div className="flex flex-wrap gap-2">
                                  {address.IsDefault && (
                                    <span className="gm-badge gm-badge-primary">
                                      <Check className="h-3 w-3" />
                                      Varsayilan
                                    </span>
                                  )}
                                  {onSelectAddress && (
                                    <span className="gm-badge gm-badge-success">Sipariste kullan</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className="text-sm leading-6 text-dark-lighter">{address.FullAddress}</p>
                          </div>

                          <div
                            className="flex flex-wrap items-center gap-2 sm:justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onSelectAddress ? (
                              <PrimaryButton type="button" className="justify-center" onClick={() => handleSelectForOrder(address)}>
                                Adresi sec
                              </PrimaryButton>
                            ) : (
                              <>
                                {!address.IsDefault && (
                                  <SecondaryButton
                                    type="button"
                                    className="justify-center"
                                    disabled={actionLoading}
                                    onClick={() => handleSetDefault(address.Id)}
                                  >
                                    Varsayilan yap
                                  </SecondaryButton>
                                )}
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 rounded-2xl border border-surface-border bg-surface-muted px-4 py-3 text-sm font-bold text-dark transition-all hover:bg-white"
                                  onClick={() => handleEdit(address)}
                                  disabled={actionLoading}
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Duzenle
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition-all hover:bg-red-100"
                                  onClick={() => handleDelete(address.Id)}
                                  disabled={actionLoading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Sil
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLocationModal && (
        <Suspense fallback={null}>
          <LocationPickerModal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            onConfirm={handleLocationConfirm}
          />
        </Suspense>
      )}
    </>
  );
}

export default AddressManager;
