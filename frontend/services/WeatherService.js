import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import axios from 'axios';
import { WEATHER_API_KEY, WEATHER_BASE_URL, DEFAULT_COORDS } from '../config/weather';

const WEATHER_CACHE_DURATION = 20 * 60 * 1000; // 20 minutes
const LOCATION_CACHE_DURATION = 60 * 60 * 1000; // 1 heure
const WEATHER_CACHE_KEY = 'weather_cache';
const LOCATION_CACHE_KEY = 'location_cache';
const HTTP_TIMEOUT = 8000; // 8 secondes
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 seconde

class WeatherService {
  constructor() {
    this.currentLocation = null;
    this.weatherData = null;
    this.forecastData = null;
    this.listeners = new Set();
    this.loadingPromise = null;
    
    // Configuration axios avec timeout
    this.httpClient = axios.create({
      timeout: HTTP_TIMEOUT,
      baseURL: WEATHER_BASE_URL
    });
  }

  // Ajouter un listener pour les mises à jour
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notifier tous les listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      callback({
        location: this.currentLocation,
        currentWeather: this.weatherData,
        forecast: this.forecastData
      });
    });
  }

  // Obtenir la position actuelle avec cache
  async getCurrentLocation() {
    try {
      // Vérifier le cache de localisation
      const cachedLocation = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cachedLocation) {
        const { location, timestamp } = JSON.parse(cachedLocation);
        if (Date.now() - timestamp < LOCATION_CACHE_DURATION) {
          this.currentLocation = location;
          return location;
        }
      }

      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Permission de géolocalisation refusée');
        // Utiliser la position par défaut
        const defaultLocation = {
          latitude: DEFAULT_COORDS.lat,
          longitude: DEFAULT_COORDS.lon,
          city: 'Diourbel',
          country: 'Sénégal'
        };
        this.currentLocation = defaultLocation;
        return defaultLocation;
      }

      // Obtenir la position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // Géocodage inverse
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const locationData = {
        latitude,
        longitude,
        city: reverseGeocode[0]?.city || 
              reverseGeocode[0]?.subregion || 
              reverseGeocode[0]?.region || 
              'Votre position',
        country: reverseGeocode[0]?.country || ''
      };

      // Sauvegarder en cache
      await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
        location: locationData,
        timestamp: Date.now()
      }));

      this.currentLocation = locationData;
      return locationData;

    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      
      // Fallback vers la position par défaut
      const defaultLocation = {
        latitude: DEFAULT_COORDS.lat,
        longitude: DEFAULT_COORDS.lon,
        city: 'Diourbel',
        country: 'Sénégal'
      };
      this.currentLocation = defaultLocation;
      return defaultLocation;
    }
  }

  // Vérifier le cache météo
  async getCachedWeather(coords) {
    try {
      const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const { data, timestamp, coordinates } = JSON.parse(cached);
        
        const isValid = (Date.now() - timestamp) < WEATHER_CACHE_DURATION;
        const isSameLocation = Math.abs(coordinates.lat - coords.latitude) < 0.01 && 
                              Math.abs(coordinates.lon - coords.longitude) < 0.01;
        
        if (isValid && isSameLocation) {
          this.weatherData = data.current;
          this.forecastData = data.forecast;
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur cache météo:', error);
      return null;
    }
  }

  // Sauvegarder en cache
  async setCachedWeather(coords, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        coordinates: { lat: coords.latitude, lon: coords.longitude }
      };
      await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Erreur sauvegarde cache météo:', error);
    }
  }

  // Fonction de retry avec backoff exponential
  async makeApiCallWithRetry(url, params, retryCount = 0) {
    try {
      const response = await this.httpClient.get(url, { params });
      return response;
    } catch (error) {
      if (retryCount < MAX_RETRIES && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} après ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeApiCallWithRetry(url, params, retryCount + 1);
      }
      throw error;
    }
  }

  // Charger les données météo
  async loadWeatherData(forceRefresh = false) {
    // Éviter les appels parallèles multiples
    if (this.loadingPromise && !forceRefresh) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._loadWeatherDataInternal(forceRefresh);
    
    try {
      const result = await this.loadingPromise;
      return result;
    } finally {
      this.loadingPromise = null;
    }
  }

  async _loadWeatherDataInternal(forceRefresh = false) {
    try {
      // Obtenir la localisation
      const location = await this.getCurrentLocation();
      
      // Vérifier le cache si on ne force pas le refresh
      if (!forceRefresh) {
        const cachedData = await this.getCachedWeather(location);
        if (cachedData) {
          this.notifyListeners();
          return cachedData;
        }
      }

      const commonParams = {
        lat: location.latitude,
        lon: location.longitude,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'fr'
      };

      // Appels API parallèles avec retry
      const [currentWeatherResponse, forecastResponse] = await Promise.all([
        this.makeApiCallWithRetry('/weather', commonParams),
        this.makeApiCallWithRetry('/forecast', commonParams)
      ]);

      // Traiter les données météo actuelles
      const currentWeather = {
        city: location.city,
        temperature: Math.round(currentWeatherResponse.data.main.temp),
        description: currentWeatherResponse.data.weather[0].description,
        icon: currentWeatherResponse.data.weather[0].icon,
        humidity: currentWeatherResponse.data.main.humidity,
        windSpeed: currentWeatherResponse.data.wind.speed,
        pressure: currentWeatherResponse.data.main.pressure,
        sunset: currentWeatherResponse.data.sys.sunset,
        sunrise: currentWeatherResponse.data.sys.sunrise,
        date: new Date().toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        })
      };

      // Traiter les prévisions
      const forecastList = this.processForecastData(forecastResponse.data);

      // Obtenir la météo de demain
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateString = tomorrow.toDateString();

      const tomorrowForecast = forecastResponse.data.list.find(item => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate.toDateString() === tomorrowDateString;
      });

      const tomorrowData = tomorrowForecast ? {
        temperature: Math.round(tomorrowForecast.main.temp),
        description: tomorrowForecast.weather[0].description,
        icon: tomorrowForecast.weather[0].icon,
        humidity: tomorrowForecast.main.humidity
      } : null;

      const weatherData = {
        current: currentWeather,
        tomorrow: tomorrowData,
        forecast: forecastList,
        rawData: {
          current: currentWeatherResponse.data,
          forecast: forecastResponse.data
        }
      };

      // Sauvegarder les données
      this.weatherData = currentWeather;
      this.forecastData = forecastList;

      // Mettre en cache
      await this.setCachedWeather(location, weatherData);

      // Notifier les listeners
      this.notifyListeners();

      return weatherData;

    } catch (error) {
      console.error('Erreur API météo:', error);
      
      // Générer des données de fallback
      const fallbackData = this.generateFallbackData();
      
      this.weatherData = fallbackData.current;
      this.forecastData = fallbackData.forecast;
      
      this.notifyListeners();
      
      throw new Error('Impossible de charger les données météo. Utilisation des données de démonstration.');
    }
  }

  // Traiter les données de prévision
  processForecastData(data) {
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = item;
      }
    });

    return Object.values(dailyForecasts).slice(0, 6);
  }

  // Générer des données de fallback
  generateFallbackData() {
    const location = this.currentLocation || { city: 'Diourbel' };
    
    const currentWeather = {
      city: location.city,
      temperature: 30,
      description: 'ensoleillé',
      icon: '01d',
      humidity: 65,
      windSpeed: 3.2,
      pressure: 1013,
      sunset: Date.now() / 1000 + 3600,
      sunrise: Date.now() / 1000 - 21600,
      date: new Date().toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      })
    };

    const baseTemp = 30;
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const forecast = days.map((day, index) => ({
      dt: Date.now() / 1000 + (index + 1) * 86400,
      main: {
        temp: baseTemp + Math.random() * 8 - 4,
        humidity: 60 + Math.random() * 20
      },
      weather: [{ 
        main: index % 3 === 0 ? 'Rain' : 'Clear',
        icon: index % 3 === 0 ? '10d' : '01d',
        description: index % 3 === 0 ? 'pluie légère' : 'ensoleillé'
      }],
      wind: { speed: 2 + Math.random() * 4 }
    }));

    const tomorrow = {
      temperature: 28,
      description: 'partiellement nuageux',
      icon: '02d',
      humidity: 70
    };

    return {
      current: currentWeather,
      tomorrow,
      forecast
    };
  }

  // Calculer les conditions de pulvérisation
  calculateSprayConditions(weatherData) {
    if (!weatherData) return null;

    const temp = weatherData.temperature;
    const humidity = weatherData.humidity;
    const windSpeed = weatherData.windSpeed;
    
    let score = 0;
    let factors = [];
    
    if (temp >= 15 && temp <= 25) {
      score += 33;
      factors.push('Température optimale');
    } else if (temp > 25 && temp <= 30) {
      score += 20;
      factors.push('Température acceptable');
    } else {
      factors.push(temp > 30 ? 'Température trop élevée' : 'Température trop basse');
    }
    
    if (humidity < 80) {
      score += 33;
      factors.push('Humidité correcte');
    } else {
      factors.push('Humidité trop élevée');
    }
    
    if (windSpeed < 4) {
      score += 34;
      factors.push('Vent favorable');
    } else {
      factors.push('Vent trop fort');
    }
    
    let condition, color, icon, recommendation;
    
    if (score >= 80) {
      condition = 'Favorable';
      color = '#10B981';
      icon = 'checkmark-circle';
      recommendation = 'Conditions idéales pour la pulvérisation';
    } else if (score >= 50) {
      condition = 'Modéré';
      color = '#F59E0B';
      icon = 'warning';
      recommendation = 'Pulvérisation possible avec précautions';
    } else {
      condition = 'Défavorable';
      color = '#EF4444';
      icon = 'close-circle';
      recommendation = 'Éviter la pulvérisation';
    }
    
    const currentHour = new Date().getHours();
    let favorableHours = [];
    
    if (condition !== 'Défavorable') {
      if (currentHour >= 6 && currentHour <= 10) {
        favorableHours.push('Maintenant (matin)');
      }
      if (currentHour >= 17 && currentHour <= 19) {
        favorableHours.push('Maintenant (soir)');
      }
      
      favorableHours.push('6h - 10h', '17h - 19h');
    }
    
    return {
      condition,
      color,
      icon,
      recommendation,
      score,
      factors,
      favorableHours: favorableHours.length > 0 ? favorableHours : ['Aucune heure favorable aujourd\'hui']
    };
  }

  // Obtenir les données actuelles
  getCurrentData() {
    return {
      location: this.currentLocation,
      currentWeather: this.weatherData,
      forecast: this.forecastData
    };
  }

  // Vider le cache
  async clearCache() {
    try {
      await AsyncStorage.multiRemove([WEATHER_CACHE_KEY, LOCATION_CACHE_KEY]);
    } catch (error) {
      console.error('Erreur suppression cache:', error);
    }
  }
}

// Instance singleton
export default new WeatherService();