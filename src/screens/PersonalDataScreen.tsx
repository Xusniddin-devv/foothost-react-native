import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
    username: user?.username ?? '',
    phone: user?.phone ?? '',
    position: user?.position ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

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
        username: formData.username.trim() || null,
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

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Ошибка', 'Нет доступа к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploadingAvatar(true);
      await usersApi.uploadAvatar(result.assets[0].uri, result.assets[0].fileName ?? undefined);
      await refreshUser();
      Alert.alert('Готово', 'Фото профиля обновлено');
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось обновить фото профиля'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    const currentPassword = passwordData.currentPassword.trim();
    const newPassword = passwordData.newPassword.trim();
    const confirmPassword = passwordData.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполните все поля пароля');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Ошибка', 'Новый пароль должен быть не короче 6 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Ошибка', 'Подтверждение пароля не совпадает');
      return;
    }

    setChangingPassword(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Готово', 'Пароль успешно изменен');
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось изменить пароль'));
    } finally {
      setChangingPassword(false);
    }
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
            <View className="w-28 h-28 bg-gray-300 rounded-full items-center justify-center relative overflow-hidden">
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="account" size={64} color="#757575" />
              )}
              <TouchableOpacity
                className="absolute inset-0 items-center justify-center w-full h-full bg-black/15"
                onPress={() => void handlePickAvatar()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <CameraSvg width={38} height={38} />
                )}
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
            <Text className="text-xs text-gray-500 mb-1">Username</Text>
            <TextInput
              value={formData.username}
              onChangeText={(username) => setFormData((prev) => ({ ...prev, username }))}
              className="text-base text-text-primary"
              placeholder="Например: admin_user"
              autoCapitalize="none"
              autoCorrect={false}
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
          </View>
        </View>

        <View className="bg-white rounded-lg border border-gray-200 mb-4 px-4 py-3">
          <Text className="text-xs text-gray-500 mb-2">Сменить пароль</Text>
          <TextInput
            value={passwordData.currentPassword}
            onChangeText={(currentPassword) => setPasswordData((prev) => ({ ...prev, currentPassword }))}
            className="text-base text-text-primary border border-gray-200 rounded-lg px-3 py-2 mb-2"
            placeholder="Текущий пароль"
            secureTextEntry
          />
          <TextInput
            value={passwordData.newPassword}
            onChangeText={(newPassword) => setPasswordData((prev) => ({ ...prev, newPassword }))}
            className="text-base text-text-primary border border-gray-200 rounded-lg px-3 py-2 mb-2"
            placeholder="Новый пароль"
            secureTextEntry
          />
          <TextInput
            value={passwordData.confirmPassword}
            onChangeText={(confirmPassword) => setPasswordData((prev) => ({ ...prev, confirmPassword }))}
            className="text-base text-text-primary border border-gray-200 rounded-lg px-3 py-2"
            placeholder="Повторите новый пароль"
            secureTextEntry
          />
          <TouchableOpacity
            className={`mt-3 rounded-lg py-3 ${changingPassword ? 'bg-gray-400' : 'bg-primary'}`}
            onPress={() => void handleChangePassword()}
            disabled={changingPassword}
          >
            {changingPassword ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-sm font-bold">Изменить пароль</Text>
            )}
          </TouchableOpacity>
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