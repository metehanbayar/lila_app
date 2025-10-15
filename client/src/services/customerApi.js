import axios from 'axios';
import useCustomerStore from '../store/customerStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const customerApi = axios.create({
  baseURL: `${API_BASE_URL}/customer`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her isteğe token ekle
customerApi.interceptors.request.use(
  (config) => {
    const token = useCustomerStore.getState().token;
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
customerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useCustomerStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================

export const customerRegister = async (data) => {
  const response = await customerApi.post('/register', data);
  return response.data;
};

export const customerLogin = async (phone, otp) => {
  const response = await customerApi.post('/login', { phone, otp });
  return response.data;
};

export const getProfile = async () => {
  const response = await customerApi.get('/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await customerApi.put('/profile', data);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await customerApi.put('/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// ==================== ORDERS ====================

export const getMyOrders = async (page = 1, limit = 10) => {
  const response = await customerApi.get('/my-orders', {
    params: { page, limit },
  });
  return response.data;
};

export const getMyOrderDetail = async (orderNumber) => {
  const response = await customerApi.get(`/my-orders/${orderNumber}`);
  return response.data;
};

export const getStatistics = async () => {
  const response = await customerApi.get('/statistics');
  return response.data;
};

// ==================== FAVORITES ====================

export const getFavorites = async () => {
  const response = await customerApi.get('/favorites');
  return response.data;
};

export const addToFavorites = async (productId) => {
  const response = await customerApi.post(`/favorites/${productId}`);
  return response.data;
};

export const removeFromFavorites = async (productId) => {
  const response = await customerApi.delete(`/favorites/${productId}`);
  return response.data;
};

// ==================== ADDRESSES ====================

export const getAddresses = async () => {
  const response = await customerApi.get('/addresses');
  return response.data;
};

export const createAddress = async (data) => {
  const response = await customerApi.post('/addresses', data);
  return response.data;
};

export const updateAddress = async (id, data) => {
  const response = await customerApi.put(`/addresses/${id}`, data);
  return response.data;
};

export const setDefaultAddress = async (id) => {
  const response = await customerApi.patch(`/addresses/${id}/set-default`);
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await customerApi.delete(`/addresses/${id}`);
  return response.data;
};

export default customerApi;

