import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const otpApi = axios.create({
  baseURL: `${API_BASE_URL}/otp`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// OTP gönder
export const sendOTP = async (phone, purpose, name = '') => {
  const response = await otpApi.post('/send', { phone, purpose, name });
  return response.data;
};

// OTP doğrula
export const verifyOTP = async (phone, otp, purpose) => {
  const response = await otpApi.post('/verify', { phone, otp, purpose });
  return response.data;
};

export default otpApi;

