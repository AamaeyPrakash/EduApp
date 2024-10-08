import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen'; 
import PromptScreen from '../screens/PromptScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {

    return(
        <NavigationContainer>
            <Stack.Navigator initialRouteName='SignUp'>
                <Stack.Screen name="SignUp" component={ SignUpScreen } />
                <Stack.Screen name="SignIn" component={ SignInScreen } />
                <Stack.Screen name="Prompt" component={ PromptScreen } />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;