import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import WeatherService from '../services/WeatherService';

export default function WeatherScreen({ route }) {
  const navigation = useNavigation();
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [sprayConditions, setSprayConditions] = useState(null);
  const [location, setLocation] = useState('Diourbel');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Listener pour les mises à jour du service météo
  useEffect(() => {
    const unsubscribe = WeatherService.addListener((data) => {
      if (data.currentWeather) {
        setCurrentWeather(data.currentWeather);
        setLocation(data.location?.city || 'Diourbel');
        
        // Calculer les conditions de pulvérisation
        const sprayData = WeatherService.calculateSprayConditions(data.currentWeather);
        setSprayConditions(sprayData);
      }
      
      if (data.forecast) {
        setForecast(data.forecast);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Charger les données au focus de l'écran
  useFocusEffect(
    React.useCallback(() => {
      loadWeatherData();
    }, [])
  );

  const loadWeatherData = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les données depuis le service
      const currentData = WeatherService.getCurrentData();
      
      if (currentData.currentWeather) {
        setCurrentWeather(currentData.currentWeather);
        setLocation(currentData.location?.city || 'Diourbel');
        
        const sprayData = WeatherService.calculateSprayConditions(currentData.currentWeather);
        setSprayConditions(sprayData);
      }
      
      if (currentData.forecast) {
        setForecast(currentData.forecast);
      }
      
      // Si pas de données, charger depuis l'API
      if (!currentData.currentWeather) {
        await WeatherService.loadWeatherData();
      }
      
    } catch (error) {
      console.error('Erreur météo:', error);
      Alert.alert('Erreur', 'Impossible de charger les données météo');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌦️', '09n': '🌦️',
      '10d': '🌧️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await WeatherService.loadWeatherData(true); // Force refresh
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rafraîchir les données');
    } finally {
      setRefreshing(false);
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ marginTop: 16, color: '#6B7280' }}>
            Chargement des données météo...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <TouchableOpacity 
          onPress={handleGoBack}
          style={{ padding: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#10B981" />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 18,
          fontWeight: '600',
          color: '#10B981',
        }}>
          PRÉVISIONS MÉTÉO
        </Text>
        <TouchableOpacity onPress={onRefresh} style={{ padding: 4 }}>
          <Ionicons name="refresh" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Météo actuelle */}
        {currentWeather && (
          <View style={{
            backgroundColor: '#10B981',
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            padding: 20,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <View>
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '600',
                }}>
                  {location}, {currentWeather.date}
                </Text>
                <Text style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: 14,
                }}>
                  Coucher du soleil: {currentWeather.sunset ? formatTime(currentWeather.sunset) : '18:46'}
                </Text>
              </View>
              <Text style={{
                color: 'white',
                fontSize: 36,
                fontWeight: 'bold',
              }}>
                {currentWeather.temperature}°C
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 40, marginRight: 12 }}>
                {getWeatherIcon(currentWeather.icon)}
              </Text>
              <Text style={{
                color: 'white',
                fontSize: 16,
                textTransform: 'capitalize',
              }}>
                {currentWeather.description}
              </Text>
            </View>
          </View>
        )}

        {/* Conditions de pulvérisation */}
        {sprayConditions && (
          <View style={{
            backgroundColor: 'white',
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 16,
            }}>
              Conditions de pulvérisation
            </Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <View style={{
                backgroundColor: sprayConditions.color,
                padding: 8,
                borderRadius: 8,
                marginRight: 12,
              }}>
                <Ionicons name={sprayConditions.icon} size={24} color="white" />
              </View>
              <View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: sprayConditions.color,
                }}>
                  {sprayConditions.condition}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#6B7280',
                }}>
                  {sprayConditions.recommendation}
                </Text>
              </View>
            </View>

            {/* Meilleurs moments */}
            <View style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 12,
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Meilleurs moments pour pulvériser :
              </Text>
              {sprayConditions.favorableHours.map((hour, index) => (
                <Text key={index} style={{
                  fontSize: 13,
                  color: '#10B981',
                  marginBottom: 4,
                }}>
                  • {hour}
                </Text>
              ))}
            </View>

            {/* Détails des conditions */}
            <View style={{ marginTop: 16 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Facteurs analysés :
              </Text>
              {sprayConditions.factors.map((factor, index) => (
                <Text key={index} style={{
                  fontSize: 12,
                  color: '#6B7280',
                  marginBottom: 2,
                }}>
                  • {factor}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Prévisions 6 prochains jours */}
        <View style={{
          backgroundColor: 'white',
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: 16,
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 16,
          }}>
            6 prochains jours
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {forecast.map((day, index) => (
              <View key={index} style={{
                alignItems: 'center',
                marginRight: 20,
                minWidth: 60,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 8,
                }}>
                  {formatDate(day.dt)}
                </Text>
                
                <Text style={{ fontSize: 24, marginBottom: 8 }}>
                  {getWeatherIcon(day.weather[0].icon)}
                </Text>
                
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#374151',
                }}>
                  {Math.round(day.main.temp)}°
                </Text>

                {/* Indicateur conditions pulvérisation */}
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: day.main.temp <= 30 && day.main.humidity < 80 && day.wind.speed < 4 
                    ? '#10B981' 
                    : day.main.temp <= 35 && day.main.humidity < 90
                    ? '#F59E0B'
                    : '#EF4444',
                  marginTop: 4,
                }}>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
          }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 8, height: 8, borderRadius: 4, 
                backgroundColor: '#10B981', marginBottom: 4 
              }} />
              <Text style={{ fontSize: 10, color: '#6B7280' }}>Optimal</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 8, height: 8, borderRadius: 4, 
                backgroundColor: '#F59E0B', marginBottom: 4 
              }} />
              <Text style={{ fontSize: 10, color: '#6B7280' }}>Modéré</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 8, height: 8, borderRadius: 4, 
                backgroundColor: '#EF4444', marginBottom: 4 
              }} />
              <Text style={{ fontSize: 10, color: '#6B7280' }}>Défavorable</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}