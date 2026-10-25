import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AUTH_STATUS, PROFILE_STATUS, useAuth } from '../auth/AuthContext';
import StatusScreen from '../components/StatusScreen';
import { missingConfigKeys } from '../config';
import { getErrorMessage } from '../lib/errors';
import CBSETopicsScreen from '../screens/CBSETopicsScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import IBTopicsScreen from '../screens/IBTopicsScreen';
import MathQuizScreen from '../screens/MathQuizScreen';
import ProfileFormScreen from '../screens/ProfileFormScreen';
import QuizScreenCB12 from '../screens/QuizScreenCB12';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { colors } from '../theme';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
  },
};

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
};

// Picks the screens for the current auth state. Switching between them (e.g. after
// signing in or out) happens automatically when the auth state changes.
function RootStack() {
  const { status, profile, profileStatus, error, restoreSession } = useAuth();

  if (status === AUTH_STATUS.MISCONFIGURED) {
    return (
      <StatusScreen
        title="App setup needed"
        message={`Missing settings: ${missingConfigKeys.join(
          ', ',
        )}.\nCopy .env.example to .env, fill in your Appwrite details and rebuild the app.`}
      />
    );
  }
  if (
    status === AUTH_STATUS.LOADING ||
    (status === AUTH_STATUS.SIGNED_IN &&
      profileStatus === PROFILE_STATUS.LOADING &&
      !profile)
  ) {
    return <StatusScreen loading />;
  }
  if (status === AUTH_STATUS.UNREACHABLE) {
    return (
      <StatusScreen
        title="Can't connect"
        message={getErrorMessage(error)}
        actions={[{ title: 'Try Again', onPress: restoreSession }]}
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {status !== AUTH_STATUS.SIGNED_IN ? (
        <Stack.Group>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
        </Stack.Group>
      ) : profileStatus === PROFILE_STATUS.MISSING ? (
        <Stack.Screen
          name="CompleteProfile"
          component={ProfileFormScreen}
          initialParams={{ mode: 'complete' }}
        />
      ) : (
        <Stack.Group>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen
            name="Math AA"
            component={IBTopicsScreen}
            initialParams={{ course: 'AA' }}
          />
          <Stack.Screen
            name="Math AI"
            component={IBTopicsScreen}
            initialParams={{ course: 'AI' }}
          />
          <Stack.Screen name="CBSE 12" component={CBSETopicsScreen} />
          <Stack.Screen name="QuizScreen" component={MathQuizScreen} />
          <Stack.Screen name="CBQuizScreen" component={QuizScreenCB12} />
          <Stack.Screen
            name="EditProfile"
            component={ProfileFormScreen}
            initialParams={{ mode: 'edit' }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <RootStack />
    </NavigationContainer>
  );
}
