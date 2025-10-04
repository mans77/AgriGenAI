import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import axios from 'axios';
import { WEATHER_API_KEY, WEATHER_BASE_URL } from '../config/weather';
import ChatPopup from '../components/ChatPopup';
import { userService } from '../services/UserService';

const { width } = Dimensions.get('window');

const Home = () => {
  const navigation = useNavigation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [userProfile, setUserProfile] = useState({
    firstName: 'Utilisateur',
    lastName: '',
    email: 'email@example.com',
    profileImage: 'https://via.placeholder.com/80x80/10B981/ffffff?text=U',
    completedDiagnoses: 0,
    farmType: 'Agriculture',
    location: ''
  });

  // Charger les données utilisateur
  const loadUserData = async () => {
    try {
      await userService.loadUserData();
      const userInfo = userService.getUserInfo();
      
      console.log('👤 Données utilisateur HomeScreen:', userInfo);
      
      // Générer l'image de profil avec les initiales
      const initials = `${userInfo.firstName.charAt(0)}${userInfo.lastName.charAt(0)}`.toUpperCase();
      const profileImage = `https://via.placeholder.com/80x80/10B981/ffffff?text=${initials}`;
      
      setUserProfile({
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        profileImage: profileImage,
        completedDiagnoses: 0, // TODO: récupérer depuis les stats utilisateur
        farmType: 'Agriculture', // TODO: récupérer depuis le profil
        location: '' // TODO: récupérer depuis le profil
      });
    } catch (error) {
      console.error('❌ Erreur chargement données utilisateur:', error);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadUserData();
    loadLocationAndWeather();
  }, []);

  // Fonction pour obtenir la localisation et charger la météo
  const loadLocationAndWeather = async () => {
    try {
      setIsLoadingWeather(true);
      
      // Demander la permission de géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Permission de géolocalisation refusée');
        // Utiliser les coordonnées par défaut (Diourbel)
        await loadWeatherData({ lat: 14.6592, lon: -16.2317 }, 'Diourbel');
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // Obtenir le nom de la ville via géocodage inverse
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const cityName = reverseGeocode[0]?.city || 
                       reverseGeocode[0]?.subregion || 
                       reverseGeocode[0]?.region || 
                       'Votre position';

      setCurrentLocation({
        latitude,
        longitude,
        city: cityName,
        country: reverseGeocode[0]?.country || ''
      });

      // Charger les données météo pour cette position
      await loadWeatherData({ lat: latitude, lon: longitude }, cityName);

    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      Alert.alert(
        'Géolocalisation',
        'Impossible d\'obtenir votre position. Utilisation des données de Diourbel.',
        [{ text: 'OK' }]
      );
      // Fallback vers Diourbel
      await loadWeatherData({ lat: 14.6592, lon: -16.2317 }, 'Diourbel');
    }
  };

  // Fonction pour charger les données météo
  const loadWeatherData = async (coords, cityName) => {
    try {
      // Météo actuelle
      const currentWeatherResponse = await axios.get(
        `${WEATHER_BASE_URL}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=fr`
      );

      // Prévisions (pour obtenir la météo de demain)
      const forecastResponse = await axios.get(
        `${WEATHER_BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=fr`
      );

      // Traiter les données météo
      const currentWeather = {
        city: cityName,
        temperature: Math.round(currentWeatherResponse.data.main.temp),
        description: currentWeatherResponse.data.weather[0].description,
        icon: currentWeatherResponse.data.weather[0].icon,
        humidity: currentWeatherResponse.data.main.humidity,
        windSpeed: currentWeatherResponse.data.wind.speed,
        sunset: currentWeatherResponse.data.sys.sunset,
        date: new Date().toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        })
      };

      // Obtenir la météo de demain (première prévision du lendemain)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateString = tomorrow.toDateString();

      const tomorrowForecast = forecastResponse.data.list.find(item => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate.toDateString() === tomorrowDateString;
      });

      const forecast = tomorrowForecast ? {
        temperature: Math.round(tomorrowForecast.main.temp),
        description: tomorrowForecast.weather[0].description,
        icon: tomorrowForecast.weather[0].icon,
        humidity: tomorrowForecast.main.humidity
      } : null;

      setWeatherData(currentWeather);
      setForecastData(forecast);

    } catch (error) {
      console.error('Erreur API météo:', error);
      
      // Données de fallback en cas d'erreur
      setWeatherData({
        city: cityName,
        temperature: 30,
        description: 'ensoleillé',
        icon: '01d',
        humidity: 65,
        windSpeed: 3.2,
        sunset: Date.now() / 1000 + 3600, // dans 1 heure
        date: new Date().toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        })
      });

      setForecastData({
        temperature: 28,
        description: 'partiellement nuageux',
        icon: '02d',
        humidity: 70
      });

      if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_API_KEY') {
        Alert.alert('Info', 'Veuillez configurer votre clé API météo pour des données réelles.');
      }
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Fonction pour rafraîchir les données météo
  const refreshWeatherData = async () => {
    if (currentLocation) {
      await loadWeatherData({
        lat: currentLocation.latitude,
        lon: currentLocation.longitude
      }, currentLocation.city);
    } else {
      await loadLocationAndWeather();
    }
  };

  // Fonction pour formater l'heure du coucher de soleil
  const formatSunsetTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour obtenir l'icône météo
  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': require('../assets/meteo-good.png'), // soleil
      '01n': require('../assets/meteo-good.png'),
      '02d': require('../assets/meteo.png'), // nuageux
      '02n': require('../assets/meteo.png'),
      '03d': require('../assets/meteo.png'),
      '03n': require('../assets/meteo.png'),
      '04d': require('../assets/meteo.png'),
      '04n': require('../assets/meteo.png'),
      '09d': require('../assets/meteo.png'), // pluie
      '09n': require('../assets/meteo.png'),
      '10d': require('../assets/meteo.png'),
      '10n': require('../assets/meteo.png'),
      '11d': require('../assets/meteo.png'), // orage
      '11n': require('../assets/meteo.png'),
      '13d': require('../assets/meteo.png'), // neige
      '13n': require('../assets/meteo.png'),
      '50d': require('../assets/meteo.png'), // brouillard
      '50n': require('../assets/meteo.png')
    };
    
    return iconMap[iconCode] || require('../assets/meteo-good.png');
  };

  const handleNavigateToCamera = () => {
    navigation.navigate('Camera');
  };

  const handleNavigateToWeather = () => {
    navigation.navigate('Weather');
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Éléments de navigation du drawer
  const drawerItems = [
    {
      id: 1,
      title: 'Accueil',
      icon: 'home',
      screen: 'Home',
      description: 'Retour à l\'accueil'
    },
    {
      id: 2,
      title: 'Diagnostic Photo',
      icon: 'camera',
      screen: 'Camera',
      description: 'Analyser une plante'
    },
    {
      id: 3,
      title: 'Monitoring Agricole',
      icon: 'radio',
      screen: 'Monitoring',
      description: 'Surveillance et irrigation'
    },
    {
      id: 4,
      title: 'Météo',
      icon: 'partly-sunny',
      screen: 'Weather',
      description: 'Prévisions météorologiques'
    },
    {
      id: 5,
      title: 'Traitements',
      icon: 'construct',
      screen: 'Treatments',
      description: 'Outils de traitement'
    },
    {
      id: 6,
      title: 'Marketplace',
      icon: 'storefront',
      screen: 'Marketplace',
      description: 'Acheter et vendre'
    },
    {
      id: 7,
      title: 'Communauté',
      icon: 'people',
      screen: 'Community',
      description: 'Échanger avec la communauté'
    },
    {
      id: 8,
      title: 'Mon Profil',
      icon: 'person',
      screen: 'Profile',
      description: 'Gérer mon profil'
    }
  ];

  const navigateToScreen = (screenName) => {
    setIsDrawerOpen(false);
    if (screenName !== 'Home') {
      navigation.navigate(screenName);
    }
  };

  // Contenu du drawer personnalisé
  const DrawerContent = () => (
    <SafeAreaView style={styles.drawerContainer}>
      {/* Header du drawer avec profil utilisateur */}
      <View style={styles.drawerHeader}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsDrawerOpen(false)}
        >
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        
        <View style={styles.userProfile}>
          <Image 
            source={{ uri: userProfile.profileImage }} 
            style={styles.profileImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userProfile.firstName} {userProfile.lastName}
            </Text>
            <Text style={styles.userEmail}>
              {userProfile.email}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={12} color="#6B7280" />
              <Text style={styles.userLocation}>
                {currentLocation ? `${currentLocation.city}` : 'Localisation...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats rapides */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.completedDiagnoses}</Text>
            <Text style={styles.statLabel}>Diagnostics</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.farmType}</Text>
            <Text style={styles.statLabel}>Spécialité</Text>
          </View>
        </View>
      </View>

      {/* Liste de navigation */}
      <ScrollView style={styles.navigationList}>
        <Text style={styles.sectionTitle}>Navigation</Text>
        
        {drawerItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.drawerItem}
            onPress={() => navigateToScreen(item.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.drawerItemIcon}>
              <Ionicons 
                name={item.icon} 
                size={22} 
                color="#10B981" 
              />
            </View>
            <View style={styles.drawerItemContent}>
              <Text style={styles.drawerItemTitle}>
                {item.title}
              </Text>
              <Text style={styles.drawerItemDescription}>
                {item.description}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>
        ))}

        {/* Section Outils rapides */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Outils rapides</Text>
          
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => {
              setIsDrawerOpen(false);
              navigation.navigate('FertilizerCalculator');
            }}
          >
            <Ionicons name="calculator" size={20} color="#F59E0B" />
            <Text style={styles.quickActionText}>Calculateur d'engrais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => {
              setIsDrawerOpen(false);
              navigation.navigate('PestsAndDiseases');
            }}
          >
            <Ionicons name="bug" size={20} color="#EF4444" />
            <Text style={styles.quickActionText}>Maladies & Ravageurs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => {
              setIsDrawerOpen(false);
              navigation.navigate('SoilTypes');
            }}
          >
            <Ionicons name="layers" size={20} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Analyse du sol</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer du drawer */}
      <View style={styles.drawerFooter}>
        <Text style={styles.appVersion}>AgriGenAI v2.1.0</Text>
        <Text style={styles.footerText}>
          Votre assistant agricole intelligent
        </Text>
      </View>
    </SafeAreaView>
  );

  // Contenu principal de l'écran
  const MainContent = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header simplifié avec drawer et nom utilisateur */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={toggleDrawer}
          >
            <Ionicons name="menu" size={24} color="#10B981" />
          </TouchableOpacity>
          
          <View style={styles.welcomeSection}>
            <Text style={styles.headerText}>
              Bienvenue {userProfile.firstName}
            </Text>
            <Text style={styles.subHeaderText}>
              Que souhaitez-vous faire aujourd'hui ?
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Ionicons name="notifications" size={24} color="#10B981" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section météo dynamique */}
        <View style={styles.weatherSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {isLoadingWeather ? (
              // Skeleton de chargement
              <View style={[styles.weatherCard, styles.loadingCard]}>
                <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.loadingText}>Chargement météo...</Text>
              </View>
            ) : (
              <>
                {/* Carte météo actuelle */}
                {weatherData && (
                  <TouchableOpacity 
                    style={styles.weatherCard}
                    onPress={handleNavigateToWeather}
                    activeOpacity={0.8}
                  >
                    <View style={styles.weatherContent}>
                      <View style={styles.weatherInfo}>
                        <View style={styles.locationRow}>
                          <Ionicons name="location" size={14} color="rgba(255, 255, 255, 0.9)" />
                          <Text style={styles.weatherLocation}>
                            {weatherData.city}, {weatherData.date}
                          </Text>
                        </View>
                        <Text style={styles.weatherSubText}>
                          Coucher: {formatSunsetTime(weatherData.sunset)}
                        </Text>
                        <Text style={styles.weatherDescription}>
                          {weatherData.description}
                        </Text>
                      </View>
                      <Text style={styles.weatherValue}>{weatherData.temperature}°C</Text>
                    </View>
                    
                    {/* Icône météo avec taille ajustée */}
                    <Image 
                      source={getWeatherIcon(weatherData.icon)} 
                      style={styles.weatherIcon} 
                    />
                    
                    {/* Bouton de rafraîchissement */}
                    <TouchableOpacity 
                      style={styles.refreshButton}
                      onPress={refreshWeatherData}
                    >
                      <Ionicons name="refresh" size={14} color="rgba(255, 255, 255, 0.8)" />
                    </TouchableOpacity>
                    
                    {/* Indicateur de navigation */}
                    <View style={styles.navigationIndicator}>
                      <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.8)" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Carte météo de demain */}
                {forecastData && (
                  <View style={styles.weatherCard}>
                    <View style={styles.weatherContent}>
                      <View style={styles.weatherInfo}>
                        <Text style={styles.weatherLocation}>Demain</Text>
                        <Text style={styles.weatherSubText}>{forecastData.description}</Text>
                        <Text style={styles.weatherSubText}>
                          Humidité: {forecastData.humidity}%
                        </Text>
                      </View>
                      <Text style={styles.weatherValue}>{forecastData.temperature}°C</Text>
                    </View>
                    <Image 
                      source={getWeatherIcon(forecastData.icon)} 
                      style={styles.weatherIcon} 
                    />
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>

        {/* Section Comment ça marche */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.howItWorksTitle}>Comment ça marche</Text>
          
          <View style={styles.processContainer}>
            {/* Étape 1: Photo */}
            <View style={styles.processStep}>
              <View style={styles.processIcon}>
                <Ionicons name="camera" size={32} color="#10B981" />
              </View>
              <Text style={styles.processLabel}>Photo</Text>
            </View>

            {/* Flèche 1 */}
            <View style={styles.processArrow}>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>

            {/* Étape 2: Diagnostique */}
            <View style={styles.processStep}>
              <View style={styles.processIcon}>
                <Ionicons name="analytics" size={32} color="#10B981" />
              </View>
              <Text style={styles.processLabel}>Diagnostic</Text>
            </View>

            {/* Flèche 2 */}
            <View style={styles.processArrow}>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>

            {/* Étape 3: Traitement */}
            <View style={styles.processStep}>
              <View style={styles.processIcon}>
                <Ionicons name="medical" size={32} color="#10B981" />
              </View>
              <Text style={styles.processLabel}>Traitement</Text>
            </View>
          </View>
        </View>

        {/* Actions principales */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={handleNavigateToCamera}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={28} color="white" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Diagnostic Photo</Text>
              <Text style={styles.actionSubtitle}>Analysez vos cultures</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('Monitoring')}
            >
              <Ionicons name="radio" size={24} color="#10B981" />
              <Text style={styles.secondaryActionText}>Monitoring</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('Treatments')}
            >
              <Ionicons name="construct" size={24} color="#F59E0B" />
              <Text style={styles.secondaryActionText}>Traitements</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('Marketplace')}
            >
              <Ionicons name="storefront" size={24} color="#EF4444" />
              <Text style={styles.secondaryActionText}>Marketplace</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section conseils rapides */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Conseils du jour</Text>
          
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>
                Surveillance des cultures
              </Text>
              <Text style={styles.tipText}>
                {weatherData ? 
                  `Avec ${weatherData.temperature}°C et ${weatherData.humidity}% d'humidité, surveillez l'irrigation de vos cultures.` :
                  'Vérifiez régulièrement l\'humidité du sol pendant cette saison sèche.'
                }
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1 }}>
      <MainContent />
      <ChatPopup />
      
      {/* Modal remplaçant le Drawer */}
      <Modal
        visible={isDrawerOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <DrawerContent />
          </View>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsDrawerOpen(false)}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Styles du modal (remplaçant le drawer)
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: 'white',
    height: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  
  // Header du drawer
  drawerHeader: {
    backgroundColor: '#F0FDF4',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 10,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 15,
  },
  
  // Liste de navigation
  navigationList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  drawerItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  drawerItemContent: {
    flex: 1,
  },
  drawerItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  drawerItemDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Actions rapides
  quickActionsSection: {
    marginTop: 30,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  
  // Footer du drawer
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Header principal
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  welcomeSection: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  
  // Styles météo améliorés
  weatherSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  weatherCard: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
    minWidth: 280,
    position: 'relative',
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 10,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  weatherInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  weatherLocation: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  weatherSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 2,
  },
  weatherDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  weatherValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  weatherIcon: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 40, // Taille réduite comme demandé
    height: 40, // Taille réduite comme demandé
    resizeMode: 'contain',
  },
  refreshButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 6,
  },
  navigationIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  
  // Actions principales
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  primaryAction: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Conseils
  tipsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  // Comment ça marche
  howItWorksSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginTop: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingTop: 20,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 20,
  },
  processContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  processStep: {
    flex: 1,
    alignItems: 'center',
  },
  processIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  processLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  processArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
});

export default Home;
