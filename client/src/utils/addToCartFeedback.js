import useCartStore from '../store/cartStore';
import useAddToCartFeedbackStore from '../store/addToCartFeedbackStore';
import { getProductDetailImage } from './imageVariants';
import { playAddToCartFlight } from './cartFlyAnimation';

const buildCartSnapshot = () => {
  const cartState = useCartStore.getState();

  return {
    cartItemCount: cartState.getTotalItems(),
    cartTotal: cartState.getTotalAmount(),
  };
};

export function showSingleAddSuccess({
  product,
  selectedVariant = null,
  quantity = 1,
  source = 'menu-card',
  onComplete,
  sourceElement,
}) {
  if (!product) {
    return;
  }

  const payload = {
    mode: 'single',
    productName: product.Name || '',
    imageUrl: getProductDetailImage(product),
    variantName: selectedVariant?.Name || '',
    quantity,
    addedCount: quantity,
    source,
    onComplete,
    ...buildCartSnapshot(),
  };

  const flight = playAddToCartFlight({
    sourceElement,
    imageUrl: payload.imageUrl,
  });

  if (flight) {
    flight.finally(() => {
      useAddToCartFeedbackStore.getState().showAddSuccess(payload);
    });
    return;
  }

  useAddToCartFeedbackStore.getState().showAddSuccess(payload);
}

export function showBulkAddSuccess({
  productName = '',
  imageUrl = '',
  addedCount = 0,
  source = 'reorder',
  onComplete,
}) {
  useAddToCartFeedbackStore.getState().showAddSuccess({
    mode: 'bulk',
    productName,
    imageUrl,
    addedCount,
    source,
    onComplete,
    ...buildCartSnapshot(),
  });
}
