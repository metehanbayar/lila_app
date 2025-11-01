import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import Loading from '../../components/Loading';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponStats,
} from '../../services/adminApi';
import {
  Percent,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  Gift,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  ShoppingBag,
} from 'lucide-react';

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [statsModal, setStatsModal] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumAmount: '0',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    displayTitle: '',
    displaySubtitle: '',
    bgColor: 'purple',
    iconType: 'gift',
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await getCoupons();
      if (response.success) {
        setCoupons(response.data);
      }
    } catch (err) {
      console.error('Kuponlar yüklenirken hata:', err);
      setError('Kuponlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.Code,
        description: coupon.Description || '',
        discountType: coupon.DiscountType,
        discountValue: coupon.DiscountValue.toString(),
        minimumAmount: coupon.MinimumAmount.toString(),
        maxDiscount: coupon.MaxDiscount ? coupon.MaxDiscount.toString() : '',
        usageLimit: coupon.UsageLimit ? coupon.UsageLimit.toString() : '',
        validFrom: coupon.ValidFrom ? new Date(coupon.ValidFrom).toISOString().slice(0, 16) : '',
        validUntil: coupon.ValidUntil ? new Date(coupon.ValidUntil).toISOString().slice(0, 16) : '',
        isActive: coupon.IsActive,
        displayTitle: coupon.DisplayTitle || '',
        displaySubtitle: coupon.DisplaySubtitle || '',
        bgColor: coupon.BgColor || 'purple',
        iconType: coupon.IconType || 'gift',
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minimumAmount: '0',
        maxDiscount: '',
        usageLimit: '',
        validFrom: '',
        validUntil: '',
        isActive: true,
        displayTitle: '',
        displaySubtitle: '',
        bgColor: 'purple',
        iconType: 'gift',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minimumAmount: parseFloat(formData.minimumAmount) || 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        isActive: formData.isActive,
        displayTitle: formData.displayTitle.trim() || null,
        displaySubtitle: formData.displaySubtitle.trim() || null,
        bgColor: formData.bgColor,
        iconType: formData.iconType,
      };

      let response;
      if (editingCoupon) {
        response = await updateCoupon(editingCoupon.Id, data);
      } else {
        response = await createCoupon(data);
      }

      if (response.success) {
        await loadCoupons();
        handleCloseModal();
      }
    } catch (err) {
      console.error('Kupon kaydedilirken hata:', err);
      alert(err.response?.data?.message || 'Kupon kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const response = await deleteCoupon(id);
      if (response.success) {
        await loadCoupons();
      }
    } catch (err) {
      console.error('Kupon silinirken hata:', err);
      alert(err.response?.data?.message || 'Kupon silinirken bir hata oluştu');
    }
  };

  const handleShowStats = async (coupon) => {
    try {
      const response = await getCouponStats(coupon.Id);
      if (response.success) {
        setStatsModal({ ...coupon, stats: response.data });
      }
    } catch (err) {
      console.error('İstatistikler yüklenirken hata:', err);
      alert('İstatistikler yüklenirken bir hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
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

  const getDiscountText = (coupon) => {
    if (coupon.DiscountType === 'percentage') {
      return `%${coupon.DiscountValue}`;
    }
    return formatCurrency(coupon.DiscountValue);
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    
    if (!coupon.IsActive) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
        <XCircle className="w-3 h-3" /> Pasif
      </span>;
    }

    if (coupon.ValidFrom && new Date(coupon.ValidFrom) > now) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
        <Clock className="w-3 h-3" /> Yakında
      </span>;
    }

    if (coupon.ValidUntil && new Date(coupon.ValidUntil) < now) {
      return <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium flex items-center gap-1">
        <XCircle className="w-3 h-3" /> Süresi Doldu
      </span>;
    }

    if (coupon.UsageLimit && coupon.UsedCount >= coupon.UsageLimit) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
        <XCircle className="w-3 h-3" /> Limit Doldu
      </span>;
    }

    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> Aktif
    </span>;
  };

  const columns = [
    {
      key: 'Code',
      label: 'Kupon Kodu',
      render: (coupon) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-mono font-bold text-sm text-gray-900">{coupon.Code}</div>
            <div className="text-xs text-gray-500">{coupon.Description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'DiscountValue',
      label: 'İndirim',
      render: (coupon) => (
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {getDiscountText(coupon)}
          </div>
          <div className="text-xs text-gray-500">
            {coupon.DiscountType === 'percentage' ? 'Yüzde' : 'Sabit Tutar'}
          </div>
          {coupon.MaxDiscount && (
            <div className="text-xs text-gray-600 mt-1 font-semibold">
              Max: {formatCurrency(coupon.MaxDiscount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'MinimumAmount',
      label: 'Min. Tutar',
      render: (coupon) => formatCurrency(coupon.MinimumAmount),
    },
    {
      key: 'UsageLimit',
      label: 'Kullanım',
      render: (coupon) => (
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">
            {coupon.UsedCount || 0} / {coupon.UsageLimit || '∞'}
          </div>
          <div className="text-xs text-gray-500">
            {coupon.UsageLimit 
              ? `${Math.round((coupon.UsedCount / coupon.UsageLimit) * 100)}% kullanıldı`
              : 'Sınırsız'}
          </div>
        </div>
      ),
    },
    {
      key: 'ValidUntil',
      label: 'Geçerlilik',
      render: (coupon) => (
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" />
            {formatDate(coupon.ValidFrom)}
          </div>
          <div className="text-gray-400">
            - {formatDate(coupon.ValidUntil)}
          </div>
        </div>
      ),
    },
    {
      key: 'IsActive',
      label: 'Durum',
      render: (coupon) => getStatusBadge(coupon),
    },
  ];

  const actions = [
    {
      label: 'İstatistikler',
      icon: BarChart3,
      onClick: handleShowStats,
      variant: 'info',
    },
    {
      label: 'Düzenle',
      icon: Edit2,
      onClick: handleOpenModal,
      variant: 'primary',
    },
    {
      label: 'Sil',
      icon: Trash2,
      onClick: (coupon) => handleDelete(coupon.Id),
      variant: 'danger',
    },
  ];

  if (loading) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Gift className="w-8 h-8 text-purple-600" />
              Kampanyalar & Kuponlar
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Kupon kodlarını ve kampanyaları yönetin
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Yeni Kupon Ekle
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* İstatistikler */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{coupons.length}</div>
            </div>
            <div className="text-sm opacity-90">Toplam Kupon</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">
                {coupons.filter(c => c.IsActive && (!c.ValidUntil || new Date(c.ValidUntil) > new Date())).length}
              </div>
            </div>
            <div className="text-sm opacity-90">Aktif Kupon</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">
                {coupons.reduce((sum, c) => sum + (c.UsedCount || 0), 0)}
              </div>
            </div>
            <div className="text-sm opacity-90">Toplam Kullanım</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">
                {coupons.filter(c => !c.IsActive || (c.ValidUntil && new Date(c.ValidUntil) < new Date())).length}
              </div>
            </div>
            <div className="text-sm opacity-90">Pasif Kupon</div>
          </div>
        </div>

        {/* Kuponlar Tablosu */}
        <DataTable
          columns={columns}
          data={coupons}
          actions={actions}
          emptyMessage="Henüz kupon eklenmemiş"
          emptyIcon={Gift}
        />

        {/* Kupon Ekleme/Düzenleme Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingCoupon ? 'Kupon Düzenle' : 'Yeni Kupon Ekle'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kupon Kodu */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kupon Kodu *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 font-mono uppercase"
                placeholder="ORNEK2024"
                required
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">Büyük harflerle, boşluksuz yazın</p>
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Açıklama (Admin için)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 resize-none"
                placeholder="Kampanya açıklaması..."
                rows={2}
                maxLength={500}
              />
            </div>

            {/* Görünüm Ayarları */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Anasayfa Görünümü
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Display Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Başlık (Anasayfada Gösterilecek)
                  </label>
                  <input
                    type="text"
                    value={formData.displayTitle}
                    onChange={(e) => setFormData({ ...formData, displayTitle: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0"
                    placeholder="örn: İlk Siparişe Özel"
                    maxLength={200}
                  />
                </div>

                {/* Display Subtitle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alt Başlık
                  </label>
                  <input
                    type="text"
                    value={formData.displaySubtitle}
                    onChange={(e) => setFormData({ ...formData, displaySubtitle: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0"
                    placeholder="örn: Yeni üyelere fırsat"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Renk Seçimi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Arka Plan Rengi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'purple', label: 'Mor', class: 'bg-gradient-to-br from-purple-600 to-pink-500' },
                      { value: 'blue', label: 'Mavi', class: 'bg-gradient-to-br from-blue-600 to-cyan-500' },
                      { value: 'orange', label: 'Turuncu', class: 'bg-gradient-to-br from-orange-600 to-red-500' },
                      { value: 'green', label: 'Yeşil', class: 'bg-gradient-to-br from-green-600 to-emerald-500' },
                    ].map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, bgColor: color.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.bgColor === color.value
                            ? 'border-purple-600 ring-2 ring-purple-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`h-8 ${color.class} rounded-md mb-1`}></div>
                        <p className="text-xs font-medium text-gray-700">{color.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* İkon Seçimi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    İkon
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'gift', label: 'Hediye', icon: Gift },
                      { value: 'shopping-bag', label: 'Çanta', icon: ShoppingBag },
                      { value: 'percent', label: 'Yüzde', icon: Percent },
                      { value: 'award', label: 'Ödül', icon: TrendingUp },
                    ].map((iconOption) => {
                      const IconComponent = iconOption.icon;
                      return (
                        <button
                          key={iconOption.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, iconType: iconOption.value })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.iconType === iconOption.value
                              ? 'border-purple-600 ring-2 ring-purple-200 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <IconComponent className={`w-6 h-6 mx-auto mb-1 ${
                            formData.iconType === iconOption.value ? 'text-purple-600' : 'text-gray-600'
                          }`} />
                          <p className="text-xs font-medium text-gray-700">{iconOption.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* İndirim Tipi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  İndirim Tipi *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0"
                  required
                >
                  <option value="percentage">Yüzde (%)</option>
                  <option value="fixed">Sabit Tutar (₺)</option>
                </select>
              </div>

              {/* İndirim Değeri */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  İndirim Değeri *
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0"
                  placeholder={formData.discountType === 'percentage' ? '20' : '50'}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Minimum Tutar ve Maksimum İndirim */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Sipariş Tutarı (₺)
                </label>
                <input
                  type="number"
                  value={formData.minimumAmount}
                  onChange={(e) => setFormData({ ...formData, minimumAmount: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0"
                  placeholder="0"
                  step="0.01"
                  min="0"
                />
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maksimum İndirim (₺)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0"
                    placeholder="Sınırsız"
                    step="0.01"
                    min="0"
                  />
                </div>
              )}
            </div>

            {/* Kullanım Limiti */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kullanım Limiti
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0"
                placeholder="Sınırsız (boş bırakın)"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">Boş bırakırsanız sınırsız kullanım</p>
            </div>

            {/* Geçerlilik Tarihleri */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Başlangıç Tarihi
                </label>
                <input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bitiş Tarihi
                </label>
                <input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0"
                />
              </div>
            </div>

            {/* Aktif/Pasif */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-700">
                {formData.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>

            {/* Butonlar */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
              >
                {editingCoupon ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </Modal>

        {/* İstatistikler Modal */}
        {statsModal && (
          <Modal
            isOpen={true}
            onClose={() => setStatsModal(null)}
            title={`${statsModal.Code} - İstatistikler`}
          >
            <div className="space-y-6">
              {/* Genel Bilgiler */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-xl text-gray-900">{statsModal.Code}</div>
                    <div className="text-sm text-gray-600">{statsModal.Description}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {getDiscountText(statsModal)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">İndirim Miktarı</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-600">
                      {formatCurrency(statsModal.MinimumAmount)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Min. Sipariş</div>
                  </div>
                </div>
              </div>

              {/* Kullanım İstatistikleri */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {statsModal.stats?.TotalUsages || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Toplam Kullanım</div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {statsModal.stats?.UniqueCustomers || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Benzersiz Kullanıcı</div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(statsModal.stats?.TotalDiscount || 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Toplam İndirim</div>
                </div>
              </div>

              {/* Kullanım Limiti */}
              {statsModal.UsageLimit && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Kullanım Durumu</span>
                    <span className="text-sm font-bold text-gray-900">
                      {statsModal.UsedCount || 0} / {statsModal.UsageLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(((statsModal.UsedCount || 0) / statsModal.UsageLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {statsModal.UsageLimit - (statsModal.UsedCount || 0)} kullanım hakkı kaldı
                  </p>
                </div>
              )}

              {/* Geçerlilik Tarihleri */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Başlangıç
                  </span>
                  <span className="text-sm text-gray-900">{formatDate(statsModal.ValidFrom)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Bitiş
                  </span>
                  <span className="text-sm text-gray-900">{formatDate(statsModal.ValidUntil)}</span>
                </div>
              </div>

              <button
                onClick={() => setStatsModal(null)}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Kapat
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}

export default Coupons;

