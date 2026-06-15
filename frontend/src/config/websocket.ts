import { getAccessTokenFromMemory } from '@/lib/secureTokenManager';

const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
};

const getWebSocketUrlFromApiUrl = (apiUrl: string, projectId?: string): string => {
  const domain = getDomainFromUrl(apiUrl);
  const isSecure = apiUrl.startsWith('https://');
  const protocol = isSecure ? 'wss' : 'ws';
  const path = '/eu/chat-response/';
  
  // Get access token and add it as query parameter
  const token = getAccessTokenFromMemory();
  const queryParams = new URLSearchParams();
  
  if (token) {
    queryParams.append('token', token);
  }
  
  if (projectId) {
    queryParams.append('project_id', projectId);
  }
  
  const queryString = queryParams.toString();
  const paramString = queryString ? `?${queryString}` : '';
  
  return `${protocol}://${domain}${path}${paramString}`;
};

export const WEBSOCKET_CONFIG = {
  url: getEnvVar('VITE_WEBSOCKET_URL', getWebSocketUrlFromApiUrl(getEnvVar('VITE_API_URL', 'http://localhost:8000'))),
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  messageTimeout: 10000,
};

export const getWebSocketUrl = (projectId?: string): string => {
  return getEnvVar('VITE_WEBSOCKET_URL', getWebSocketUrlFromApiUrl(getEnvVar('VITE_API_URL', 'http://localhost:8000'), projectId));
};
