import { useEffect } from 'react';
import { X } from 'lucide-react';

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-lg',
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-dark/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Modal kapat" />
      <div className={`admin-modal-shell relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[32px] border border-white/70 bg-white shadow-premium sm:rounded-[32px] ${sizeClasses[size] || sizeClasses.md}`}>
        <div className="flex items-center justify-between border-b border-surface-border bg-white/92 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Duzenleme paneli</p>
            <h3 className="mt-1 text-xl font-bold text-dark">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-surface-muted p-3 text-dark transition-all hover:bg-white hover:shadow-card">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="admin-modal-content overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
