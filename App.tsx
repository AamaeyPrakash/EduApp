import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import SignUpScreen from './src/SignUpScreen'
import PromptScreen from './src/PromptScreen'
import Question from './src/Question'

const App = () => {
  return (
    <View style={styles.container}>
      <PromptScreen />
    </View>
  )
}

const styles= StyleSheet.create({
  container: {
    flex:1
  },
})
export default App