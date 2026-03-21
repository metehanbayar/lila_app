import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCategories = async () => {
  const response = await api.get('/products/categories');
  return response.data;
};

export const getRestaurants = async () => {
  const response = await api.get('/restaurants');
  return response.data;
};

export const getRestaurantBySlug = async (slug) => {
  const response = await api.get(`/restaurants/${slug}`);
  return response.data;
};

export const getFeaturedProducts = async () => {
  const response = await api.get('/products/featured');
  return response.data;
};

export const getProductsByRestaurant = async (restaurantId, mode = null) => {
  const params = {};
  if (mode) {
    params.mode = mode;
  }
  const response = await api.get(`/products/restaurant/${restaurantId}`, { params });
  return response.data;
};

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

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getOrderByNumber = async (orderNumber) => {
  const response = await api.get(`/orders/${orderNumber}`);
  return response.data;
};

export const validateCoupon = async (code, subtotal) => {
  const response = await api.post('/coupons/validate', { code, subtotal });
  return response.data;
};

export const getActivePromotions = async () => {
  try {
    const response = await api.get('/coupons/promotions');
    return response.data || { success: true, data: [] };
  } catch (error) {
    console.error('Kampanyalar yuklenirken hata:', error);
    return { success: false, data: [] };
  }
};

export const getCrossSellProducts = async (restaurantIds = [], excludeProductIds = [], categoryIds = []) => {
  try {
    const params = {};
    const validRestaurantIds = restaurantIds.filter((id) => id != null);
    const validExcludeIds = excludeProductIds.filter((id) => id != null);
    const validCategoryIds = categoryIds.filter((id) => id != null);

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
    console.error('Cross sell urunler yuklenirken hata:', error);
    return { success: false, data: [] };
  }
};

export const checkMinimumOrder = async (restaurantIds) => {
  try {
    const normalizedRestaurantIds = (restaurantIds || [])
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (normalizedRestaurantIds.length === 0) {
      return { success: true, data: [] };
    }

    const response = await api.post('/restaurants/check-min-order', {
      restaurantIds: normalizedRestaurantIds,
    });
    return response.data || { success: true, data: [] };
  } catch (error) {
    console.error('Minimum order kontrol hatasi:', error);
    return { success: true, data: [] };
  }
};

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
