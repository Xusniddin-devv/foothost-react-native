import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Header } from '../components/common';
import LogoWhite from '../../assets/images/logo_white.svg';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api/auth';
import { getApiErrorMessage } from '../services/api/client';

type PhoneVerificationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PhoneVerification'
>;

type PhoneVerificationScreenRouteProp = RouteProp<
  RootStackParamList,
  'PhoneVerification'
>;

interface Props {
  navigation: PhoneVerificationScreenNavigationProp;
  route: PhoneVerificationScreenRouteProp;
}

const CODE_LENGTH = 6;

export const PhoneVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { verifyOtp } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [resendTime, setResendTime] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const phoneNumber = route.params?.phoneNumber ?? '';

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTime((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (!clean && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    const joined = next.join('');
    if (joined.length === CODE_LENGTH && next.every((d) => d !== '')) {
      Keyboard.dismiss();
      submit(joined);
    }
  };

  const submit = async (code: string) => {
    if (!phoneNumber) {
      Alert.alert('Ошибка', 'Номер телефона отсутствует');
      return;
    }
    setSubmitting(true);
    try {
      await verifyOtp({ phone: phoneNumber, code });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Неверный код'));
      setDigits(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendTime > 0 || !phoneNumber) return;
    try {
      await authApi.resendOtp(phoneNumber);
      setResendTime(60);
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось отправить код'));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background-default">
      <View className="bg-primary">
        <View className="pt-8">
          <Header
            left={<LogoWhite width={100} height={40} style={{ marginTop: 16 }} />}
            style={{ backgroundColor: 'transparent' }}
          />
        </View>

        <View className="px-6 pb-8 mt-6">
          <Text className="text-[28px] font-artico-bold text-white text-center mb-2">
            ПОДТВЕРЖДЕНИЕ НОМЕРА
          </Text>
          <Text className="text-white font-manrope-medium text-[24px] text-center mb-2">
            {phoneNumber}
          </Text>
          <Text className="text-white text-xs text-center">
            Мы отправили вам SMS с 6-значным кодом
          </Text>
        </View>
      </View>

      <View className="flex-1 px-6 pt-8">
        <View className="flex-row justify-center mb-8" style={{ gap: 8 }}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              value={digit}
              onChangeText={(v) => handleChange(index, v)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!submitting}
              textAlign="center"
              className="w-12 h-14 border-2 rounded-lg border-gray-300 text-2xl font-bold text-text-primary"
              style={{
                borderColor: digit ? '#1F7A1F' : '#D1D5DB',
                backgroundColor: digit ? 'rgba(31, 122, 31, 0.08)' : 'white',
              }}
            />
          ))}
        </View>

        <View className="px-6 mb-8">
          <Text className="text-center text-gray-600 text-sm">
            Введите 6-значный код подтверждения
          </Text>
        </View>

        <TouchableOpacity
          className={`w-full py-3 rounded-lg ${resendTime === 0 ? 'bg-primary' : 'bg-gray-300'}`}
          onPress={handleResend}
          disabled={resendTime > 0}
        >
          <Text
            className={`text-center text-[20px] font-artico-medium ${
              resendTime === 0 ? 'text-white' : 'text-gray-600'
            }`}
          >
            {resendTime === 0 ? 'ОТПРАВИТЬ ЕЩЁ РАЗ' : `ПОВТОР ЧЕРЕЗ ${formatTime(resendTime)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
