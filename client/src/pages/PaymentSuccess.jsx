import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import { getPaymentStatus } from '../services/api';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('transactionId');
  const orderId = searchParams.get('orderId');
  const isOffline = searchParams.get('offline') === '1';
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Offline ödeme için transactionId kontrolü yapma
    if (isOffline) {
      setLoading(false);
      return;
    }
    
    // Ödeme durumunu kontrol et
    if (transactionId) {
      getPaymentStatus(transactionId)
        .then((response) => {
          if (response.success) {
            setPaymentData(response.data);
          }
        })
        .catch((error) => {
          console.error('Ödeme durumu sorgulanamadı:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [transactionId, isOffline]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/40 p-8 text-center animate-fadeIn">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isOffline ? 'Sipariş Onaylandı! ✅' : 'Ödeme Başarılı! ✅'}
          </h1>
          <p className="text-gray-600">
            {isOffline 
              ? 'Siparişiniz onaylandı. Kapıda ödeme yapabilirsiniz.'
              : 'Ödemeniz başarıyla alındı. Siparişiniz işleme alındı.'}
          </p>
        </div>

        {loading ? (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-500">Yükleniyor...</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            {isOffline ? (
              <>
                {orderId && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">Sipariş Numaranız</p>
                    <p className="text-lg font-bold text-gray-800 font-mono mb-4">
                      #{orderId}
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-500 mt-4">
                  Kapıda ödeme seçtiğiniz için ödeme kurye geldiğinde alınacaktır.
                </p>
              </>
            ) : (
              <>
                {paymentData && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">İşlem Numaranız</p>
                    <p className="text-xl font-bold text-primary mb-4 font-mono">
                      {paymentData.paymentTransactionId || transactionId}
                    </p>
                    {paymentData.orderNumber && (
                      <>
                        <p className="text-sm text-gray-600 mb-2 mt-4">Sipariş Numaranız</p>
                        <p className="text-lg font-bold text-gray-800 font-mono">
                          {paymentData.orderNumber}
                        </p>
                      </>
                    )}
                  </>
                )}
                {!paymentData && transactionId && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">İşlem Numaranız</p>
                    <p className="text-xl font-bold text-primary font-mono">
                      {transactionId}
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-500 mt-4">
                  Ödeme onay belgeniz e-posta adresinize gönderilecektir.
                </p>
              </>
            )}
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold text-green-800 mb-1">
                {isOffline ? 'Sipariş Onaylandı' : 'Ödeme Onaylandı'}
              </h3>
              <p className="text-sm text-green-700">
                {isOffline
                  ? 'Siparişiniz kaydedildi. Kurye geldiğinde ödemenizi yapabilirsiniz.'
                  : 'Kartınızdan tutar çekilmiştir. Siparişiniz hazırlanmaya başlanacaktır.'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-left mb-6">
          {!isOffline && (
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Ödeme Tamamlandı</h3>
                <p className="text-sm text-gray-600">Kartınızdan tutar başarıyla çekildi</p>
              </div>
            </div>
          )}
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-sm font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Sipariş Onaylandı</h3>
              <p className="text-sm text-gray-600">Siparişiniz alındı ve kayıt edildi</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gray-600 text-sm font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Hazırlanıyor</h3>
              <p className="text-sm text-gray-600">Siparişiniz mutfağa iletildi</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Not:</strong> Siparişinizle ilgili herhangi bir sorun yaşarsanız, 
            lütfen bizimle iletişime geçin. Sipariş numaranızı saklamayı unutmayın.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Ana Sayfaya Dön</span>
          </button>
          {orderId && (
            <button
              onClick={() => navigate(`/my-orders`)}
              className="flex-1 bg-white border-2 border-primary text-primary py-3 rounded-xl font-bold hover:bg-primary/5 transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Siparişlerim</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;

