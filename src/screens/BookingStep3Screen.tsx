import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { SuccessModal } from '../components/common';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
import { getApiErrorMessage } from '../services/api/client';
import type { Field, Lobby } from '../types/api';

type BookingStep3ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'BookingStep3'
>;

type BookingStep3ScreenRouteProp = RouteProp<RootStackParamList, 'BookingStep3'>;

interface Props {
  navigation: BookingStep3ScreenNavigationProp;
  route: BookingStep3ScreenRouteProp;
}

function formatExpiry(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const BookingStep3Screen: React.FC<Props> = ({ navigation, route }) => {
  const lobbyId = route?.params?.lobbyId;
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState<boolean>(!!lobbyId);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!lobbyId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const l = await lobbiesApi.get(lobbyId);
        if (cancelled) return;
        setLobby(l);
        if (l.fieldId) {
          const f = await fieldsApi.get(l.fieldId).catch(() => null);
          if (!cancelled && f) setField(f);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lobbyId]);

  const handleSubmit = async () => {
    if (!lobbyId || submitting) return;
    setSubmitting(true);
    try {
      const updated = await lobbiesApi.publish(lobbyId);
      setLobby(updated);
      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось подтвердить бронирование'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('Main');
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => navigation.goBack()}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-4">
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => navigation.goBack()}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
          />

          {/* Sheet content */}
          <View
            className="bg-white rounded-2xl p-6 relative"
            style={{ width: '100%', maxWidth: 400 }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ position: 'absolute', top: 18, right: 18, zIndex: 10 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
            >
              <MaterialCommunityIcons name="close" size={28} color="#758A80" />
            </TouchableOpacity>

            <Text className="text-[24px] font-artico-bold text-text-primary mb-4 self-start">
              БРОНИРОВАНИЕ
            </Text>

            {loading ? (
              <View className="py-12">
                <ActivityIndicator size="large" color="#45AF31" />
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" style={{ width: '100%' }}>
                <View className="w-full mb-4">
                  <Text className="font-manrope-bold text-sm text-text-primary mb-1">
                    Поле
                  </Text>
                  <Text className="font-manrope-medium text-sm text-[#758A80]">
                    {field?.name ?? '—'}
                  </Text>
                </View>

                <View className="w-full mb-4">
                  <Text className="font-manrope-bold text-sm text-text-primary mb-1">
                    Действует до
                  </Text>
                  <Text className="font-manrope-medium text-sm text-[#758A80]">
                    {formatExpiry(lobby?.expiresAt)}
                  </Text>
                </View>

                <View className="w-full mb-6">
                  <Text className="font-manrope-bold text-sm text-text-primary mb-1">
                    Стоимость
                  </Text>
                  <Text className="font-manrope-medium text-sm text-[#758A80]">
                    {lobby
                      ? `${lobby.totalAmount.toLocaleString('ru-RU')} сум`
                      : '—'}
                  </Text>
                </View>

                <TouchableOpacity
                  className="bg-primary rounded-lg items-center py-4 w-full"
                  onPress={handleSubmit}
                  activeOpacity={0.7}
                  disabled={!lobby || submitting}
                  style={{ opacity: !lobby || submitting ? 0.5 : 1 }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white font-manrope-bold text-base">
                      Подтвердить бронирование
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="ЗАЯВКА ОТПРАВЛЕНА"
        message="Ваша заявка на бронирование успешно отправлена. Мы свяжемся с вами в ближайшее время."
      />
    </Modal>
  );
};
