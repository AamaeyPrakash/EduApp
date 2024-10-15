import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import PromptScreen from '../screens/PromptScreen';
import TopicCardAA from '../TopicCardAA';
import MathQuizScreen from '../screens/MathQuizScreen';
import TopicCardAI from '../TopicCardAI';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator>
        <Tab.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
        <Tab.Screen name="PromptScreen" component={PromptScreen} options={{ headerShown: false }}/>
        <Tab.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }}/>
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
        <Stack.Screen name="Math AA" component={TopicCardAA} />
        <Stack.Screen name="Math AI" component={TopicCardAI} />
        <Stack.Screen name="QuizScreen" component={MathQuizScreen} />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
