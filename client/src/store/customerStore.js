import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCustomerStore = create(
  persist(
    (set, get) => ({
      customer: null,
      token: null,
      isAuthenticated: false,
      favorites: [], // Favori ürün ID'leri

      // Müşteri giriş yap
      login: (customer, token) => {
        set({
          customer,
          token,
          isAuthenticated: true,
        });
      },

      // Müşteri çıkış yap
      logout: () => {
        set({
          customer: null,
          token: null,
          isAuthenticated: false,
          favorites: [],
        });
      },

      // Profil güncelle
      updateProfile: (customer) => {
        set({ customer });
      },

      // Token'ı al
      getToken: () => {
        return get().token;
      },

      // Müşteri bilgisini al
      getCustomer: () => {
        return get().customer;
      },

      // Favorileri ayarla
      setFavorites: (favorites) => {
        set({ favorites });
      },

      // Favoriye ekle
      addToFavoritesLocal: (productId) => {
        const favorites = get().favorites;
        if (!favorites.includes(productId)) {
          set({ favorites: [...favorites, productId] });
        }
      },

      // Favoriden çıkar
      removeFromFavoritesLocal: (productId) => {
        const favorites = get().favorites;
        set({ favorites: favorites.filter(id => id !== productId) });
      },

      // Favori mi kontrol et
      isFavorite: (productId) => {
        return get().favorites.includes(productId);
      },
    }),
    {
      name: 'lila-customer-storage',
    }
  )
);

export default useCustomerStore;

