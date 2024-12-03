import React from 'react';
import {Image} from 'react-native';
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


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const extraTabOptions = {
  tabBarLabelStyle: { fontFamily: 'exo' },
  tabBarStyle: { borderTopRightRadius: 12, borderTopLeftRadius: 12 },
  tabBarActiveTintColor:'#1C4E80',
  tabBarInactiveTintColor: '#364356',
};


const TabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon(props) {
            return (
              <Image
                source={homeIcon}
                style={{
                  tintColor: props.color,
                  width: props.size,
                  height: props.size,
                }}
                {...props}
              />
            );
          },
          ...extraTabOptions,
        }}
      />
      <Tab.Screen
        name="AskGPT"
        component={PromptScreen}
        options={{
          headerShown: false,
          tabBarIcon(props) {
            return (
              <Image
                source={askIcon}
                style={{
                  tintColor: props.color,
                  width: props.size,
                  height: props.size,
                }}
                {...props}
              />
            );
          },
          ...extraTabOptions,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon(props) {
            return (
              <Image
                source={profileIcon}
                style={{
                  tintColor: props.color,
                  width: props.size,
                  height: props.size,
                }}
                {...props}
              />
            );
          },
          ...extraTabOptions,
        }}
      />
      <Tab.Screen name="Sign In" component={SignInScreen}/>
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Math AA" 
          component={TopicCardAA}
          // options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Math AI"
          component={TopicCardAI}
          // options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="QuizScreen" 
          component={MathQuizScreen} 
          // options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
