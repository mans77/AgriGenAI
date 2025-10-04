// Configuration des APIs pour AgriGenAI
// � IMPORTANT: Remplacez les valeurs par vos vraies cl�s API avant de d�ployer

export const API_CONFIG = {
  // API Backend AgriGenAI
  BACKEND: {
    BASE_URL: {
      // URL de production Railway (à remplacer après déploiement)
      production: 'https://agrigen-ai-production.up.railway.app',
      // URLs de développement
      android: 'http://192.168.1.100:8000',
      ios: 'http://192.168.1.100:8000',
      web: 'http://localhost:8000',
      default: 'http://192.168.1.100:8000'
    },
    // Environnement actuel - changer en 'production' pour DIAWI
    ENVIRONMENT: __DEV__ ? 'default' : 'production',
    // Configuration CORS
    CORS: {
      credentials: true,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      }
    }
  },

  // Tavily Search API pour la recherche de prix
  TAVILY: {
    API_KEY: 'tvly-your-key-here', // Remplacez par votre cl� Tavily
    BASE_URL: 'https://api.tavily.com'
  },

  // LiveKit pour l'interface vocale
  LIVEKIT: {
    API_KEY: 'your-livekit-key',
    API_SECRET: 'your-livekit-secret', 
    WS_URL: 'wss://your-livekit-domain.livekit.cloud',
    ROOM_NAME: 'agrigen-voice-room'
  },

  // OpenWeatherMap (d�j� configur� dans weather.js)
  WEATHER: {
    API_KEY: '5c8dba24136bd44bcb0e42187abf4bda',
    BASE_URL: 'https://api.openweathermap.org/data/2.5'
  },

  // Configuration g�n�rale
  GENERAL: {
    TIMEOUT: 30000, // 30 secondes
    RETRY_ATTEMPTS: 3,
    CACHE_DURATION: 300000 // 5 minutes
  }
};

// Fonction pour v�rifier si les cl�s API sont configur�es
export const validateAPIConfig = () => {
  const warnings = [];

  if (API_CONFIG.TAVILY.API_KEY === 'tvly-your-key-here') {
    warnings.push('Cl� API Tavily non configur�e - recherche de prix d�sactiv�e');
  }

  if (API_CONFIG.LIVEKIT.API_KEY === 'your-livekit-key') {
    warnings.push('Cl� API LiveKit non configur�e - interface vocale d�sactiv�e');
  }

  if (API_CONFIG.WEATHER.API_KEY === 'YOUR_API_KEY') {
    warnings.push('Cl� API Weather non configur�e - m�t�o par d�faut');
  }

  return warnings;
};

// Fonctions utilitaires pour les URLs d'API
export const getBackendURL = (platform) => {
  return API_CONFIG.BACKEND.BASE_URL[platform] || API_CONFIG.BACKEND.BASE_URL.default;
};

export const getTavilyConfig = () => {
  return {
    apiKey: API_CONFIG.TAVILY.API_KEY,
    baseUrl: API_CONFIG.TAVILY.BASE_URL,
    timeout: API_CONFIG.GENERAL.TIMEOUT
  };
};

export const getLiveKitConfig = () => {
  return {
    apiKey: API_CONFIG.LIVEKIT.API_KEY,
    apiSecret: API_CONFIG.LIVEKIT.API_SECRET,
    wsUrl: API_CONFIG.LIVEKIT.WS_URL,
    roomName: API_CONFIG.LIVEKIT.ROOM_NAME
  };
};

// Fonction pour les headers d'API communes
export const getCommonHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'AgriGenAI-Mobile/2.1.0',
  };
};

// Fonction pour les headers FormData (sans Content-Type)
export const getFormDataHeaders = () => {
  return {
    'Accept': 'application/json',
    'User-Agent': 'AgriGenAI-Mobile/2.1.0',
    // Ne pas inclure Content-Type pour FormData - laissé à axios
  };
};

export default API_CONFIG;