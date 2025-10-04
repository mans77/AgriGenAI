import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CommunityScreen from '../screens/CommunityScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function MyTabs() {
  return (
    <Tab.Navigator>
      {/* ...tes autres tabs... */}
      <Tab.Screen
        name="Communauté"
        component={CommunityScreen}
        options={{
          tabBarLabel: 'Communauté',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}