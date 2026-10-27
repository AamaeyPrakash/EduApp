import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBar from '../components/TabBar';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TutorScreen from '../screens/TutorScreen';

const Tab = createBottomTabNavigator();

// Defined once so the navigator doesn't receive a new component on every render.
const renderTabBar = props => <TabBar {...props} />;

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: 'home' }}
      />
      <Tab.Screen
        name="Tutor"
        component={TutorScreen}
        options={{ tabBarIcon: 'sparkles' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: 'person' }}
      />
    </Tab.Navigator>
  );
}
