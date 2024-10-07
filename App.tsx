import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import SignUpScreen from './src/screens/SignUpScreen'
import PromptScreen from './src/screens/PromptScreen'
import Question from './src/Question'
import AppNavigator from './src/navigation/AppNavigator'

const App = () => {
  return (
    <SignUpScreen/>
  )
}

const styles= StyleSheet.create({
  container: {
    flex:1
  },
})
export default App