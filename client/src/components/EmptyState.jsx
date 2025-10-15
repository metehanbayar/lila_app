import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

function EmptyState({ icon: Icon = ShoppingBag, title, message, actionText, actionPath }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {actionText && actionPath && (
        <button
          onClick={() => navigate(actionPath)}
          className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;

