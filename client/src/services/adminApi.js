import axios from 'axios';
import useAdminStore from '../store/adminStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her isteğe token ekle
adminApi.interceptors.request.use(
  (config) => {
    const token = useAdminStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 hatalarında logout yap
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAdminStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================

export const adminLogin = async (username, password) => {
  const response = await adminApi.post('/login', { username, password });
  return response.data;
};

// ==================== DASHBOARD ====================

export const getDashboardStats = async () => {
  const response = await adminApi.get('/dashboard/stats');
  return response.data;
};

export const getRecentOrders = async () => {
  const response = await adminApi.get('/dashboard/recent-orders');
  return response.data;
};

// ==================== RESTAURANTS ====================

export const getAdminRestaurants = async () => {
  const response = await adminApi.get('/restaurants');
  return response.data;
};

export const getAdminRestaurant = async (id) => {
  const response = await adminApi.get(`/restaurants/${id}`);
  return response.data;
};

export const createRestaurant = async (data) => {
  const response = await adminApi.post('/restaurants', data);
  return response.data;
};

export const updateRestaurant = async (id, data) => {
  const response = await adminApi.put(`/restaurants/${id}`, data);
  return response.data;
};

export const deleteRestaurant = async (id) => {
  const response = await adminApi.delete(`/restaurants/${id}`);
  return response.data;
};

// ==================== CATEGORIES ====================

export const getAdminCategories = async () => {
  const response = await adminApi.get('/categories');
  return response.data;
};

export const getAdminCategory = async (id) => {
  const response = await adminApi.get(`/categories/${id}`);
  return response.data;
};

export const createCategory = async (data) => {
  const response = await adminApi.post('/categories', data);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await adminApi.put(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await adminApi.delete(`/categories/${id}`);
  return response.data;
};

// ==================== PRODUCTS ====================

export const getAdminProducts = async () => {
  const response = await adminApi.get('/products');
  return response.data;
};

export const getProductsByRestaurantAdmin = async (restaurantId) => {
  const response = await adminApi.get(`/products/restaurant/${restaurantId}`);
  return response.data;
};

export const getAdminProduct = async (id) => {
  const response = await adminApi.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await adminApi.post('/products', data);
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await adminApi.put(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await adminApi.delete(`/products/${id}`);
  return response.data;
};

export const updateProductStatus = async (id, isActive) => {
  const response = await adminApi.patch(`/products/${id}/status`, { isActive });
  return response.data;
};

export const reorderProducts = async (productOrders) => {
  const response = await adminApi.post('/products/reorder', {
    productOrders,
  });
  return response.data;
};

// ==================== PRODUCT VARIANTS ====================

export const getProductVariants = async (productId) => {
  const response = await adminApi.get(`/product-variants/product/${productId}`);
  return response.data;
};

export const getProductVariant = async (id) => {
  const response = await adminApi.get(`/product-variants/${id}`);
  return response.data;
};

export const createProductVariant = async (data) => {
  const response = await adminApi.post('/product-variants', data);
  return response.data;
};

export const updateProductVariant = async (id, data) => {
  const response = await adminApi.put(`/product-variants/${id}`, data);
  return response.data;
};

export const deleteProductVariant = async (id) => {
  const response = await adminApi.delete(`/product-variants/${id}`);
  return response.data;
};

export const bulkUpdateProductVariants = async (productId, variants) => {
  const response = await adminApi.post(`/product-variants/bulk-update/${productId}`, { variants });
  return response.data;
};

// ==================== ORDERS ====================

export const getAdminOrders = async (params) => {
  const response = await adminApi.get('/orders', { params });
  return response.data;
};

export const getAdminOrder = async (id) => {
  const response = await adminApi.get(`/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await adminApi.patch(`/orders/${id}/status`, { status });
  return response.data;
};

export const updateOrderNotes = async (id, notes) => {
  const response = await adminApi.patch(`/orders/${id}/notes`, { notes });
  return response.data;
};

export const cancelOrder = async (id) => {
  const response = await adminApi.delete(`/orders/${id}`);
  return response.data;
};

// ==================== MEDIA ====================

export const getMediaFiles = async () => {
  const response = await adminApi.get('/media');
  return response.data;
};

export const getMediaFile = async (id) => {
  const response = await adminApi.get(`/media/${id}`);
  return response.data;
};

export const uploadMediaFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await adminApi.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

export const uploadMultipleMediaFiles = async (files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  const response = await adminApi.post('/media/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

export const deleteMediaFile = async (id) => {
  const response = await adminApi.delete(`/media/${id}`);
  return response.data;
};

// ==================== IMPORT ====================

export const parseXMLFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await adminApi.post('/import/parse-xml', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000, // 2 dakika timeout
  });
  return response.data;
};

export const importProducts = async (restaurantId, products, categoryMapping) => {
  const response = await adminApi.post('/import/import-products', {
    restaurantId,
    products,
    categoryMapping,
  }, {
    timeout: 300000, // 5 dakika timeout
  });
  return response.data;
};

// ==================== COUPONS ====================

export const getCoupons = async () => {
  const response = await adminApi.get('/coupons');
  return response.data;
};

export const getCoupon = async (id) => {
  const response = await adminApi.get(`/coupons/${id}`);
  return response.data;
};

export const createCoupon = async (data) => {
  const response = await adminApi.post('/coupons', data);
  return response.data;
};

export const updateCoupon = async (id, data) => {
  const response = await adminApi.put(`/coupons/${id}`, data);
  return response.data;
};

export const deleteCoupon = async (id) => {
  const response = await adminApi.delete(`/coupons/${id}`);
  return response.data;
};

export const getCouponStats = async (id) => {
  const response = await adminApi.get(`/coupons/${id}/stats`);
  return response.data;
};

// ==================== RECEIPT TEMPLATES ====================

export const getReceiptTemplate = async (restaurantId) => {
  const response = await adminApi.get(`/receipt-templates/restaurants/${restaurantId}/receipt-template`);
  return response.data;
};

export const updateReceiptTemplate = async (restaurantId, template) => {
  const response = await adminApi.put(`/receipt-templates/restaurants/${restaurantId}/receipt-template`, {
    template,
  });
  return response.data;
};

// ==================== USERS ====================

export const getAdminUsers = async () => {
  const response = await adminApi.get('/users');
  return response.data;
};

export const getAdminUser = async (id) => {
  const response = await adminApi.get(`/users/${id}`);
  return response.data;
};

export const createAdminUser = async (data) => {
  const response = await adminApi.post('/users', data);
  return response.data;
};

export const updateAdminUser = async (id, data) => {
  const response = await adminApi.put(`/users/${id}`, data);
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await adminApi.delete(`/users/${id}`);
  return response.data;
};

export const updateAdminUserStatus = async (id, isActive) => {
  const response = await adminApi.patch(`/users/${id}/status`, { isActive });
  return response.data;
};

export default adminApi;

