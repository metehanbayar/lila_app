import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, LogOut, Mail, MapPin, Phone, Save, Settings, ShoppingBag, User } from 'lucide-react';
import AddressManager from '../../components/AddressManager';
import CustomerShell from '../../components/customer/CustomerShell';
import { getFavorites, getMyOrders, updateProfile } from '../../services/customerApi';
import useCustomerStore from '../../store/customerStore';
import { Badge, Button, Field, SelectField, SurfaceCard, TextInput } from '../../components/ui/primitives';

function Profile() {
  const { customer, updateProfile: updateStoreProfile, logout, setFavorites } = useCustomerStore();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
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
      phone: customer?.phone || '',
      dateOfBirth: customer?.dateOfBirth || '',
      gender: customer?.gender || '',
    });
  }, [customer]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
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
    }
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
      }
    } catch (err) {
      console.error('Profil guncellenemedi:', err);
      alert(err.response?.data?.message || 'Profil guncellenirken bir hata olustu');
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
        description="Hesap bilgileri, hizli erisim alanlari ve adres yonetimi tek shell icinde toplandi."
        actions={
          <Button variant="secondary" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Cikis yap
          </Button>
        }
      >
        <SurfaceCard tone="hero" className="overflow-hidden p-5 sm:p-6 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[auto,1fr,220px] lg:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/20 bg-white/12 text-3xl font-black text-white shadow-lg shadow-black/10">
              {initials}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">Aktif hesap</Badge>
                <Badge className="border border-white/20 bg-white/12 text-white">Musteri paneli</Badge>
              </div>
              <div>
                <h2 className="font-display text-4xl leading-none text-white sm:text-5xl">{customer?.fullName || 'Misafir'}</h2>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/80">
                  {customer?.phone && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </span>
                  )}
                  {customer?.email && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                      <Mail className="h-4 w-4" />
                      {customer.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link to="/my-orders" className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all hover:bg-white/14">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Siparis</p>
                <p className="mt-2 text-3xl font-black text-white">{ordersCount}</p>
              </Link>
              <Link to="/favorites" className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all hover:bg-white/14">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Favori</p>
                <p className="mt-2 text-3xl font-black text-white">{favoritesCount}</p>
              </Link>
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Profil formu</p>
                <h3 className="text-2xl font-bold text-dark">{editing ? 'Bilgileri duzenle' : 'Hesap ozeti'}</h3>
              </div>
              {!editing && (
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Duzenle
                </Button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ad">
                    <TextInput value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  </Field>
                  <Field label="Soyad">
                    <TextInput value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  </Field>
                </div>

                <Field label="Telefon" hint="Giris icin kullanilir.">
                  <TextInput value={formData.phone} disabled />
                </Field>

                <Field label="E-posta">
                  <TextInput type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Dogum tarihi">
                    <TextInput type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
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
                      setEditing(false);
                      setFormData({
                        firstName: customer?.fullName?.split(' ')[0] || '',
                        lastName: customer?.fullName?.split(' ').slice(1).join(' ') || '',
                        email: customer?.email || '',
                        phone: customer?.phone || '',
                        dateOfBirth: customer?.dateOfBirth || '',
                        gender: customer?.gender || '',
                      });
                    }}
                  >
                    Iptal
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4">
                <InfoRow icon={User} label="Ad soyad" value={customer?.fullName || '-'} />
                <InfoRow icon={Phone} label="Telefon" value={customer?.phone || '-'} />
                <InfoRow icon={Mail} label="E-posta" value={customer?.email || '-'} />
                <InfoRow icon={Settings} label="Cinsiyet" value={customer?.gender || '-'} />
              </div>
            )}
          </SurfaceCard>

          <div className="grid gap-5">
            <SurfaceCard tone="muted" className="p-5 sm:p-6">
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Hizli erisim</p>
                <h3 className="text-2xl font-bold text-dark">Yonetim kartlari</h3>
              </div>
              <div className="grid gap-3">
                <QuickLink to="/my-orders" icon={ShoppingBag} title="Siparislerim" description="Tum siparis gecmisini gor." />
                <QuickLink to="/favorites" icon={Heart} title="Favorilerim" description="Begendigin urunlere don." />
                <button
                  onClick={() => setShowAddressManager(true)}
                  className="flex items-start gap-3 rounded-[24px] border border-surface-border bg-white px-4 py-4 text-left transition-all hover:border-primary/20 hover:shadow-card"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-bold text-dark">Adreslerim</p>
                    <p className="mt-1 text-sm leading-6 text-dark-lighter">Kayitli teslimat adreslerini yonet.</p>
                  </div>
                </button>
              </div>
            </SurfaceCard>

            {customer?.referralCode && (
              <SurfaceCard className="p-5 sm:p-6">
                <div className="mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Davet</p>
                  <h3 className="text-2xl font-bold text-dark">Davet kodun</h3>
                </div>
                <div className="rounded-[24px] bg-surface-muted p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <code className="text-xl font-black tracking-[0.18em] text-primary-dark">{customer.referralCode}</code>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(customer.referralCode);
                        alert('Davet kodu kopyalandi');
                      }}
                    >
                      Kopyala
                    </Button>
                  </div>
                </div>
              </SurfaceCard>
            )}
          </div>
        </div>
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
    <Link to={to} className="flex items-start gap-3 rounded-[24px] border border-surface-border bg-white px-4 py-4 transition-all hover:border-primary/20 hover:shadow-card">
      <span className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-base font-bold text-dark">{title}</p>
        <p className="mt-1 text-sm leading-6 text-dark-lighter">{description}</p>
      </div>
    </Link>
  );
}

export default Profile;
