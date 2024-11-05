import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import AppNavigator from './src/navigation/AppNavigator'
import SignInScreen from './src/screens/SignInScreen'
import MathJax from './src/mathJax'

const App = () => {
  return (
    <AppNavigator/>
    // <MathJax />
  )
}
export default App