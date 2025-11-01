import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  ShoppingBag, 
  Edit2, 
  Heart, 
  BookMarked,
  Calendar,
  UserCheck,
  MapPin,
  LogOut,
  TrendingUp,
  Award,
  Settings,
  Share2
} from 'lucide-react';
import useCustomerStore from '../../store/customerStore';
import { updateProfile, getFavorites, getMyOrders } from '../../services/customerApi';
import AppLayout from '../../components/AppLayout';
import AddressManager from '../../components/AddressManager';

function Profile() {
  const { customer, updateProfile: updateStoreProfile, logout, setFavorites } = useCustomerStore();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: (customer?.fullName?.split(' ')[0] || ''),
    lastName: (customer?.fullName?.split(' ').slice(1).join(' ') || ''),
    email: customer?.email || '',
    phone: customer?.phone || '',
    dateOfBirth: customer?.dateOfBirth || '',
    gender: customer?.gender || '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [favoritesRes, ordersRes] = await Promise.all([
        getFavorites(),
        getMyOrders(1, 1)
      ]);
      
      if (favoritesRes.success) {
        setFavoritesCount(favoritesRes.data.length);
        const favoriteIds = favoritesRes.data.map(p => p.Id);
        setFavorites(favoriteIds);
      }
      
      if (ordersRes.success) {
        setOrdersCount(ordersRes.total || 0);
      }
    } catch (err) {
      console.error('Veriler yüklenemedi:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const dataToSend = { 
        fullName, 
        email: formData.email,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null
      };
      
      const response = await updateProfile(dataToSend);
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

  const initials = customer?.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'K';

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
          <div className="px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* User Profile Card */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-2 border-white/30">
                      {initials}
                    </div>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary shadow-md rounded-full flex items-center justify-center hover:scale-110 transition-transform border-2 border-white"
                      >
                        <Edit2 size={14} className="text-white" />
                      </button>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    {!editing ? (
                      <>
                        <h1 className="text-2xl font-bold mb-1">{customer?.fullName || 'Misafir'}</h1>
                        <div className="flex flex-wrap gap-3 text-sm">
                          {customer?.phone && (
                            <div className="flex items-center gap-1.5 text-white/90">
                              <Phone size={14} />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer?.email && (
                            <div className="flex items-center gap-1.5 text-white/90">
                              <Mail size={14} />
                              <span className="truncate max-w-[200px]">{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="Ad"
                            className="px-3 py-2 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-white"
                          />
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Soyad"
                            className="px-3 py-2 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-white"
                          />
                        </div>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="E-posta (Opsiyonel)"
                          className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-white"
                        />
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          placeholder="Doğum Tarihi"
                          className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-white"
                        />
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-white"
                        >
                          <option value="">Cinsiyet Seçin</option>
                          <option value="Male">Erkek</option>
                          <option value="Female">Kadın</option>
                          <option value="Other">Diğer</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(false);
                              setFormData({
                                firstName: (customer?.fullName?.split(' ')[0] || ''),
                                lastName: (customer?.fullName?.split(' ').slice(1).join(' ') || ''),
                                email: customer?.email || '',
                                phone: customer?.phone || '',
                                dateOfBirth: customer?.dateOfBirth || '',
                                gender: customer?.gender || '',
                              });
                            }}
                            className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                          >
                            İptal
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            disabled={saveLoading}
                            className="flex-1 px-4 py-2 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm font-medium"
                          >
                            {saveLoading ? 'Kaydediliyor...' : 'Kaydet'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 -mt-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
            <Link
              to="/my-orders"
              className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="text-white" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold text-gray-900">{ordersCount}</p>
                  <p className="text-xs text-gray-600">Sipariş</p>
                </div>
              </div>
            </Link>

            <Link
              to="/favorites"
              className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Heart className="text-white" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold text-gray-900">{favoritesCount}</p>
                  <p className="text-xs text-gray-600">Favori</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Hızlı Erişim</h2>
              <div className="grid grid-cols-1 gap-3">
                <Link
                  to="/my-orders"
                  className="group bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                    <ShoppingBag className="text-primary" size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Siparişlerim</h3>
                    <p className="text-sm text-gray-600">Tüm sipariş geçmişiniz</p>
                  </div>
                  <div className="text-2xl text-gray-300 group-hover:text-primary transition-colors">→</div>
                </Link>

                <Link
                  to="/favorites"
                  className="group bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-colors">
                    <Heart className="text-red-500" size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Favorilerim</h3>
                    <p className="text-sm text-gray-600">Beğendiğiniz ürünler</p>
                  </div>
                  <div className="text-2xl text-gray-300 group-hover:text-red-500 transition-colors">→</div>
                </Link>

                <button
                  onClick={() => setShowAddressManager(true)}
                  className="group bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <MapPin className="text-blue-600" size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Adreslerim</h3>
                    <p className="text-sm text-gray-600">Kayıtlı adreslerinizi yönetin</p>
                  </div>
                  <div className="text-2xl text-gray-300 group-hover:text-blue-600 transition-colors">→</div>
                </button>

                <Link
                  to="/"
                  className="group bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500 transition-colors">
                    <ShoppingBag className="text-green-600" size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Yeni Sipariş</h3>
                    <p className="text-sm text-gray-600">Menüye göz atın ve sipariş verin</p>
                  </div>
                  <div className="text-2xl text-gray-300 group-hover:text-green-600 transition-colors">→</div>
                </Link>
              </div>
            </div>

            {/* Referral Code */}
            {customer?.referralCode && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Arkadaş Davet Et</h2>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 size={20} />
                        <h3 className="font-bold text-lg">Davet Kodum</h3>
                      </div>
                      <p className="text-sm opacity-90 mb-3">Arkadaşlarınızı davet edin ve ödüller kazanın!</p>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                        <code className="text-xl font-bold tracking-wider">{customer.referralCode}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(customer.referralCode);
                            alert('Davet kodu kopyalandı!');
                          }}
                          className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors"
                        >
                          Kopyala
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="text-gray-600" size={20} />
                <h2 className="text-lg font-bold text-gray-800">Hesap Ayarları</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User className="text-gray-600" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">Ad Soyad</p>
                    <p className="text-sm font-medium text-gray-900">{customer?.fullName || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Phone className="text-gray-600" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">Telefon</p>
                    <p className="text-sm font-medium text-gray-900">{customer?.phone || '-'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Giriş için kullanılır</p>
                  </div>
                </div>

                {customer?.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Mail className="text-gray-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">E-posta</p>
                      <p className="text-sm font-medium text-gray-900 break-all">{customer.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <LogOut size={20} />
              <span>Çıkış Yap</span>
            </button>
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

