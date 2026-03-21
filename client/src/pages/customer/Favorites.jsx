import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import CustomerShell from '../../components/customer/CustomerShell';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import ProductDetailModal from '../../components/ProductDetailModal';
import ProductRowCard from '../../components/ProductRowCard';
import { getFavorites } from '../../services/customerApi';
import useCustomerStore from '../../store/customerStore';
import { SurfaceCard } from '../../components/ui/primitives';

function Favorites() {
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
        setFavorites(response.data.map((product) => product.Id));
      }
    } catch (err) {
      console.error('Favoriler yuklenemedi:', err);
      setError('Favoriler yuklenirken bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <CustomerShell title="Favoriler" description="Kaydettigin urunlere buradan hizla donebilirsin.">
      {loading ? (
        <SurfaceCard tone="muted" className="p-6">
          <Loading message="Favoriler yukleniyor..." />
        </SurfaceCard>
      ) : error ? (
        <SurfaceCard tone="muted" className="p-6 text-sm font-medium text-red-600">
          {error}
        </SurfaceCard>
      ) : favoriteProducts.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Henuz favori urununuz yok"
          message="Begendiginiz urunleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz."
          actionText="Menuye git"
          actionPath="/"
        />
      ) : (
        <div className="grid gap-3">
          {favoriteProducts.map((product) => (
            <ProductRowCard key={product.Id} product={product} onProductClick={handleProductClick} />
          ))}
        </div>
      )}

      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onPrevious={() => {
          const currentIndex = favoriteProducts.findIndex((product) => product.Id === selectedProduct?.Id);
          if (currentIndex > 0) setSelectedProduct(favoriteProducts[currentIndex - 1]);
        }}
        onNext={() => {
          const currentIndex = favoriteProducts.findIndex((product) => product.Id === selectedProduct?.Id);
          if (currentIndex < favoriteProducts.length - 1) setSelectedProduct(favoriteProducts[currentIndex + 1]);
        }}
        canGoPrevious={favoriteProducts.findIndex((product) => product.Id === selectedProduct?.Id) > 0}
        canGoNext={favoriteProducts.findIndex((product) => product.Id === selectedProduct?.Id) < favoriteProducts.length - 1}
      />
    </CustomerShell>
  );
}

export default Favorites;
