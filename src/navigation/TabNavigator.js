import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AppNavigator from './src/navigation/AppNavigator';
import HomeScreen from './src/screens/HomeScreen';
import DisplayScreen from './src/screens/DisplayScreen';


const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return(
    // <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Display" component={DisplayScreen} />
        <Tab.Screen name="Profile" component={AppNavigator} />
      </Tab.Navigator>
    // </NavigationContainer> 
  );
}

export default TabNavigator;