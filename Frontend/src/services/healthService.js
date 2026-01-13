/**
 * Health Check API Service
 * Functions to test API connectivity
 */
import api from './api';

export const healthService = {
  /**
   * Check if API is running
   */
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  /**
   * Check database connectivity
   */
  checkDatabase: async () => {
    const response = await api.get('/health/db');
    return response.data;
  },
};
