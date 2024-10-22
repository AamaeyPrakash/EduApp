import { View, Text, TouchableOpacity, StyleSheet, Alert, Button } from 'react-native'
import React, {useEffect} from 'react'
import {account} from '../../constants'


const ProfileScreen = ({navigation}) => {
  
  useEffect(() => {
    const checkActiveSession = async () => {
        try {
            const session = await account.getSession('current');
            console.log(session)
            if (!session) {
              navigation.navigate('SignUp');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };
    checkActiveSession();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      Alert.alert("Logged out successfully");
      // checkActiveSession();
      navigation.navigate('SignIn'); 
    } catch (error) {
      console.error("Logout failed", error);
      Alert.alert("Error logging out, please try again.");
    }
  };

  return (
    <View style={styles.container}>
          <Button title="Logout" onPress={handleLogout} />
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