import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, LogOut, Mail, MapPin, Phone, Save, Settings, ShoppingBag, User } from 'lucide-react';
import AddressManager from '../../components/AddressManager';
import CustomerShell from '../../components/customer/CustomerShell';
import Loading from '../../components/Loading';
import { getFavorites, getMyOrders, updateProfile } from '../../services/customerApi';
import useCustomerStore from '../../store/customerStore';
import { formatTurkishPhoneInput } from '../../utils/phone';
import { Badge, Button, Field, SelectField, SurfaceCard, TextInput } from '../../components/ui/primitives';

function Profile() {
  const { customer, updateProfile: updateStoreProfile, logout, setFavorites } = useCustomerStore();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [feedback, setFeedback] = useState({ tone: '', message: '' });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
  });

  useEffect(() => {
    setFormData({
      firstName: customer?.fullName?.split(' ')[0] || '',
      lastName: customer?.fullName?.split(' ').slice(1).join(' ') || '',
      email: customer?.email || '',
      phone: formatTurkishPhoneInput(customer?.phone || ''),
      dateOfBirth: customer?.dateOfBirth || '',
      gender: customer?.gender || '',
    });
  }, [customer]);

  useEffect(() => {
    if (!feedback.message) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFeedback({ tone: '', message: '' });
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setPageLoading(true);
      const [favoritesRes, ordersRes] = await Promise.all([getFavorites(), getMyOrders(1, 1)]);

      if (favoritesRes.success) {
        setFavoritesCount(favoritesRes.data.length);
        setFavorites(favoritesRes.data.map((product) => product.Id));
      }

      if (ordersRes.success) {
        setOrdersCount(ordersRes.total || 0);
      }
    } catch (err) {
      console.error('Veriler yuklenemedi:', err);
    } finally {
      setPageLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: customer?.fullName?.split(' ')[0] || '',
      lastName: customer?.fullName?.split(' ').slice(1).join(' ') || '',
      email: customer?.email || '',
      phone: formatTurkishPhoneInput(customer?.phone || ''),
      dateOfBirth: customer?.dateOfBirth || '',
      gender: customer?.gender || '',
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const response = await updateProfile({
        fullName,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
      });

      if (response.success) {
        updateStoreProfile(response.data);
        setEditing(false);
        setFeedback({ tone: 'success', message: 'Profil guncellendi.' });
      }
    } catch (err) {
      console.error('Profil guncellenemedi:', err);
      setFeedback({
        tone: 'error',
        message: err.response?.data?.message || 'Profil guncellenirken bir hata olustu',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const initials =
    customer?.fullName
      ?.split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'GM';

  return (
    <>
      <CustomerShell
        title={customer?.fullName || 'Profil'}
        description="Hesap bilgileri."
        actions={
          <Button variant="secondary" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Cikis yap
          </Button>
        }
      >
        {pageLoading ? (
          <SurfaceCard tone="muted" className="p-6">
            <Loading message="Profil hazirlaniyor..." />
          </SurfaceCard>
        ) : (
          <>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary text-xl font-black text-white shadow-lg shadow-primary/20">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">Aktif hesap</Badge>
                <Badge tone="primary">Musteri</Badge>
              </div>
              <p className="mt-2 text-lg font-black text-dark sm:text-xl">{customer?.fullName || 'Misafir'}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-dark-lighter">
                {customer?.phone && <span className="rounded-full bg-surface-muted px-3 py-2">{formatTurkishPhoneInput(customer.phone)}</span>}
                {customer?.email && <span className="rounded-full bg-surface-muted px-3 py-2">{customer.email}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link to="/my-orders" className="rounded-[20px] bg-surface-muted px-4 py-3 text-center transition-all hover:bg-white hover:shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Siparis</p>
              <p className="mt-1 text-xl font-black text-dark">{ordersCount}</p>
            </Link>
            <Link to="/favorites" className="rounded-[20px] bg-surface-muted px-4 py-3 text-center transition-all hover:bg-white hover:shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Favori</p>
              <p className="mt-1 text-xl font-black text-dark">{favoritesCount}</p>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
          <SurfaceCard className="p-5 sm:p-6">
            {feedback.message && (
              <div className={`mb-4 rounded-[22px] px-4 py-3 text-sm font-medium ${feedback.tone === 'error' ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {feedback.message}
              </div>
            )}

            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Profil</p>
                <h2 className="mt-1 text-xl font-bold text-dark">{editing ? 'Bilgileri duzenle' : 'Hesap bilgileri'}</h2>
              </div>
              {!editing && (
                <Button variant="secondary" onClick={() => {
                  setFeedback({ tone: '', message: '' });
                  setEditing(true);
                }}>
                  Duzenle
                </Button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ad">
                    <TextInput autoComplete="given-name" enterKeyHint="next" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  </Field>
                  <Field label="Soyad">
                    <TextInput autoComplete="family-name" enterKeyHint="next" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  </Field>
                </div>

                <Field label="Telefon" hint="Giris icin kullanilir.">
                  <TextInput type="tel" inputMode="tel" autoComplete="tel-national" value={formData.phone} disabled />
                </Field>

                <Field label="E-posta">
                  <TextInput type="email" autoComplete="email" enterKeyHint="next" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Dogum tarihi">
                    <TextInput type="date" autoComplete="bday" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                  </Field>
                  <Field label="Cinsiyet">
                    <SelectField value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">Seciniz</option>
                      <option value="Male">Erkek</option>
                      <option value="Female">Kadin</option>
                      <option value="Other">Diger</option>
                    </SelectField>
                  </Field>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" disabled={saveLoading} className="sm:flex-1">
                    <Save className="h-4 w-4" />
                    {saveLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="sm:flex-1"
                    onClick={() => {
                      setFeedback({ tone: '', message: '' });
                      setEditing(false);
                      resetForm();
                    }}
                  >
                    Iptal
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-3">
                <InfoRow icon={User} label="Ad soyad" value={customer?.fullName || '-'} />
                <InfoRow icon={Phone} label="Telefon" value={customer?.phone || '-'} />
                <InfoRow icon={Mail} label="E-posta" value={customer?.email || '-'} />
                <InfoRow icon={Settings} label="Cinsiyet" value={customer?.gender || '-'} />
              </div>
            )}
          </SurfaceCard>

          <div className="grid gap-4">
            <SurfaceCard className="p-5 sm:p-6">
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Hizli islemler</p>
                <h2 className="mt-1 text-xl font-bold text-dark">Kisayollar</h2>
              </div>
              <div className="grid gap-3">
                <QuickLink to="/my-orders" icon={ShoppingBag} title="Siparislerim" description="Tum siparis gecmisini gor." />
                <QuickLink to="/favorites" icon={Heart} title="Favorilerim" description="Kaydettigin urunlere don." />
                <button
                  onClick={() => setShowAddressManager(true)}
                  className="flex items-start gap-3 rounded-[22px] border border-surface-border bg-surface-muted px-4 py-4 text-left transition-all hover:bg-white hover:shadow-card"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-dark">Adreslerim</p>
                    <p className="mt-1 text-sm leading-6 text-dark-lighter">Teslimat adreslerini yonet.</p>
                  </div>
                </button>
              </div>
            </SurfaceCard>

            {customer?.referralCode && (
              <SurfaceCard className="p-5 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Davet kodu</p>
                <div className="mt-3 flex flex-col gap-3 rounded-[22px] bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                  <code className="text-lg font-black tracking-[0.14em] text-primary-dark">{customer.referralCode}</code>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(customer.referralCode);
                        setFeedback({ tone: 'success', message: 'Davet kodu kopyalandi.' });
                      } catch {
                        setFeedback({ tone: 'error', message: 'Davet kodu kopyalanamadi.' });
                      }
                    }}
                  >
                    Kopyala
                  </Button>
                </div>
              </SurfaceCard>
            )}
          </div>
        </div>
          </>
        )}
      </CustomerShell>

      <AddressManager isOpen={showAddressManager} onClose={() => setShowAddressManager(false)} />
    </>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-surface-border bg-surface-muted px-4 py-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white text-primary shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dark-lighter">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-dark">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, description }) {
  return (
    <Link to={to} className="flex items-start gap-3 rounded-[22px] border border-surface-border bg-surface-muted px-4 py-4 transition-all hover:bg-white hover:shadow-card">
      <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-bold text-dark">{title}</p>
        <p className="mt-1 text-sm leading-6 text-dark-lighter">{description}</p>
      </div>
    </Link>
  );
}

export default Profile;
