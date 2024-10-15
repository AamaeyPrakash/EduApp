import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import AppNavigator from '../navigation/AppNavigator';

const ProfileScreen = ({navigation}) => {
  return (
    <View>
      <AppNavigator/>
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  )
}
const styles = StyleSheet.create({
  linkText: {
    color: '#3B82F6',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
},
});

export default ProfileScreen