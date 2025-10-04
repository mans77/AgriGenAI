// Configuration réseau centralisée
// Ce fichier permet de gérer facilement les différents environnements

// Configuration automatique basée sur l'environnement
const getApiBaseUrl = () => {
  // En développement, utiliser l'IP locale
  // En production, utiliser l'URL de production
  
  if (__DEV__) {
    // Pour le développement local
    return 'http://192.168.1.100:8000';
  } else {
    // Pour la production
    return 'https://your-production-domain.com';
  }
};

// Configuration réseau
export const NETWORK_CONFIG = {
  API_BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Configuration CORS pour l'API
export const CORS_CONFIG = {
  credentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// URLs des endpoints principaux
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    CONFIRM_EMAIL: '/auth/confirm-email',
    RESET_PASSWORD: '/auth/reset-password',
    REQUEST_RESET: '/auth/request-password-reset',
    ME: '/auth/me',
    LOGOUT: '/auth/logout'
  },
  API: {
    ANALYZE_IMAGE: '/api/analyze-image/',
    HEALTH: '/health',
    ROOT: '/'
  },
  WEBSOCKET: {
    STREAM: '/ws/stream'
  }
};

// Test de connectivité réseau
export const testNetworkConnectivity = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${NETWORK_CONFIG.API_BASE_URL}${API_ENDPOINTS.API.HEALTH}`, {
      method: 'GET',
      signal: controller.signal,
      headers: CORS_CONFIG.headers
    });

    clearTimeout(timeoutId);
    
    return {
      success: response.ok,
      status: response.status,
      url: `${NETWORK_CONFIG.API_BASE_URL}${API_ENDPOINTS.API.HEALTH}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: `${NETWORK_CONFIG.API_BASE_URL}${API_ENDPOINTS.API.HEALTH}`
    };
  }
};

export default NETWORK_CONFIG;