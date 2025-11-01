import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, Home, RotateCw as RefreshCw, CreditCard } from 'lucide-react';

function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorParam = searchParams.get('error');
  const orderId = searchParams.get('orderId');

  // Error parametresini decode et
  const error = errorParam ? decodeURIComponent(errorParam) : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [error, orderId]);

  const handleRetry = () => {
    // Sipariş varsa checkout'a geri dön
    if (orderId) {
      navigate('/checkout', { state: { retry: true, orderId } });
    } else {
      navigate('/cart');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/40 p-8 text-center animate-fadeIn">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Ödeme Başarısız ❌
          </h1>
          <p className="text-gray-600">
            Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Hata Mesajı</h3>
          <p className="text-sm text-red-700">
            {error || 'Ödeme işlemi sırasında bir hata oluştu.'}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-yellow-800 mb-2 flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Olası Nedenler</span>
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>Kart bilgileri hatalı olabilir</li>
            <li>Kart limiti yetersiz olabilir</li>
            <li>İnternet bağlantınızı kontrol edin</li>
            <li>Bankanız ek doğrulama istemiş olabilir</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Not:</strong> Kartınızdan herhangi bir tutar çekilmemiştir. 
            Tekrar deneyebilir veya farklı bir ödeme yöntemi kullanabilirsiniz.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Tekrar Dene</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Ana Sayfaya Dön</span>
          </button>
        </div>

        {orderId && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">
              Sipariş ID: <span className="font-mono">{orderId}</span>
            </p>
            <p className="text-xs text-gray-500">
              Siparişiniz kaydedilmiştir. Ödeme tamamlandığında işleme alınacaktır.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentFailure;

