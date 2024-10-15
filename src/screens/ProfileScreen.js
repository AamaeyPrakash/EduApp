import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import React, {useEffect} from 'react'
import {account} from '../../constants'


const ProfileScreen = ({navigation}) => {
  
  useEffect(() => {
    const checkActiveSession = async () => {
        try {
            const session = await account.getSession('current');
            if (!session) {
              navigation.navigate('SignUp');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };
    checkActiveSession();
}, []);

  return (
    <View style={styles.container}>
      <Text>Hi</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    padding: 20,
},
});

export default ProfileScreen