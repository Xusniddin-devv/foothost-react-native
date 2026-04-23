import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Input, Container, LoginButton, RegisterButton } from '../components/common';
import LogoWhite from '../../assets/images/logo_white.svg';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../services/api/client';

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.phoneNumber || !formData.password) {
      Alert.alert('Ошибка', 'Введите телефон и пароль');
      return;
    }
    setLoading(true);
    try {
      await login({
        phone: formData.phoneNumber.trim(),
        password: formData.password,
      });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      Alert.alert('Ошибка входа', getApiErrorMessage(err, 'Неверный телефон или пароль'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" />
      
      {/* Green Header Section - Fixed height */}
      <View className="h-[30%] relative">
        {/* Large background text */}
        <Text
          className="absolute text-white/10 font-artico-bold tracking-widest"
          style={{ 
            fontSize: 128,
            top: '30%',
            left: '22%',
            textAlign: 'right'
          }}
        >
          SIGN IN
        </Text>

        {/* Logo - positioned like OnboardingScreen */}
        <Container padding="sm" className="flex-1">
          <View className="flex-row justify-between items-center pt-8">
            <View className="flex-row items-center">
              <LogoWhite width={100} height={40} />
            </View>
          </View>

          {/* Instructional text */}
          <View className="flex-1 justify-end">
            <Text className="text-white font-artico-medium text-[28px] leading-relaxed">
              ВОЙДИТЕ, ИСПОЛЬЗУЯ{'\n'}ВАШ ЛОГИН И ПАРОЛЬ
            </Text>
          </View>
        </Container>
      </View>

      {/* White Content Area - Takes remaining space */}
      <View className="flex-1 bg-white rounded-t-3xl">
        <Container padding="sm" className="flex-1 pt-8">
          <View className="flex-1">
            <Input
              placeholder="Phone number"
              value={formData.phoneNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, phoneNumber: text })
              }
              keyboardType="default"
              autoCapitalize="none"
              className="mb-4"
            />

            <Input
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry
              className="mb-4"
            />

            <TouchableOpacity className="self-end mb-6">
              <Text className="text-base text-text-secondary">Забыли пароль?</Text>
            </TouchableOpacity>

            <LoginButton 
              onPress={handleLogin} 
              loading={loading}
              className="mb-4"
            />

            <View className="flex-row items-center mb-4 mt-4" >
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="text-lg text-text-secondary mx-4">или</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            <RegisterButton
              onPress={() => navigation.navigate('Register')}
            />
          </View>
        </Container>
      </View>
    </SafeAreaView>
  );
};