import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Container, Header } from '../components/common';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
import { getApiErrorMessage } from '../services/api/client';
import type { Lobby, Field } from '../types/api';

type TournamentsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Tournaments'
>;

interface Props {
  navigation: TournamentsScreenNavigationProp;
}

function formatExpiry(iso: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export const TournamentsScreen: React.FC<Props> = ({ navigation }) => {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [fields, setFields] = useState<Record<string, Field>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await lobbiesApi.listOpen();
      setLobbies(data);
      const fieldIds = [...new Set(data.map((l) => l.fieldId))];
      const fetched = await Promise.all(fieldIds.map((id) => fieldsApi.get(id).catch(() => null)));
      const map: Record<string, Field> = {};
      fetched.forEach((f) => { if (f) map[f.id] = f; });
      setFields(map);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить лобби'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <View className="bg-white">
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
          title="ТУРНИРЫ"
        />
      </View>

      <ScrollView
        className="flex-1 bg-transparent"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#45AF31" />
        }
      >
        <Container padding="sm">
          {loading ? (
            <ActivityIndicator size="large" color="#45AF31" className="mt-8" />
          ) : error ? (
            <View className="mt-8 items-center">
              <Text className="text-center text-red-500 font-manrope-medium mb-3">
                {error}
              </Text>
              <TouchableOpacity
                className="rounded-xl bg-primary px-4 py-2"
                onPress={loadData}
                activeOpacity={0.7}
              >
                <Text className="font-manrope-bold text-sm text-white">Повторить</Text>
              </TouchableOpacity>
            </View>
          ) : lobbies.length === 0 ? (
            <Text className="text-center text-[#5B5757] font-manrope-medium mt-8">
              Нет открытых лобби. Потяните вниз, чтобы обновить.
            </Text>
          ) : (
            lobbies.map((lobby) => {
              const field = fields[lobby.fieldId];
              return (
                <TouchableOpacity
                  key={lobby.id}
                  className="bg-gray-100 rounded-xl px-4 py-3 mb-4 shadow-sm active:bg-gray-200"
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('BookingStep2', {
                      lobbyId: lobby.id,
                      fieldId: lobby.fieldId,
                      fromProfile: true,
                    })
                  }
                >
                  <Text className="text-lg font-manrope-bold text-text-primary mb-1">
                    {field?.name ?? 'Лобби'}
                  </Text>
                  <Text className="text-base text-[#150000] mb-0.5">
                    {lobby.teamCount}x{lobby.teamCount} — {lobby.durationHours}ч
                  </Text>
                  <Text className="text-base text-[#150000] mb-2">
                    Стоимость:{' '}
                    <Text className="font-manrope-bold">
                      {lobby.totalAmount.toLocaleString('ru-RU')}
                    </Text>{' '}
                    сум
                  </Text>
                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="map-marker" size={18} color="#45AF31" />
                      <Text className="text-xs text-text-primary ml-1 font-manrope-bold" numberOfLines={1}>
                        {field?.address ?? '—'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="account-group" size={18} color="#45AF31" />
                      <Text className="text-xs text-text-primary ml-1 font-manrope-bold">
                        {lobby.maxPlayers}
                      </Text>
                    </View>
                    <Text className="text-xs text-text-primary font-manrope-bold">
                      {formatExpiry(lobby.expiresAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};
