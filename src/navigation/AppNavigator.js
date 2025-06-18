import React, {useState, useEffect} from 'react';
import {Image, View, ActivityIndicator, StyleSheet} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import PromptScreen from '../screens/PromptScreen';
import MathQuizScreen from '../screens/MathQuizScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TopicCardAA from '../TopicCardAA';
import TopicCardAI from '../TopicCardAI';

import homeIcon from '../assets/homeIcon.png'
import askIcon from '../assets/askIcon.png'
import profileIcon from '../assets/profileIcon.png'
import { account } from '../../constants';
import TopicCardCBSE12 from '../TopicCardCBSE12';
import QuizScreenCB12 from '../screens/QuizScreenCB12';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const extraTabOptions = {
  tabBarLabelStyle: { 
    fontFamily: 'exo',
    fontSize: 10, // Reduced from 12
    fontWeight: '600',
    paddingBottom: 3, // Reduced from 5
    letterSpacing: -0.12,
  },
  tabBarStyle: { 
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderTopRightRadius: 20, // Reduced from 20
    borderTopLeftRadius: 20, // Reduced from 20
    paddingVertical: 4, // Reduced from 8
    paddingHorizontal: 8, // Reduced from 10
    height: 65, // Reduced from 90
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'absolute',
  },
  tabBarActiveTintColor: '#0A84FF',
  tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
  tabBarIconStyle: {
    marginTop: 2, // Reduced from 5
  },
};

const TabNavigator = ({user, onLogout}) => {
  return (

    <Tab.Navigator screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}>
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({color, size, focused}) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Image
                source={homeIcon}
                style={[
                  styles.tabIcon,
                  {
                    tintColor: color,
                    width: size * 0.8, // Reduced icon size by 20%
                    height: size * 0.8, // Reduced icon size by 20%
                  }
                ]}
              />
            </View>
          ),
          ...extraTabOptions,
        }}
      >
        {props => <HomeScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="AskGPT"
        options={{
          tabBarIcon: ({color, size, focused}) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Image
                source={askIcon}
                style={[
                  styles.tabIcon,
                  {
                    tintColor: color,
                    width: size * 0.8, // Reduced icon size by 20%
                    height: size * 0.8, // Reduced icon size by 20%
                  }
                ]}
              />
            </View>
          ),
          ...extraTabOptions,
        }}
      >
        {props => <PromptScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({color, size, focused}) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Image
                source={profileIcon}
                style={[
                  styles.tabIcon,
                  {
                    tintColor: color,
                    width: size * 0.8, // Reduced icon size by 20%
                    height: size * 0.8, // Reduced icon size by 20%
                  }
                ]}
              />
            </View>
          ),
          ...extraTabOptions,
        }}
      >
        {props => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const AppNavigator = ({user, onLogout}) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Tabs"
        options={{ headerShown: false }} 
      >
        {props => <TabNavigator {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen 
        name="Math AA"
        options={{ headerShown: false }}
      >
        {props => <TopicCardAA {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="Math AI"
        options={{ headerShown: false }}
      >
        {props => <TopicCardAI {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="CBSE 12"
        options={{ headerShown: false }}
      >
        {props => <TopicCardCBSE12 {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen 
        name="QuizScreen"
        options={{ headerShown: false }}
      >
        {props => <MathQuizScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="CBQuizScreen"
        options={{ headerShown: false }}
      >
        {props => <QuizScreenCB12 {...props} user={user}/>}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const AuthNavigator = ({onLogin}) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="SignIn"
        options={{ headerShown: false }}
      >
        {props => <SignInScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen
        name="SignUp"
        options={{ headerShown: false }}
      >
        {props => <SignUpScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

const MainNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkActiveSession = async () => {
    try {
      const userSession = await account.get();
      console.log("User session:", userSession);
      return userSession;
    } catch (error) {
      console.log("No active session found");
      return null;
    }
  }

  const handleLogin = async () => {
    try {
      const userSession = await checkActiveSession();
      setUser(userSession);
    } catch (error) {
      console.error("Error during login refresh:", error);
      setUser(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const userSession = await checkActiveSession();
        if (isMounted) {
          setUser(userSession);
        }
      } catch (error) {
        console.error("Error verifying session:", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      {user ? (
        <AppNavigator user={user} onLogout={handleLogout} />
      ) : (
        <AuthNavigator onLogin={handleLogin} />
      )}
    </NavigationContainer>
  )
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  iconContainer: {
    padding: 6, // Reduced from 8
    borderRadius: 10, // Reduced from 12
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  tabIcon: {
    // Base icon styles
  },
});

export default MainNavigator;