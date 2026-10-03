import axios from 'axios';

import { isMocksEnabled } from '../mocks/mockData.js';
import { mockAdapter } from '../mocks/mockApiAdapter.js';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

// When mock data is enabled every request is served from the in-memory mock
// store (src/mocks/mockApiAdapter.js) and never reaches the backend, so the
// portal runs without a server or DATABASE_URL.
if (isMocksEnabled()) {
  apiClient.defaults.adapter = mockAdapter;
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        window.dispatchEvent(new CustomEvent('session-expired'));
      } catch (_) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);
