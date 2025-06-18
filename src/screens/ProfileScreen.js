import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, Platform } from 'react-native';
import { databases, account, database1Id, UserAccountsId } from '../../constants';

const ProfileScreen = ({ navigation, onLogout }) => {
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
        const userDocs = await databases.getDocument(
          database1Id,
          UserAccountsId,
          currentUser.$id
        )
        console.log('Fetched Documents:', userDocs);
        setUserInfo(userDocs);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    console.log("User Info:", userInfo)
    fetchUserData();
  }, []);

  if (!userInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      Alert.alert('Logged out successfully');
      // Call the onLogout function to update the user state in MainNavigator
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout failed', error);
      Alert.alert('Error logging out, please try again.');
    }
  };

  const boardNumber = userInfo.educationBoard;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>
        
        {/* Main Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userInfo.name[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.nameText}>{userInfo.name}</Text>
          <Text style={styles.emailText}>{userInfo.email}</Text>
        </View>

        {/* Academic Info Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Grade</Text>
            <Text style={styles.infoValue}>{userInfo.grade}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Board</Text>
            <Text style={styles.infoValue}>
              {educationBoardData.find((board) => board.value === boardNumber)?.label || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* School Info Card */}
        <View style={styles.schoolCard}>
          <Text style={styles.infoLabel}>School</Text>
          <Text style={styles.schoolValue}>{userInfo.school}</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: -0.34,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  avatarContainer: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(10, 132, 255, 0.4)',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.42,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.28,
  },
  emailText: {
    fontSize: 16,
    color: '#EBEBF5',
    opacity: 0.8,
    textAlign: 'center',
    letterSpacing: -0.16,
  },
  infoGrid: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 400,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    flex: 0.48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  schoolCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#EBEBF5',
    opacity: 0.7,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.20,
  },
  schoolValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.18,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.9)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    // Enhanced neomorphism effect
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderRightColor: 'rgba(255, 69, 58, 0.4)',
    borderBottomColor: 'rgba(255, 69, 58, 0.4)',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  loadingText: {
    fontSize: 18,
    color: '#EBEBF5',
    opacity: 0.8,
    letterSpacing: -0.18,
  },
});

export default ProfileScreen;