import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Kategoriler
export const getCategories = async () => {
  const response = await api.get('/products/categories');
  return response.data;
};

// Restoranlar
export const getRestaurants = async () => {
  const response = await api.get('/restaurants');
  return response.data;
};

export const getRestaurantBySlug = async (slug) => {
  const response = await api.get(`/restaurants/${slug}`);
  return response.data;
};

// Ürünler
export const getProductsByRestaurant = async (restaurantId) => {
  const response = await api.get(`/products/restaurant/${restaurantId}`);
  return response.data;
};

// Ürün arama
export const searchProducts = async (searchTerm, restaurantId = null, categoryId = null) => {
  const params = {};
  if (searchTerm) {
    params.q = searchTerm;
  }
  if (restaurantId) {
    params.restaurantId = restaurantId;
  }
  if (categoryId) {
    params.categoryId = categoryId;
  }
  const response = await api.get('/products/search', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Siparişler
export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getOrderByNumber = async (orderNumber) => {
  const response = await api.get(`/orders/${orderNumber}`);
  return response.data;
};

// Kuponlar
export const validateCoupon = async (code, subtotal) => {
  const response = await api.post('/coupons/validate', { code, subtotal });
  return response.data;
};

// Kampanyalar (aktif kuponlar)
export const getActivePromotions = async () => {
  const response = await api.get('/coupons/promotions');
  return response.data;
};

export default api;

