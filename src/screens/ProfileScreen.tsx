import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import type { Lobby, Field } from '../types/api';
import { Header } from '../components/common';
import LogoWhite from '../../assets/images/logo_white.svg';
import CameraSvg from '../../assets/images/profile/camera.svg';
import { useAuth } from '../contexts/AuthContext';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
import { getApiErrorMessage } from '../services/api/client';

function getPlayerTier(rating: number): string {
  if (rating < 300) return 'Новичок';
  if (rating < 900) return 'Любитель';
  if (rating < 1800) return 'Полупрофи';
  if (rating < 3000) return 'Профи';
  return 'Легенда';
}

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

// ── Player stats card ──────────────────────────────────────────────────────────
interface PlayerStats {
  rating: string;
  tournaments: string;
  wins: string;
  matchesPlayed: string;
  streakWeeks: string;
  mode: string;
  position: string;
}

const StatsCard = ({ stats }: { stats: PlayerStats }) => (
  <View
    className="rounded-xl border border-primary mx-4 mb-5 overflow-hidden"
  >
    <View className="flex-row">
      {/* Left column */}
      <View className="flex-1 p-3" style={{ borderRightWidth: 1, borderRightColor: '#45AF31' }}>
        <StatRow label="Рейтинг:" value={stats.rating} suffix=" очков" />
        <StatRow label="Турниры:" value={stats.tournaments} suffix=" участия" />
        <StatRow label="Победы:" value={stats.wins} suffix=" турнира" />
        <StatRow label="Матчи сыграно:" value={stats.matchesPlayed} />
      </View>
      {/* Right column */}
      <View className="flex-1 p-3">
        <Text className="font-manrope-bold text-sm text-text-primary mb-1">
          <Text className="font-artico-bold text-base">{stats.streakWeeks}</Text> - недели подряд
        </Text>
        <Text className="font-manrope-medium text-xs text-text-primary mb-2">{stats.mode}</Text>
        <Text className="font-manrope-bold text-sm text-text-primary">Амплуа:</Text>
        <Text className="font-manrope-medium text-xs text-text-primary mt-0.5">{stats.position}</Text>
      </View>
    </View>
  </View>
);

const StatRow = ({
  label,
  value,
  suffix = '',
}: {
  label: string;
  value: string;
  suffix?: string;
}) => (
  <Text className="font-manrope-medium text-xs text-text-primary mb-1" numberOfLines={1}>
    {label}{' '}
    <Text className="font-manrope-bold text-primary">{value}</Text>
    <Text>{suffix}</Text>
  </Text>
);

// ── Main screen ────────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const { user, logout } = useAuth();
  const [myLobbies, setMyLobbies] = useState<Lobby[]>([]);
  const [lobbyFields, setLobbyFields] = useState<Record<string, Field>>({});
  const [lobbyJoinedCount, setLobbyJoinedCount] = useState<Record<string, number>>({});
  const [enterLobbyVisible, setEnterLobbyVisible] = useState(false);
  const [enterLobbyCode, setEnterLobbyCode] = useState('');
  const [enterLobbyLoading, setEnterLobbyLoading] = useState(false);
  useEffect(() => {
    lobbiesApi.mine().then(async (data) => {
      setMyLobbies(data);
      const ids = [...new Set(data.map((l) => l.fieldId))];
      const fetched = await Promise.all(ids.map((id) => fieldsApi.get(id).catch(() => null)));
      const playerCounts = await Promise.all(
        data.map((lobby) =>
          lobbiesApi
            .players(lobby.id)
            .then((players) => ({
              lobbyId: lobby.id,
              count: players.filter((p) => p.status === 'approved').length,
            }))
            .catch(() => ({ lobbyId: lobby.id, count: 0 })),
        ),
      );
      const map: Record<string, Field> = {};
      fetched.forEach((f) => { if (f) map[f.id] = f; });
      setLobbyFields(map);
      setLobbyJoinedCount(
        playerCounts.reduce<Record<string, number>>((acc, entry) => {
          acc[entry.lobbyId] = entry.count;
          return acc;
        }, {}),
      );
    }).catch(() => {});
  }, []);

  const tier = getPlayerTier(user?.rating ?? 0);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim().toUpperCase() || user.username?.toUpperCase() || '—'
    : '—';

  const handlePersonalDetails = () => {
    setShowDropdown(false);
    navigation.navigate('PersonalData');
  };

  const handleAboutUs = () => {
    setShowDropdown(false);
    navigation.navigate('AboutUs');
  };

  const handleLogOut = () => {
    setShowDropdown(false);
    Alert.alert('Выйти из аккаунта', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          });
        },
      },
    ]);
  };

  const handleEnterLobby = async () => {
    const code = enterLobbyCode.trim();
    if (!code) {
      Alert.alert('Ошибка', 'Введите код лобби');
      return;
    }

    setEnterLobbyLoading(true);
    try {
      let joined: Lobby | null = null;
      try {
        joined = await lobbiesApi.join(code, code);
      } catch {
        joined = await lobbiesApi.join(code);
      }

      setEnterLobbyVisible(false);
      setEnterLobbyCode('');
      navigation.navigate('BookingStep2', { lobbyId: joined.id, fieldId: joined.fieldId });
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось войти в лобби'));
    } finally {
      setEnterLobbyLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {showDropdown && (
        <TouchableOpacity
          className="absolute inset-0 z-40"
          onPress={() => setShowDropdown(false)}
          activeOpacity={1}
        />
      )}

      {/* Green header */}
      <View className="bg-primary" style={{ height: 160, position: 'relative' }}>
        <Header
          left={<LogoWhite width={100} height={40} style={{ marginTop: 16 }} />}
          right={
            <View className="relative">
              <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
                <MaterialCommunityIcons name="square-edit-outline" size={26} color="#fff" style={{ marginTop: 16 }} />
              </TouchableOpacity>
              {showDropdown && (
                <View className="absolute top-10 -right-5 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-44">
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3 border-b border-gray-100"
                    onPress={handlePersonalDetails}
                  >
                    <MaterialCommunityIcons name="account" size={20} color="#666" />
                    <Text className="ml-3 text-text-primary font-manrope-medium">Личные данные</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3 border-b border-gray-100"
                    onPress={handleAboutUs}
                  >
                    <MaterialCommunityIcons name="information-outline" size={20} color="#666" />
                    <Text className="ml-3 text-text-primary font-manrope-medium">О НАС</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3"
                    onPress={handleLogOut}
                  >
                    <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
                    <Text className="ml-3 text-red-500 font-manrope-medium">Выйти</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
          style={{ backgroundColor: 'transparent' }}
        />
        {/* Avatar overlapping green/white boundary */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: -64, alignItems: 'center', zIndex: 10 }}>
          <View className="w-32 h-32 rounded-full bg-white items-center justify-center border-4 border-white" style={{ elevation: 4 }}>
            <View className="w-28 h-28 bg-gray-300 rounded-full items-center justify-center relative overflow-hidden">
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <MaterialCommunityIcons name="account" size={64} color="#757575" />
              )}
              <TouchableOpacity
                className="absolute inset-0 items-center justify-center w-full h-full bg-black/15"
                onPress={handlePersonalDetails}
              >
                <CameraSvg width={38} height={38} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ marginTop: 72 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="bg-white">
        {/* Name + title */}
        <View className="items-center mt-2 mb-4 px-4">
          <Text className="text-[28px] font-artico-bold text-text-primary text-center" style={{ lineHeight: 32 }}>
            {displayName}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-base mr-1">🏆</Text>
            <Text className="font-manrope-medium text-sm text-text-primary">{tier}</Text>
          </View>
          {!!user?.username && (
            <Text className="font-manrope-medium text-sm text-gray-500 mt-1">@{user.username}</Text>
          )}
        </View>

        {/* Stats card */}
        <Text className="font-artico-bold text-[20px] text-text-primary mx-4 mb-2" style={{ letterSpacing: 0.5 }}>
          СТАТИСТИКА ИГРОКА
        </Text>
        <StatsCard stats={{
          rating: String(user?.rating ?? 0),
          tournaments: String(user?.tournamentCount ?? 0),
          wins: String(user?.wins ?? 0),
          matchesPlayed: String(myLobbies.length),
          streakWeeks: String(user?.streakWeeks ?? 0),
          mode: user?.isGuest ? 'Гостевой режим' : 'Активный режим',
          position: user?.position ?? '—',
        }} />

        <View className="px-4 mb-4">
          <TouchableOpacity
            onPress={() => setEnterLobbyVisible(true)}
            className="rounded-xl border border-primary px-4 py-3 flex-row items-center justify-center"
            style={{ gap: 8 }}
          >
            <MaterialCommunityIcons name="login" size={18} color="#45AF31" />
            <Text className="font-manrope-bold text-sm text-primary">Войти в лобби</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-200 mx-4 mb-4">
          {[
            { key: 'upcoming', label: 'Предстоящие матчи' },
            { key: 'history', label: 'История матчей' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-3 ${activeTab === tab.key ? 'border-b-2 border-primary' : ''}`}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text
                className={`text-center font-manrope-medium text-xs ${
                  activeTab === tab.key ? 'text-primary' : 'text-[#150000]'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View className="px-4">
          {activeTab === 'upcoming' ? (
            <>
              {myLobbies
                .filter((l) => ['active', 'full', 'paid', 'booked'].includes(l.status))
                .map((lobby) => {
                  const field = lobbyFields[lobby.fieldId];
                  return (
                    <TouchableOpacity
                      key={lobby.id}
                      className="mb-4 rounded-xl overflow-hidden bg-gray-100"
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('BookingStep2', { lobbyId: lobby.id, fieldId: lobby.fieldId, fromProfile: true })}
                    >
                      <Image
                        source={
                          field?.photos?.[0]
                            ? { uri: field.photos[0] }
                            : require('../../assets/images/stadium/stadium.png')
                        }
                        style={{ width: '100%', height: 116 }}
                        resizeMode="cover"
                      />
                      <View className="px-4 py-3">
                      <View className="flex-row items-center mb-1">
                        <MaterialCommunityIcons name="map-marker" size={14} color="#45AF31" />
                        <Text className="text-xs text-text-primary ml-1 font-manrope-medium" numberOfLines={1}>
                          {field?.address ?? '—'}
                        </Text>
                      </View>
                      <Text className="font-manrope-bold text-sm text-text-primary mb-1">
                        {field?.name ?? 'Лобби'}
                      </Text>
                      <Text className="text-xs text-[#5B5757]">
                        До: {lobby.expiresAt ? new Date(lobby.expiresAt).toLocaleDateString('ru-RU') : '—'}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <MaterialCommunityIcons name="account-group" size={14} color="#45AF31" />
                        <Text className="text-xs font-manrope-bold ml-1 text-text-primary">
                          {lobbyJoinedCount[lobby.id] ?? 0}/{lobby.maxPlayers} игроков
                        </Text>
                        <Text className="text-xs text-[#5B5757] ml-3">
                          {lobby.totalAmount.toLocaleString('ru-RU')} сум
                        </Text>
                      </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              {myLobbies.filter((l) => ['active', 'full', 'paid', 'booked'].includes(l.status)).length === 0 && (
                <Text className="text-center text-[#5B5757] font-manrope-medium mt-4">
                  Нет предстоящих матчей
                </Text>
              )}
            </>
          ) : activeTab === 'history' ? (
            <>
              {myLobbies
                .filter((l) => l.status === 'completed' || l.status === 'cancelled')
                .map((lobby) => {
                  const field = lobbyFields[lobby.fieldId];
                  return (
                    <TouchableOpacity
                      key={lobby.id}
                      className="mb-4 rounded-xl overflow-hidden bg-gray-100 px-4 py-3"
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('BookingStep2', { lobbyId: lobby.id, fieldId: lobby.fieldId, fromProfile: true })}
                    >
                      <View className="flex-row items-center mb-1">
                        <MaterialCommunityIcons name="map-marker" size={14} color="#45AF31" />
                        <Text className="text-xs text-text-primary ml-1 font-manrope-medium" numberOfLines={1}>
                          {field?.address ?? '—'}
                        </Text>
                      </View>
                      <Text className="font-manrope-bold text-sm text-text-primary mb-1">
                        {field?.name ?? 'Лобби'}
                      </Text>
                      <Text className="text-xs text-[#5B5757]">
                        Статус: {lobby.status === 'completed' ? 'Завершён' : 'Отменён'}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <MaterialCommunityIcons name="account-group" size={14} color="#45AF31" />
                        <Text className="text-xs font-manrope-bold ml-1 text-text-primary">
                          {lobbyJoinedCount[lobby.id] ?? 0}/{lobby.maxPlayers} игроков
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              {myLobbies.filter((l) => ['completed', 'cancelled'].includes(l.status)).length === 0 && (
                <Text className="text-center text-[#5B5757] font-manrope-medium mt-4">
                  Нет истории матчей
                </Text>
              )}
            </>
          ) : null}
        </View>
        </View>
      </ScrollView>

      <Modal visible={enterLobbyVisible} transparent animationType="slide" onRequestClose={() => setEnterLobbyVisible(false)}>
        <View className="flex-1 justify-end bg-black/35">
          <View className="rounded-t-3xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-2 font-manrope-bold text-base text-text-primary">Войти в лобби</Text>
            <Text className="mb-3 font-manrope-medium text-xs text-gray-500">
              Введите код приглашения, чтобы присоединиться к лобби
            </Text>
            <TextInput
              value={enterLobbyCode}
              onChangeText={setEnterLobbyCode}
              placeholder="Код приглашения"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!enterLobbyLoading}
              className="mb-3 rounded-xl border border-gray-200 px-3 py-2 text-text-primary"
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity
              onPress={() => void handleEnterLobby()}
              disabled={enterLobbyLoading}
              className="rounded-xl bg-primary py-3 items-center"
            >
              {enterLobbyLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="font-manrope-bold text-sm text-white">Войти</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (enterLobbyLoading) return;
                setEnterLobbyVisible(false);
              }}
              className="mt-3 rounded-xl border border-gray-200 py-3"
            >
              <Text className="text-center font-manrope-semibold text-sm text-text-primary">Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
