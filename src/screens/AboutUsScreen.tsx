import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Header } from '../components/common';

type AboutUsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AboutUs'
>;

interface Props {
  navigation: AboutUsScreenNavigationProp;
}

const aboutLinks: Array<{ id: number; title: string }> = [
  { id: 1, title: 'Договор оферты' },
  { id: 2, title: 'Политика конфиденциальности' },
  { id: 3, title: 'Связаться с нами' },
];

export const AboutUsScreen: React.FC<Props> = ({ navigation }) => {
  const handleLinkPress = (title: string) => {
    Alert.alert(title, 'Раздел будет доступен в ближайшее время.');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="#212121" />
          </TouchableOpacity>
        }
        title="О НАС"
      />

      <View className="flex-1 px-6 pt-6">
        {/* Grouped Fields Block */}
        <View className="bg-white rounded-lg border border-gray-200 mb-4">
          {aboutLinks.map((link, idx) => (
            <TouchableOpacity
              key={link.id}
              className={`flex-row items-center justify-between p-4 ${
                idx < aboutLinks.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onPress={() => handleLinkPress(link.title)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={link.title}
            >
              <Text className="text-base text-text-primary font-manrope-medium">{link.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#757575" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Copyright Text - at the bottom */}
        <View className="flex-1 justify-end pb-6">
          <View className="bg-white rounded-lg p-6 border border-gray-200">
            <Text className="text-lg font-artico-bold text-text-primary mb-4">FOOT HOST</Text>
            <Text className="text-sm text-text-secondary mb-2 font-manrope-medium">
              Версия приложения: 1.0.0
            </Text>
            <Text className="text-sm text-text-secondary mb-2 font-manrope-medium">
              © 2024 Foot Host. Все права защищены.
            </Text>
            <Text className="text-sm text-text-secondary font-manrope-medium">
              Приложение для поиска и бронирования футбольных полей в Ташкенте.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
