import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Package, MapPin, Phone, User, Calendar, FileText, ShoppingCart, Loader2, Check } from 'lucide-react';
import { getMyOrderDetail } from '../../services/customerApi';
import { getProductById } from '../../services/api';
import useCartStore from '../../store/cartStore';
import AppLayout from '../../components/AppLayout';
import Loading from '../../components/Loading';
import { safeSetTimeout } from '../../utils/performance';

function OrderDetail() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  useEffect(() => {
    loadOrderDetail();
  }, [orderNumber]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await getMyOrderDetail(orderNumber);
      if (response.success) {
        setOrder(response.data.order);
        setItems(response.data.items);
      }
    } catch (err) {
      console.error('Sipariş detayı yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status) => {
    const statuses = {
      Pending: { label: 'Beklemede', color: 'yellow', description: 'Siparişiniz alındı, onay bekleniyor' },
      Confirmed: { label: 'Onaylandı', color: 'blue', description: 'Siparişiniz onaylandı' },
      Preparing: { label: 'Hazırlanıyor', color: 'purple', description: 'Siparişiniz hazırlanıyor' },
      Delivered: { label: 'Teslim Edildi', color: 'green', description: 'Siparişiniz teslim edildi' },
      Cancelled: { label: 'İptal', color: 'red', description: 'Sipariş iptal edildi' },
    };
    return statuses[status] || statuses.Pending;
  };

  const handleReorder = async () => {
    setReorderLoading(true);
    let count = 0;
    
    try {
      // Her bir sipariş item için ürün bilgisini al ve sepete ekle
      for (const item of items) {
        const productResponse = await getProductById(item.ProductId);
        
        if (productResponse.success) {
          const product = productResponse.data;
          
          // Eğer varyant varsa bul
          let selectedVariant = null;
          if (item.VariantId && product.variants && product.variants.length > 0) {
            selectedVariant = product.variants.find(v => v.Id === item.VariantId);
          }
          
          // Ürünü siparişteki miktar kadar sepete ekle
          addItem(product, selectedVariant, item.Quantity);
          count += item.Quantity;
        }
      }
      
      setAddedCount(count);
      setShowToast(true);
    } catch (error) {
      console.error('Tekrar sipariş hatası:', error);
      alert('Ürünler sepete eklenirken bir hata oluştu');
    } finally {
      setReorderLoading(false);
    }
  };

  // Toast otomatik kapan
  useEffect(() => {
    if (showToast) {
      const timer = safeSetTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="px-2 sm:px-3 lg:px-4 py-8 sm:py-12 text-center">
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">Sipariş bulunamadı</p>
          <Link to="/my-orders" className="text-xs sm:text-sm text-primary hover:text-primary-dark mt-3 sm:mt-4 inline-block">
            ← Siparişlerime Dön
          </Link>
        </div>
      </AppLayout>
    );
  }

  const statusInfo = getStatusInfo(order.Status);

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-2 sm:top-4 right-2 sm:right-4 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 z-[100] animate-slideInRight max-w-[85%] sm:max-w-sm">
          <div className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Check className="w工具的-5 sm:w-6 sm:h-6 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5 sm:mb-1">Sepete Eklendi!</h4>
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                {addedCount} ürün sepete eklendi
              </p>
              <button
                onClick={() => {
                  setShowToast(false);
                  safeSetTimeout(() => navigate('/cart'), 300);
                }}
                className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sepete Git →
              </button>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Kapat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <AppLayout>
      <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-4 lg:py-6">
        <div className="w-full max-w-full sm:max-w-[95%] lg:max-w-[90%] xl:max-w-3xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Sipariş Detayı</h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-0.5 sm:mt-1">
              Sipariş No: <span className="font-semibold text-primary">{order.OrderNumber}</span>
            </p>
          </div>

          {/* Status */}
          <div className={`bg-${statusInfo.color}-50 border border-${statusInfo.color}-200 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5`}>
            <div className="flex items-start gap-2 sm:gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${statusInfo.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Package className={`text-${statusInfo.color}-600`} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm sm:text-base lg:text-lg font-semibold text-${statusInfo.color}-800`}>
                  {statusInfo.label}
                </h3>
                <p className={`text-xs sm:text-sm text-${statusInfo.color}-700 mt-0.5 sm:mt-1`}>
                  {statusInfo.description}
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-${statusInfo.color}-600">
                  <Calendar size={12} />
                  <span>{formatDate(order.CreatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-3 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Müşteri Bilgileri</h2>
            
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500">Ad Soyad</p>
                  <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 mt-0.5 break-words">
                    {order.CustomerName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500">Telefon</p>
                  <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 mt-0.5 break-words">
                    {order.CustomerPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500">Teslimat Adresi</p>
                  <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 mt-0.5 break-words">
                    {order.CustomerAddress}
                  </p>
                </div>
              </div>

              {order.Notes && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500">Notlar</p>
                    <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 mt-0.5 break-words">
                      {order.Notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-3 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Sipariş Ürünleri</h2>
            
            <div className="space-y-2.5 sm:space-y-3">
              {items.map((item) => (
                <div key={item.Id} className="flex justify-between items-start gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 break-words">
                      {item.ProductName}
                      {item.VariantName && <span className="text-gray-600"> ({item.VariantName})</span>}
                    </h3>
                    <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 mt-0.5 sm:mt-1">
                      {formatCurrency(item.ProductPrice)} x {item.Quantity}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 flex-shrink-0">
                    {formatCurrency(item.Subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">Toplam</span>
                <span className="text-base sm:text-lg lg:text-2xl font-bold text-primary">
                  {formatCurrency(order.TotalAmount)}
                </span>
              </div>
            </div>

            {/* Tekrar Sipariş Et Butonu */}
            <button
              onClick={handleReorder}
              disabled={reorderLoading}
              className="w-full mt-3 sm:mt-4 bg-secondary hover:bg-green-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg flex items-center justify-center space-x-1.5 sm:space-x-2 transition-colors duration-200 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reorderLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Sepete Ekleniyor...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Aynısını Tekrar Sipariş Et</span>
                </>
              )}
            </button>
          </div>

          {/* Back Link */}
          <div className="text-center pt-3 sm:pt-4">
            <Link
              to="/my-orders"
              className="text-xs sm:text-sm text-gray-600 hover:text-primary transition-colors"
            >
              ← Siparişlerime Dön
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
    </>
  );
}

export default OrderDetail;

