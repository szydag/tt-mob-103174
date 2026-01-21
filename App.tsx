import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Theme Primary color
const PRIMARY_COLOR = "#059669";

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="light" backgroundColor={PRIMARY_COLOR} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}