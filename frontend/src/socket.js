import { io } from 'socket.io-client';

import { isMocksEnabled } from './mocks/mockData.js';

// Derive socket base URL from the API base URL
const rawApiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const socketBaseUrl = rawApiBase.endsWith('/api') ? rawApiBase.slice(0, -4) : rawApiBase;

// Connect to the same origin as the REST API (without the /api path).
// When mock data is enabled there is no backend to talk to, so we create the
// client without auto-connecting to avoid endless reconnection attempts.
export const socket = io(socketBaseUrl, {
  withCredentials: true,
  autoConnect: !isMocksEnabled()
});
