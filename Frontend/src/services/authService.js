/**
 * Authentication Service
 * Handles all authentication API calls
 */
import api from './api';

export const authService = {
  /**
   * Send OTP to phone number
   */
  sendOTP: async (phone) => {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
  },

  /**
   * Verify OTP and get access token
   */
  verifyOTP: async (phone, otp, deviceId = null) => {
    const response = await api.post('/auth/verify-otp', {
      phone,
      otp,
      device_id: deviceId
    });
    
    // Store token and user info in localStorage
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    
    // Update token and user info
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Resend OTP
   */
  resendOTP: async (phone) => {
    const response = await api.post('/auth/resend-otp', { phone });
    return response.data;
  },

  /**
   * Get current user info
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  /**
   * Get stored user info
   */
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
