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
  try {
    const response = await api.get('/coupons/promotions');
    return response.data || { success: true, data: [] };
  } catch (error) {
    console.error('Kampanyalar yüklenirken hata:', error);
    return { success: false, data: [] };
  }
};

// Cross sell ürünleri
export const getCrossSellProducts = async (restaurantIds = [], excludeProductIds = [], categoryIds = []) => {
  try {
    const params = {};
    const validRestaurantIds = restaurantIds.filter(id => id != null && id !== undefined);
    const validExcludeIds = excludeProductIds.filter(id => id != null && id !== undefined);
    const validCategoryIds = categoryIds.filter(id => id != null && id !== undefined);
    
    if (validRestaurantIds.length > 0) {
      params.restaurantIds = validRestaurantIds.join(',');
    }
    if (validExcludeIds.length > 0) {
      params.excludeProductIds = validExcludeIds.join(',');
    }
    if (validCategoryIds.length > 0) {
      params.categoryIds = validCategoryIds.join(',');
    }
    
    const response = await api.get('/products/cross-sell', { params });
    return response.data || { success: true, data: [] };
  } catch (error) {
    console.error('Cross sell ürünler yüklenirken hata:', error);
    return { success: false, data: [] };
  }
};

// Restoran minimum sipariş tutarını kontrol et
export const checkMinimumOrder = async (restaurantIds) => {
  try {
    if (!restaurantIds || restaurantIds.length === 0) {
      return { success: true, data: [] };
    }
    
    const response = await api.post('/restaurants/check-min-order', { restaurantIds });
    return response.data || { success: true, data: [] };
  } catch (error) {
    console.error('Minimum order kontrol hatası:', error);
    return { success: false, data: [] };
  }
};

// Ödeme API'leri
export const initializePayment = async (paymentData) => {
  const response = await api.post('/payment/initialize', paymentData);
  return response.data;
};

export const getPaymentStatus = async (transactionId) => {
  const response = await api.get(`/payment/status/${transactionId}`);
  return response.data;
};

export const setOfflinePayment = async (orderId, method) => {
  const response = await api.post('/payment/offline', { orderId, method });
  return response.data;
};

export default api;

