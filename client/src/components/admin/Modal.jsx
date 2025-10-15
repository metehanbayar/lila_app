import { X } from 'lucide-react';
import { useEffect } from 'react';

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Mobile: Full Screen Modal */}
      <div className="flex items-end sm:items-center justify-center min-h-screen sm:px-4 sm:pt-4 sm:pb-20 text-center sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative inline-block align-bottom sm:align-middle bg-white text-left overflow-hidden shadow-xl transform transition-all w-full 
            ${sizeClasses[size]}
            rounded-t-2xl sm:rounded-lg
            max-h-[95vh] sm:max-h-[90vh]
            sm:my-8
          `}
        >
          {/* Header - Sticky on mobile */}
          <div className="sticky top-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between z-10">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-4">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 active:text-gray-600 transition-colors p-2 -mr-2"
              aria-label="Kapat"
            >
              <X size={20} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="bg-white px-4 sm:px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 120px)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;

