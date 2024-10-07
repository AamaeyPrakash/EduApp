import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen'; 

const stack = createStackNavigator();

const AppNavigator = () => {

    return(
        <NavigationContainer>
            <stack.Navigator initialRouteName='SignUp'>
                <stack.Screen name="SignIn" component={ SignInScreen } />
                <stack.Screen name="SignUp" component={ SignUpScreen } />
            </stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;