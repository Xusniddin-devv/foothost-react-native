import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { OnboardingScreen, RegisterScreen, LoginScreen, TournamentDetailsScreen } from '../screens';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PersonalDataScreen } from '../screens/PersonalDataScreen';
import { AboutUsScreen } from '../screens/AboutUsScreen';
import { PhoneVerificationScreen } from '../screens/PhoneVerificationScreen';
import { BookingStep1Screen } from '../screens/BookingStep1Screen';
import { BookingStep2Screen } from '../screens/BookingStep2Screen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { BookingStep3Screen } from '../screens/BookingStep3Screen';
import { MatchRatingScreen } from '../screens/MatchRatingScreen';
import { MainTabNavigator, MAIN_APP_SHELL } from './MainTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="Main"
          options={{
            /**
             * Transparent stack card so pushes (BookingStep1, etc.) don’t inherit a white overlay
             * from this route. The white shell is scoped to the inner View below — only Main tabs.
             */
            cardStyle: { backgroundColor: 'transparent' },
          }}
        >
          {(props) => (
            <View style={{ flex: 1, backgroundColor: MAIN_APP_SHELL }}>
              <MainTabNavigator {...props} />
            </View>
          )}
        </Stack.Screen>
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="PersonalData" component={PersonalDataScreen} />
        <Stack.Screen name="AboutUs" component={AboutUsScreen} />
        <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
        <Stack.Screen name="BookingStep1" component={BookingStep1Screen} />
        <Stack.Screen name="BookingStep2" component={BookingStep2Screen} />
        <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
        <Stack.Screen name="TournamentDetails" component={TournamentDetailsScreen} />
        <Stack.Screen 
          name="BookingStep3" 
          component={BookingStep3Screen} 
          options={{ 
            presentation: 'transparentModal', 
            headerShown: false,
            gestureEnabled: true,
            cardStyle: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
          }} 
        />
        <Stack.Screen name="MatchRating" component={MatchRatingScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}; 