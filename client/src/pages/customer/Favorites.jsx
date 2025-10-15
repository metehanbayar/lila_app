import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Loader2 } from 'lucide-react';
import { getFavorites } from '../../services/customerApi';
import useCustomerStore from '../../store/customerStore';
import ProductCard from '../../components/ProductCard';
import ProductDetailModal from '../../components/ProductDetailModal';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';

function Favorites() {
  const navigate = useNavigate();
  const { setFavorites } = useCustomerStore();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await getFavorites();
      if (response.success) {
        setFavoriteProducts(response.data);
        // Store'a favori ID'leri kaydet
        const favoriteIds = response.data.map(p => p.Id);
        setFavorites(favoriteIds);
      }
    } catch (err) {
      console.error('Favoriler yüklenemedi:', err);
      setError('Favorileriniz yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handlePreviousProduct = () => {
    const currentIndex = favoriteProducts.findIndex(p => p.Id === selectedProduct?.Id);
    if (currentIndex > 0) {
      setSelectedProduct(favoriteProducts[currentIndex - 1]);
    }
  };

  const handleNextProduct = () => {
    const currentIndex = favoriteProducts.findIndex(p => p.Id === selectedProduct?.Id);
    if (currentIndex < favoriteProducts.length - 1) {
      setSelectedProduct(favoriteProducts[currentIndex + 1]);
    }
  };

  const canGoPrevious = () => {
    const currentIndex = favoriteProducts.findIndex(p => p.Id === selectedProduct?.Id);
    return currentIndex > 0;
  };

  const canGoNext = () => {
    const currentIndex = favoriteProducts.findIndex(p => p.Id === selectedProduct?.Id);
    return currentIndex < favoriteProducts.length - 1;
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Henüz Favori Ürününüz Yok"
        message="Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz."
        actionText="Menüye Git"
        actionPath="/"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Profile Dön</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-3 rounded-xl">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Favorilerim</h1>
              <p className="text-gray-600 mt-1">{favoriteProducts.length} favori ürün</p>
            </div>
          </div>
        </div>

        {/* Favori Ürünler Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard
              key={product.Id}
              product={product}
              onProductClick={handleProductClick}
            />
          ))}
        </div>
      </div>

      {/* Ürün Detay Modalı */}
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onPrevious={handlePreviousProduct}
        onNext={handleNextProduct}
        canGoPrevious={canGoPrevious()}
        canGoNext={canGoNext()}
      />
    </div>
  );
}

export default Favorites;

