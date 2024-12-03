import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { databases, account, database1Id, UserAccountsId } from '../../constants';

const ProfileScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);

  const educationBoardData = [
    { label: 'CBSE', value: '1' },
    { label: 'IGCSE', value: '2' },
    { label: 'GCSE', value: '3' },
    { label: 'MYP', value: '4' },
    { label: 'IB', value: '5' },
    { label: 'A Levels or AS', value: '6' },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await account.get();
        console.log('Fetched Current User:', currentUser);
        const result = await databases.listDocuments(database1Id, UserAccountsId);
        console.log('Fetched Documents:', result.documents);
        for (let i = 0; i < result.documents.length; i++) {
          const doc = result.documents[i];
          // console.log(Checking Document: ${doc.userId} vs Current User: ${currentUser.$id});
          if (doc.userId === currentUser.$id) {
            // console.log('Matching User Found:', doc);
            setUserInfo(doc);
            break;
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    console.log("User Info:", userInfo)
    fetchUserData();
  }, []);

  if (!userInfo) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      Alert.alert('Logged out successfully');
      navigation.navigate('SignIn');
    } catch (error) {
      console.error('Logout failed', error);
      Alert.alert('Error logging out, please try again.');
    }
  };

  const boardNumber = userInfo.educationBoard

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{userInfo.name[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.nameText}>{userInfo.name}</Text>
        <Text style={styles.emailText}>{userInfo.email}</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{userInfo.age}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Grade</Text>
            <Text style={styles.infoValue}>{userInfo.grade}</Text>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Board</Text>
            <Text style={styles.infoValue}>
              {educationBoardData.find((board) => board.value === boardNumber)?.label || 'Unknown'}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>School</Text>
            <Text style={styles.infoValue}>{userInfo.school}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#E4E7EB',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  infoBox: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
});

export default ProfileScreen;
