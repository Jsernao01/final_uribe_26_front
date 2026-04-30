const hostname =
  typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';

const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

export const API_BACKEND_BASE = isLocalHost ? '/api/back' : '';
export const API_ANALYTICS_BASE = isLocalHost ? '/api/analytics' : '';
