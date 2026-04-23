import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Header } from '../components/common';
import CameraSvg from '../../assets/images/profile/camera.svg';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../services/api/users';
import { getApiErrorMessage } from '../services/api/client';

type PersonalDataScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PersonalData'
>;

interface Props {
  navigation: PersonalDataScreenNavigationProp;
}

export const PersonalDataScreen: React.FC<Props> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const fullName = useMemo(
    () => `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
    [user?.firstName, user?.lastName],
  );
  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    position: user?.position ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Ошибка', 'Имя и фамилия обязательны');
      return;
    }
    setSaving(true);
    try {
      await usersApi.update({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        position: formData.position.trim() || null,
      });
      await refreshUser();
      Alert.alert('Готово', 'Данные обновлены');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось сохранить данные'));
    } finally {
      setSaving(false);
    }
  };

  const handleAboutUs = () => {
    navigation.navigate('AboutUs');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <MaterialCommunityIcons name="arrow-left" size={28} color="#212121" />
          </TouchableOpacity>
        }
        title="ЛИЧНЫЕ ДАННЫЕ"
      />

      <View className="flex-1 px-6 pt-6">
        {/* Profile Picture - same as ProfileScreen */}
        <View className="items-center mb-8">
          <View className="w-32 h-32 rounded-full bg-white items-center justify-center border-4 border-primary" style={{ elevation: 4 }}>
            <View className="w-28 h-28 bg-gray-300 rounded-full items-center justify-center relative">
              <MaterialCommunityIcons name="account" size={64} color="#757575" />
              <TouchableOpacity className="absolute inset-0 items-center justify-center w-full h-full">
                <CameraSvg width={38} height={38} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Display full name */}
        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <Text className="text-xs text-gray-500 mb-1">Текущее имя профиля</Text>
          <Text className="text-base text-text-primary">{fullName || '—'}</Text>
        </View>

        {/* Editable fields */}
        <View className="bg-white rounded-lg border border-gray-200 mb-4">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-xs text-gray-500 mb-1">Имя</Text>
            <TextInput
              value={formData.firstName}
              onChangeText={(firstName) => setFormData((prev) => ({ ...prev, firstName }))}
              className="text-base text-text-primary"
              placeholder="Введите имя"
            />
          </View>
          <View className="p-4 border-b border-gray-100">
            <Text className="text-xs text-gray-500 mb-1">Фамилия</Text>
            <TextInput
              value={formData.lastName}
              onChangeText={(lastName) => setFormData((prev) => ({ ...prev, lastName }))}
              className="text-base text-text-primary"
              placeholder="Введите фамилию"
            />
          </View>
          <View className="p-4 border-b border-gray-100">
            <Text className="text-xs text-gray-500 mb-1">Позиция / амплуа</Text>
            <TextInput
              value={formData.position}
              onChangeText={(position) => setFormData((prev) => ({ ...prev, position }))}
              className="text-base text-text-primary"
              placeholder="Например: Форвард"
            />
          </View>
          <View className="p-4">
            <Text className="text-xs text-gray-500 mb-1">Телефон (логин)</Text>
            <Text className="text-base text-gray-500">{formData.phone || '—'}</Text>
            <Text className="text-xs text-gray-400 mt-1">
              Изменение телефона/пароля сейчас не поддерживается сервером.
            </Text>
          </View>
        </View>

        {/* About Us Section */}
        <TouchableOpacity 
          className="bg-white rounded-lg p-4 flex-row items-center justify-between border border-gray-200"
          onPress={handleAboutUs}
        >
          <Text className="text-base text-text-primary">О НАС</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#757575" />
        </TouchableOpacity>

        {/* Save Button - at the bottom */}
        <View className="flex-1 justify-end pb-6">
          <TouchableOpacity 
            className={`rounded-lg py-4 ${saving ? 'bg-gray-400' : 'bg-primary'}`}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-bold">Сохранить</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}; 