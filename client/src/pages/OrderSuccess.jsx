import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';

function OrderSuccess() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Confetti effect (optional)
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fadeIn">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sipariş Alındı! 🎉
          </h1>
          <p className="text-gray-600">
            Siparişiniz başarıyla oluşturuldu ve en kısa sürede işleme alınacak.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Sipariş Numaranız</p>
          <p className="text-2xl font-bold text-primary">{orderNumber}</p>
          <p className="text-xs text-gray-500 mt-2">
            Bu numarayı kaydedin, siparişinizi takip etmek için kullanabilirsiniz
          </p>
        </div>

        <div className="space-y-3 text-left mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-sm font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Sipariş Onaylandı</h3>
              <p className="text-sm text-gray-600">Siparişiniz alındı ve kayıt edildi</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gray-600 text-sm font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Hazırlanıyor</h3>
              <p className="text-sm text-gray-600">Siparişiniz mutfağa iletildi</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gray-600 text-sm font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Teslim Edilecek</h3>
              <p className="text-sm text-gray-600">Siparişiniz yolda</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Not:</strong> Siparişinizle ilgili herhangi bir sorun yaşarsanız, 
            lütfen bizimle iletişime geçin.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
        >
          <Home className="w-5 h-5" />
          <span>Ana Sayfaya Dön</span>
        </button>
      </div>
    </div>
  );
}

export default OrderSuccess;

