import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import PromptScreen from '../screens/PromptScreen';
import TopicScreen from '../TopicCard';
import QuizScreen from '../screens/QuizScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return(
    <NavigationContainer>
      <Tab.Navigator>
        {/* <Tab.Screen name="Prompt" component={PromptScreen} /> */}
        <Tab.Screen name="Topic" component={TopicScreen} />
        <Tab.Screen name="QuizScreen" component={QuizScreen} />
        <Tab.Screen name="SignUp" component={SignUpScreen} />
        <Tab.Screen name="SignIn" component={SignInScreen} />
      </Tab.Navigator>
    </NavigationContainer>  
  );
}

export default TabNavigator;