import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAdminStore = create(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      // Admin giriş yap
      login: (admin, token) => {
        set({
          admin,
          token,
          isAuthenticated: true,
        });
      },

      // Admin çıkış yap
      logout: () => {
        set({
          admin: null,
          token: null,
          isAuthenticated: false,
        });
      },

      // Token'ı al
      getToken: () => {
        return get().token;
      },

      // Admin bilgisini al
      getAdmin: () => {
        return get().admin;
      },
    }),
    {
      name: 'lila-admin-storage',
    }
  )
);

export default useAdminStore;

