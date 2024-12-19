import React, {useState, useEffect} from 'react';
import {Image, View, ActivityIndicator} from 'react-native';
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


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const extraTabOptions = {
  tabBarLabelStyle: { fontFamily: 'exo' },
  tabBarStyle: { borderTopRightRadius: 12, borderTopLeftRadius: 12, paddingVertical:3 },
  tabBarActiveTintColor:'#1C4E80',
  tabBarInactiveTintColor: '#364356',
  tabBarLabelStyle:{paddingBottom:3},
};


const TabNavigator = ({user}) => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        // component={HomeScreen}
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
      >
        {props => <HomeScreen {...props}  user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="AskGPT"
        // component={PromptScreen}
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
      >
        {props => <PromptScreen {...props}  user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        // component={ProfileScreen}
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
      >
        {props => <ProfileScreen {...props}  user={user} />}
      </Tab.Screen>
      {/* <Tab.Screen name="Sign In" component={SignInScreen}/> */}
    </Tab.Navigator>
  );
};

const AppNavigator = ({user}) => {
  return (
      <Stack.Navigator>
        <Stack.Screen
          name="Tabs"
          // component={TabNavigator}
          options={{ headerShown: false }} 
        >
          {props => <TabNavigator {...props}  user={user} />}
        </Stack.Screen>
        <Stack.Screen 
          name="Math AA" 
          // component={TopicCardAA}
          // options={{ headerShown: false }}
        >
          {props => <TopicCardAA {...props}  user={user} />}
        </Stack.Screen>
        <Stack.Screen
          name="Math AI"
          // component={TopicCardAI}
          // options={{ headerShown: false }}
        >
          {props => <TopicCardAI {...props}  user={user} />}
        </Stack.Screen>
        <Stack.Screen 
          name="QuizScreen" 
          // component={MathQuizScreen} 
          // options={{ headerShown: false }}
        >
          {props => <MathQuizScreen {...props}  user={user} />}
        </Stack.Screen>
      </Stack.Navigator>
  );
};

const AuthNavigator = () =>{
  return (
    <Stack.Navigator>
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
  )
}
const MainNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);


  const checkActiveSession = async () => {
    try {
      const unsubscribe = await account.get();
      console.log("User session:", unsubscribe);
      return unsubscribe;
    } catch (error) {
      // console.error("Failed to get user session:", error);
      return null;
    }
  }

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const user = await checkActiveSession();
        if (isMounted) {
          setUser(user ? true : false);
        }
      } catch (error) {
        console.error("Error verifying session:", error);
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1C4E80" />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      {user ? <AppNavigator/> : <AuthNavigator/>}
    </NavigationContainer>
  )
};
export default MainNavigator;