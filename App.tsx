import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StudyProvider } from './src/study/StudyContext';

function App() {
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={scheme === 'light' ? 'dark-content' : 'light-content'}
      />
      <AuthProvider>
        <StudyProvider>
          <AppNavigator />
        </StudyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
