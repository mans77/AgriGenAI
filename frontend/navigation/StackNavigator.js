import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabNavigator from './MainTabNavigator';
import CameraScreen from '../screens/cameraScreen';
import RecapScreen from '../screens/RecapScreen';
import PestsAndDiseasesScreen from '../screens/PestsAndDiseasesScreen';
import AdviceAndCulturesScreen from '../screens/AdviceAndCulturesScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SoilTypesScreen from '../screens/SoilTypesScreen';
import StageDetailsScreen from '../screens/StageDetailsScreen';
import AuthScreen from '../screens/AuthScreen';
import EmailConfirmationScreen from '../screens/EmailConfirmationScreen';
import CommunityScreen from '../screens/CommunityScreen';
import WeatherScreen from '../screens/WeatherScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';

// Import conditionnel pour éviter l'erreur
let FertilizerCalculatorScreen;
try {
  FertilizerCalculatorScreen = require('../screens/FertilizerCalculatorScreen').default;
} catch (error) {
  // Composant de fallback temporaire
  FertilizerCalculatorScreen = ({ navigation }) => {
    const { View, Text, TouchableOpacity, SafeAreaView } = require('react-native');
    const { Ionicons } = require('@expo/vector-icons');
    
    return React.createElement(SafeAreaView, { style: { flex: 1, backgroundColor: '#F9FAFB' } },
      React.createElement(View, { 
        style: {
          backgroundColor: 'white',
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }
      },
        React.createElement(TouchableOpacity, { 
          onPress: () => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', { screen: 'Treatments' })
        },
          React.createElement(Ionicons, { name: "chevron-back", size: 24, color: "#10B981" })
        ),
        React.createElement(Text, {
          style: {
            flex: 1,
            textAlign: 'center',
            fontSize: 18,
            fontWeight: '600',
            color: '#10B981',
          }
        }, 'CALCULATEUR D\'ENGRAIS'),
        React.createElement(View, { style: { width: 24 } })
      ),
      React.createElement(View, { 
        style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 } 
      },
        React.createElement(Text, { 
          style: { fontSize: 18, color: '#6B7280', textAlign: 'center' } 
        }, 'Écran en cours de développement...')
      )
    );
  };
}

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        // Configuration des gestes avec le bon setup de gesture handler
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      
      {/* Écrans modaux */}
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="Recap" component={RecapScreen} />
      <Stack.Screen name="FertilizerCalculator" component={FertilizerCalculatorScreen} />
      <Stack.Screen name="PestsAndDiseases" component={PestsAndDiseasesScreen} />
      <Stack.Screen name="StageDetails" component={StageDetailsScreen} />
      <Stack.Screen name="AdviceAndCultures" component={AdviceAndCulturesScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="SoilTypes" component={SoilTypesScreen} />
      <Stack.Screen name="Community" component={CommunityScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
