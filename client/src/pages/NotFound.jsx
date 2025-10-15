import { useNavigate } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <Search className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Sayfa Bulunamadı
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            Ana sayfaya dönmek için aşağıdaki butonu kullanabilirsiniz.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center space-x-2 mx-auto"
        >
          <Home className="w-5 h-5" />
          <span>Ana Sayfaya Dön</span>
        </button>
      </div>
    </div>
  );
}

export default NotFound;

