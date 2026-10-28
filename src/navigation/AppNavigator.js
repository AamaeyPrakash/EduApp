import React, { useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AUTH_STATUS, PROFILE_STATUS, useAuth } from '../auth/AuthContext';
import StatusScreen from '../components/StatusScreen';
import { missingConfigKeys } from '../config';
import { getErrorMessage } from '../lib/errors';
import CourseScreen from '../screens/CourseScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PracticeScreen from '../screens/PracticeScreen';
import ProfileFormScreen from '../screens/ProfileFormScreen';
import QuestionTutorScreen from '../screens/QuestionTutorScreen';
import SearchScreen from '../screens/SearchScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import TopicScreen from '../screens/TopicScreen';
import TopicTutorScreen from '../screens/TopicTutorScreen';
import { useTheme } from '../theme';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

// Focused tasks (practice, the question tutor, editing details) slide up from the
// bottom like iOS sheets; everything else pushes from the side.
const SHEET = { animation: 'slide_from_bottom' };

// Picks the screens for the current auth state. Switching between them (e.g. after
// signing in or out) happens automatically when the auth state changes.
function RootStack() {
  const {
    status,
    profile,
    profileStatus,
    profileError,
    error,
    restoreSession,
  } = useAuth();
  const theme = useTheme();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }),
    [theme],
  );

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
      !profile &&
      !profileError)
  ) {
    return <StatusScreen loading />;
  }
  if (status === AUTH_STATUS.UNREACHABLE) {
    return (
      <StatusScreen
        icon="retry"
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
          <Stack.Screen name="Course" component={CourseScreen} />
          <Stack.Screen name="Topic" component={TopicScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen
            name="Practice"
            component={PracticeScreen}
            options={SHEET}
          />
          <Stack.Screen
            name="QuestionTutor"
            component={QuestionTutorScreen}
            options={SHEET}
          />
          <Stack.Screen
            name="TopicTutor"
            component={TopicTutorScreen}
            options={SHEET}
          />
          <Stack.Screen
            name="EditProfile"
            component={ProfileFormScreen}
            initialParams={{ mode: 'edit' }}
            options={SHEET}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const theme = useTheme();
  const navigationTheme = useMemo(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.tint,
        background: theme.colors.background,
        card: theme.colors.background,
        text: theme.colors.label,
        border: theme.colors.separator,
      },
    };
  }, [theme]);
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack />
    </NavigationContainer>
  );
}
