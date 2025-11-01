import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      
      // Sepete ürün ekle (varyant bilgisiyle, quantity desteği ile)
      addItem: (product, selectedVariant = null, quantity = 1) => {
        const items = get().items;
        
        // Varyant ID'si ile unique key oluştur (undefined/null tutarlılığı)
        const variantId = selectedVariant?.Id ?? null;
        const existingItem = items.find(
          (item) => item.Id === product.Id && (item.selectedVariant?.Id ?? null) === variantId
        );

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.Id === product.Id && (item.selectedVariant?.Id ?? null) === variantId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [...items, { 
              ...product, 
              quantity: quantity,
              selectedVariant: selectedVariant,
              // Fiyatı seçili varyanttan al, yoksa ürün fiyatını kullan
              effectivePrice: selectedVariant?.Price || product.Price,
              // Varyant sayısını sakla (görüntüleme için)
              variants: product.variants || []
            }],
          });
        }
      },

      // Ürün adedini artır (varyant ID'si ile)
      increaseQuantity: (productId, variantId = null) => {
        const normalizedVariantId = variantId ?? null;
        set({
          items: get().items.map((item) =>
            item.Id === productId && (item.selectedVariant?.Id ?? null) === normalizedVariantId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        });
      },

      // Ürün adedini azalt (varyant ID'si ile)
      decreaseQuantity: (productId, variantId = null) => {
        const items = get().items;
        const normalizedVariantId = variantId ?? null;
        const item = items.find(
          (i) => i.Id === productId && (i.selectedVariant?.Id ?? null) === normalizedVariantId
        );

        if (item && item.quantity > 1) {
          set({
            items: items.map((i) =>
              i.Id === productId && (i.selectedVariant?.Id ?? null) === normalizedVariantId
                ? { ...i, quantity: i.quantity - 1 }
                : i
            ),
          });
        } else {
          get().removeItem(productId, normalizedVariantId);
        }
      },

      // Ürünü sepetten kaldır (varyant ID'si ile)
      removeItem: (productId, variantId = null) => {
        const normalizedVariantId = variantId ?? null;
        set({
          items: get().items.filter(
            (item) => !(item.Id === productId && (item.selectedVariant?.Id ?? null) === normalizedVariantId)
          ),
        });
      },

      // Sepeti temizle
      clearCart: () => {
        set({ items: [], appliedCoupon: null });
      },
      
      // Kupon uygula
      applyCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
      },
      
      // Kupon kaldır
      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      // Toplam tutar (varyant fiyatlarını dikkate alarak)
      getTotalAmount: () => {
        return get().items.reduce(
          (total, item) => {
            const price = Number(item.effectivePrice) || 0;
            const qty = Number(item.quantity) || 0;
            return total + (price * qty);
          },
          0
        );
      },

      // Toplam ürün sayısı
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'lila-cart-storage',
    }
  )
);

export default useCartStore;

