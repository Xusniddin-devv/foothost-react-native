import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import 'react-native-gesture-handler';
import './global.css';
import { AppNavigator } from './src/navigation';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        // Artico Fonts
        'Artico-Black': require('./assets/fonts/Artico/artico-extracond-black.otf'),
        'Artico-Bold': require('./assets/fonts/Artico/cretype - Artico ExtraCond Bold.otf'),
        'Artico-Medium': require('./assets/fonts/Artico/cretype  Artico ExtraCond Medium.otf'),
        'Artico-BlackItalic': require('./assets/fonts/Artico/Artico ExtraCond Black Italic.ttf'),
        
        // ManRope Fonts
        'ManRope-ExtraLight': require('./assets/fonts/ManRope/Manrope-ExtraLight.ttf'),
        'ManRope-Light': require('./assets/fonts/ManRope/Manrope-Light.ttf'),
        'ManRope-Regular': require('./assets/fonts/ManRope/Manrope-Regular.ttf'),
        'ManRope-Medium': require('./assets/fonts/ManRope/Manrope-Medium.ttf'),
        'ManRope-SemiBold': require('./assets/fonts/ManRope/Manrope-SemiBold.ttf'),
        'ManRope-Bold': require('./assets/fonts/ManRope/Manrope-Bold.ttf'),
        'ManRope-ExtraBold': require('./assets/fonts/ManRope/Manrope-ExtraBold.ttf'),
      });
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-background-default">
        <StatusBar style="auto" />
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
} 