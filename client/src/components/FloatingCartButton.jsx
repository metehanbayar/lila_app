import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import useCartStore from '../store/cartStore';

function FloatingCartButton() {
  const navigate = useNavigate();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalAmount = useCartStore((state) => state.getTotalAmount());

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 z-50 animate-fadeIn"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems}
        </span>
      </div>
      <div className="hidden sm:block">
        <div className="text-xs opacity-90">Sepet</div>
        <div className="font-bold">{totalAmount.toFixed(2)} ₺</div>
      </div>
    </button>
  );
}

export default FloatingCartButton;

