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
import { Input, Container, Button } from '../components/common';
import LogoWhite from '../../assets/images/logo_white.svg';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../services/api/client';

type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Ошибка', 'Пожалуйста, согласитесь с условиями');
      return;
    }

    setLoading(true);
    try {
      const { phone } = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phoneNumber.trim(),
        password: formData.password,
      });
      navigation.navigate('PhoneVerification', { phoneNumber: phone });
    } catch (err) {
      Alert.alert('Ошибка регистрации', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" />
      
      {/* Green Header Section - Fixed height */}
      <View className="h-[25%] relative">
        {/* Large background text */}
        <Text
          className="absolute text-white/10 font-artico-bold tracking-widest"
          style={{ 
            fontSize: 128,
            top: '20%',
            left: '50%',
            textAlign: 'right'
          }}
        >
          JOIN
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
              СОЗДАЙТЕ СВОЙ ID{'\n'}И НАЧНИТЕ ИГРАТЬ
            </Text>
          </View>
        </Container>
      </View>

      {/* White Content Area - Takes remaining space */}
      <View className="flex-1 bg-white rounded-t-3xl">
        <Container padding="sm" className="flex-1 pt-8">
          <View className="flex-1">
            <Input
              placeholder="Имя"
              value={formData.firstName}
              onChangeText={(text) =>
                setFormData({ ...formData, firstName: text })
              }
              autoCapitalize="words"
              className="mb-4"
            />

            <Input
              placeholder="Фамилия"
              value={formData.lastName}
              onChangeText={(text) =>
                setFormData({ ...formData, lastName: text })
              }
              autoCapitalize="words"
              className="mb-4"
            />

            <Input
              placeholder="Номер телефона"
              value={formData.phoneNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, phoneNumber: text })
              }
              keyboardType="phone-pad"
              className="mb-4"
            />

            <Input
              placeholder="Пароль"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry
              className="mb-4"
            />

            <Text className="text-xs text-text-secondary mb-6 leading-5 font-manr">
              Пароль должен быть длинной не менее 8 символов и использовать
              1 заглавную букву и 1 символ.
            </Text>

            <View className="mb-6">
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              >
                <View className={`w-5 h-5 border-2 rounded mr-3 ${agreeToTerms ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                  {agreeToTerms && (
                    <Text className="text-white text-xs text-center">✓</Text>
                  )}
                </View>
                <Text className="text-sm text-text-grays100 font-manrope-medium flex-1">
                  Я согласен с Условиями и Политикой конфиденциальности
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="ЗАРЕГИСТРИРОВАТЬСЯ"
              onPress={handleRegister}
              variant="primary"
              disabled={!agreeToTerms}
              loading={loading}
              textClassName="font-artico-medium text-xl"
              className="mb-2"
            />

            <Text className="text-xs text-text-grays80 text-left leading-5 mt-2">
              Соглашаясь с вышеуказанными условиями, вы даете согласие на сбор,
              хранение и обработку ваших персональных данных
            </Text>
          </View>
        </Container>
      </View>
    </SafeAreaView>
  );
}; 