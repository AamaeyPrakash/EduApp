import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import PromptScreen from '../screens/PromptScreen';


const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return(
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="SignUp" component={SignUpScreen} />
        <Tab.Screen name="SignIn" component={SignInScreen} />
        <Tab.Screen name="Prompt" component={PromptScreen} />
      </Tab.Navigator>
    </NavigationContainer>
      
  );
}

export default TabNavigator;