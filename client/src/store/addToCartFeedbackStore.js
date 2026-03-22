import { create } from 'zustand';

let feedbackId = 0;

const sanitizeNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const sanitizePayload = (payload = {}) => {
  feedbackId += 1;

  return {
    id: feedbackId,
    mode: payload.mode === 'bulk' ? 'bulk' : 'single',
    productName: payload.productName || '',
    imageUrl: payload.imageUrl || '',
    variantName: payload.variantName || '',
    quantity: sanitizeNumber(payload.quantity, 1),
    addedCount: sanitizeNumber(payload.addedCount, 1),
    cartItemCount: sanitizeNumber(payload.cartItemCount, 0),
    cartTotal: sanitizeNumber(payload.cartTotal, 0),
    source: payload.source || 'menu-card',
    onComplete: typeof payload.onComplete === 'function' ? payload.onComplete : null,
  };
};

const useAddToCartFeedbackStore = create((set) => ({
  entry: null,
  showAddSuccess: (payload) => {
    set({ entry: sanitizePayload(payload) });
  },
  dismissAddSuccess: () => {
    set({ entry: null });
  },
}));

export default useAddToCartFeedbackStore;
