import React from 'react';
import Home from '../screens/HomeScreen';
import TreatmentsScreen from '../screens/TreatmentsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import MonitoringScreen from '../screens/MonitoringScreen';
import Profile from '../screens/Profile';
import { View, StyleSheet } from 'react-native';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: "#FFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 75,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.container}>
              <Entypo 
                name="home" 
                size={24} 
                color={focused ? "#10B981" : "#9CA3AF"} 
              />
            </View>
          )
        }}
      />

      <Tab.Screen 
        name="Treatments" 
        component={TreatmentsScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.container}>
              <Ionicons 
                name="construct-outline" 
                size={24} 
                color={focused ? "#10B981" : "#9CA3AF"} 
              />
            </View>
          )
        }}
      />

      <Tab.Screen 
        name="Monitoring" 
        component={MonitoringScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.container}>
              <Ionicons 
                name="radio-outline" 
                size={24} 
                color={focused ? "#10B981" : "#9CA3AF"} 
              />
            </View>
          )
        }}
      />

      <Tab.Screen 
        name="Marketplace" 
        component={MarketplaceScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.container}>
              <Ionicons 
                name="storefront-outline" 
                size={24} 
                color={focused ? "#10B981" : "#9CA3AF"} 
              />
            </View>
          )
        }}
      />

      {/* Ajout du 6e icône pour la Communauté AVANT Profile */}
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.container}>
              <Ionicons 
                name="people-outline" // ou "chatbubbles-outline" si tu préfères
                size={24} 
                color={focused ? "#10B981" : "#9CA3AF"} 
              />
            </View>
          )
        }}
      />

      <Tab.Screen 
        name="Profile" 
        component={Profile} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.container}>
              <Ionicons 
                name="person-outline" 
                size={24} 
                color={focused ? "#10B981" : "#9CA3AF"} 
              />
            </View>
          )
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: { 
    alignItems: "center", 
    justifyContent: "center",
    paddingVertical: 8,
  },
});

export default MainTabNavigator;
