import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StudyProvider } from './src/study/StudyContext';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <AuthProvider>
        <StudyProvider>
          <AppNavigator />
        </StudyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
