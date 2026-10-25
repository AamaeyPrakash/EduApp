import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import askIcon from '../assets/askIcon.png';
import homeIcon from '../assets/homeIcon.png';
import profileIcon from '../assets/profileIcon.png';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PromptScreen from '../screens/PromptScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const TAB_BAR_HEIGHT = 65;
const ICONS = {
  Home: homeIcon,
  AskGPT: askIcon,
  Profile: profileIcon,
};

function TabIcon({ routeName, color, size, focused }) {
  return (
    <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
      <Image
        source={ICONS[routeName]}
        style={{ tintColor: color, width: size * 0.8, height: size * 0.8 }}
      />
    </View>
  );
}

// Defined once so the tab bar doesn't receive a new component on every render.
const TAB_BAR_ICONS = Object.fromEntries(
  Object.keys(ICONS).map(routeName => [
    routeName,
    props => <TabIcon routeName={routeName} {...props} />,
  ]),
);

export default function TabNavigator() {
  // The tab bar sits above the home indicator / Android navigation bar.
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: TAB_BAR_ICONS[route.name],
        tabBarLabelStyle: styles.label,
        tabBarIconStyle: styles.icon,
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: 4 + insets.bottom,
          },
        ],
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AskGPT" component={PromptScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingTop: 4,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    paddingBottom: 3,
    letterSpacing: -0.12,
  },
  icon: {
    marginTop: 2,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
});
