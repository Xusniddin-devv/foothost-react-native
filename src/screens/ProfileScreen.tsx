import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import type { Lobby, Field, Team, LobbyPlayer, LobbyType, User } from '../types/api';
import { Header, Container } from '../components/common';
import LogoWhite from '../../assets/images/logo_white.svg';
import CameraSvg from '../../assets/images/profile/camera.svg';
import ParkingSvg from '../../assets/images/booking/parking.svg';
import ShowerSvg from '../../assets/images/booking/shower.svg';
import OutfitChangeSvg from '../../assets/images/booking/outfitChange.svg';
import SeatsSvg from '../../assets/images/booking/seats.svg';
import LightedSvg from '../../assets/images/booking/lighted.svg';
import TimeOfWorkSvg from '../../assets/images/booking/timeofWork.svg';
import LengthOfFieldSvg from '../../assets/images/booking/lengthofField.svg';
import TypeOfFieldSvg from '../../assets/images/booking/typeofField.svg';
import TypeOfPitchSvg from '../../assets/images/booking/typeofPitch.svg';
import { useAuth } from '../contexts/AuthContext';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
import { usersApi } from '../services/api/users';
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

// ── Stadium detail helpers ─────────────────────────────────────────────────────
const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View className="bg-gray-100 rounded-lg p-3 flex-1 flex-row items-center h-full">
    {icon}
    <View className="ml-2">
      <Text className="font-manrope-bold text-xs">{label}</Text>
      <Text className="font-manrope-medium text-[10px] mt-1">{value}</Text>
    </View>
  </View>
);

const AmenityItem = ({ icon, label, available }: { icon: React.ReactNode; label: string; available: boolean }) => (
  <View className="flex-row items-center">
    {icon}
    <View className="ml-2">
      <Text className="font-manrope-bold text-xs">{label}</Text>
      <Text className={`font-manrope-medium text-xs ${available ? 'text-green-600' : 'text-red-600'}`}>
        {available ? 'Есть' : 'Нет'}
      </Text>
    </View>
  </View>
);

function extractLatLng(mapUrl: string): { lat: number; lng: number } | null {
  const decoded = decodeURIComponent(mapUrl);
  const llMatch = decoded.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (llMatch) return { lng: Number(llMatch[1]), lat: Number(llMatch[2]) };
  const googleMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (googleMatch) return { lat: Number(googleMatch[1]), lng: Number(googleMatch[2]) };
  const queryMatch = decoded.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) return { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) };
  return null;
}

// ── Main screen ────────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const { user, logout } = useAuth();
  const [myLobbies, setMyLobbies] = useState<Lobby[]>([]);
  const [lobbyFields, setLobbyFields] = useState<Record<string, Field>>({});
  const [lobbyJoinedCount, setLobbyJoinedCount] = useState<Record<string, number>>({});
  const [selectedLobby, setSelectedLobby] = useState<Lobby | null>(null);
  const [selectedLobbyTeams, setSelectedLobbyTeams] = useState<Team[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedLobbyPlayers, setSelectedLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [inviteModal, setInviteModal] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);

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
    ? `${user.firstName} ${user.lastName}`.trim().toUpperCase()
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

  const openLobbyDetails = async (lobby: Lobby) => {
    setSelectedLobby(lobby);
    setDetailsLoading(true);
    try {
      const [teams, players] = await Promise.all([
        lobbiesApi.teams(lobby.id).catch(() => [] as Team[]),
        lobbiesApi.players(lobby.id).catch(() => [] as LobbyPlayer[]),
      ]);
      setSelectedLobbyTeams(teams);
      setSelectedLobbyPlayers(players);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeLobbyDetails = () => {
    setSelectedLobby(null);
    setSelectedLobbyTeams([]);
    setSelectedLobbyPlayers([]);
  };

  const selectedField = selectedLobby ? lobbyFields[selectedLobby.fieldId] : null;
  const isCreator = !!(selectedLobby && user?.id === selectedLobby.creatorId);

  const mapPreviewUrl = useMemo(() => {
    if (!selectedField?.mapUrl) return null;
    const coords = extractLatLng(selectedField.mapUrl);
    if (!coords) return null;
    return `https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=${coords.lng},${coords.lat}&size=650,300&z=15&l=map&pt=${coords.lng},${coords.lat},pm2rdm`;
  }, [selectedField?.mapUrl]);

  const openMap = useCallback(async () => {
    if (!selectedField?.mapUrl) return;
    try {
      const supported = await Linking.canOpenURL(selectedField.mapUrl);
      if (!supported) {
        Alert.alert('Ошибка', 'Не удалось открыть ссылку карты');
        return;
      }
      await Linking.openURL(selectedField.mapUrl);
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть ссылку карты');
    }
  }, [selectedField?.mapUrl]);

  useEffect(() => {
    if (!inviteModal || !selectedLobby) return;
    let cancelled = false;
    setFriendsLoading(true);
    usersApi
      .friends(friendQuery)
      .then((data) => {
        if (!cancelled) setFriends(data);
      })
      .catch(() => {
        if (!cancelled) setFriends([]);
      })
      .finally(() => {
        if (!cancelled) setFriendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inviteModal, friendQuery, selectedLobby]);

  const refreshLobbyDetails = async () => {
    if (!selectedLobby) return;
    const [freshLobby, freshPlayers, freshTeams] = await Promise.all([
      lobbiesApi.get(selectedLobby.id),
      lobbiesApi.players(selectedLobby.id),
      lobbiesApi.teams(selectedLobby.id),
    ]);
    setSelectedLobby(freshLobby);
    setSelectedLobbyPlayers(freshPlayers);
    setSelectedLobbyTeams(freshTeams);
    setLobbyJoinedCount((prev) => ({
      ...prev,
      [selectedLobby.id]: freshPlayers.filter((p) => p.status === 'approved').length,
    }));
  };

  const handleInviteFriend = async (friendId: string) => {
    if (!selectedLobby) return;
    try {
      await lobbiesApi.invite(selectedLobby.id, friendId);
      await refreshLobbyDetails();
      setInviteModal(false);
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось пригласить игрока'));
    }
  };

  const handleKickPlayer = async (targetUserId: string) => {
    if (!selectedLobby) return;
    try {
      await lobbiesApi.kick(selectedLobby.id, targetUserId);
      await refreshLobbyDetails();
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось удалить игрока'));
    }
  };

  const handleChangeType = async (type: LobbyType) => {
    if (!selectedLobby) return;
    try {
      const updated = await lobbiesApi.updateType(selectedLobby.id, type);
      setSelectedLobby(updated);
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось изменить тип лобби'));
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
              <MaterialCommunityIcons name="account" size={64} color="#757575" />
              <TouchableOpacity className="absolute inset-0 items-center justify-center w-full h-full">
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
                      onPress={() => void openLobbyDetails(lobby)}
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
                      onPress={() => void openLobbyDetails(lobby)}
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

      <Modal visible={!!selectedLobby} transparent animationType="slide" onRequestClose={closeLobbyDetails}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white px-4 pt-4" style={{ maxHeight: '90%' }}>
            {/* Fixed header */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-artico-bold text-[20px] text-text-primary">Детали лобби</Text>
              <TouchableOpacity onPress={closeLobbyDetails}>
                <MaterialCommunityIcons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
              {selectedLobby ? (
                <>
                  {/* Hero image */}
                  <Image
                    source={
                      selectedField?.photos?.[0]
                        ? { uri: selectedField.photos[0] }
                        : require('../../assets/images/stadium/stadium.png')
                    }
                    style={{ width: '100%', height: 140, borderRadius: 12 }}
                    resizeMode="cover"
                  />

                  {/* Name + rating */}
                  <View className="flex-row items-center mt-3">
                    <Text className="font-artico-medium text-2xl text-text-primary flex-shrink">{selectedField?.name ?? 'Лобби'}</Text>
                    {selectedField?.rating != null && (
                      <View className="bg-primary rounded-md px-2 py-1 ml-2 flex-row items-center">
                        <Text className="text-white font-bold text-sm mr-1">{Number(selectedField.rating).toFixed(1)}</Text>
                        <MaterialCommunityIcons name="star" size={14} color="white" />
                      </View>
                    )}
                  </View>

                  {/* Address */}
                  <View className="flex-row items-center mt-1">
                    <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
                    <Text className="text-gray-500 font-manrope-medium text-xs ml-1">{selectedField?.address ?? '—'}</Text>
                  </View>

                  {/* Price + reviews */}
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="font-artico-medium text-xl text-text-primary">
                      {selectedField?.pricePerHour != null ? `${Number(selectedField.pricePerHour).toLocaleString('ru-RU')} СУМ` : '—'}
                    </Text>
                    <Text className="font-manrope-medium text-xs text-gray-500">
                      {selectedField?.reviewsCount != null ? `${selectedField.reviewsCount} отзывов` : ''}
                    </Text>
                  </View>

                  {/* Lobby type */}
                  <Text className="mt-1 font-manrope-medium text-xs text-gray-500">
                    Тип: {selectedLobby.type === 'open' ? 'Открытое' : selectedLobby.type === 'invite_only' ? 'По приглашению' : 'Закрытое'}
                  </Text>

                  {/* Field specs */}
                  <View className="mt-4 mb-2">
                    <View className="flex-row mb-2">
                      <InfoCard icon={<TypeOfPitchSvg width={36} height={36} />} label="Покрытие" value={selectedField?.description ?? '—'} />
                      <View className="w-2" />
                      <InfoCard icon={<TypeOfFieldSvg width={36} height={36} />} label="Тип площадки" value={selectedField?.pitchType ?? '—'} />
                    </View>
                    <View className="flex-row">
                      <InfoCard icon={<LengthOfFieldSvg width={36} height={36} />} label="Длина х Ширина (м)" value={selectedField?.dimensions ?? '—'} />
                      <View className="w-2" />
                      <InfoCard icon={<TimeOfWorkSvg width={36} height={36} />} label="Время работы" value={selectedField?.workTime ?? '—'} />
                    </View>
                  </View>

                  {/* Amenities */}
                  {(() => {
                    const amenities = (selectedField?.amenities ?? {}) as Record<string, boolean>;
                    return (
                      <View className="mt-4 mb-2">
                        <Text className="font-artico-medium text-base mb-3">УДОБСТВО:</Text>
                        <View className="flex-row justify-between">
                          <View style={{ gap: 12 }}>
                            <AmenityItem icon={<ParkingSvg width={28} height={28} />} label="Парковка" available={amenities.parking ?? false} />
                            <AmenityItem icon={<ShowerSvg width={28} height={28} />} label="Душ" available={amenities.shower ?? false} />
                          </View>
                          <View style={{ gap: 12 }}>
                            <AmenityItem icon={<OutfitChangeSvg width={28} height={28} />} label="Раздевалки" available={amenities.locker ?? false} />
                            <AmenityItem icon={<SeatsSvg width={28} height={28} />} label="Трибуны" available={amenities.tribune ?? false} />
                          </View>
                          <View style={{ gap: 12 }}>
                            <AmenityItem icon={<LightedSvg width={28} height={28} />} label="Освещение" available={amenities.lighting ?? false} />
                          </View>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Map */}
                  <View className="mt-4 mb-4">
                    <Text className="font-artico-medium text-base mb-3">МЕСТОПОЛОЖЕНИЕ:</Text>
                    {mapPreviewUrl ? (
                      <TouchableOpacity onPress={openMap} activeOpacity={0.85}>
                        <Image source={{ uri: mapPreviewUrl }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
                      </TouchableOpacity>
                    ) : selectedField?.mapUrl ? (
                      <TouchableOpacity
                        onPress={openMap}
                        activeOpacity={0.85}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 items-center justify-center px-4"
                        style={{ height: 160 }}
                      >
                        <MaterialCommunityIcons name="map-marker" size={28} color="#45AF31" />
                        <Text className="font-manrope-semibold text-sm text-text-primary mt-2 text-center">
                          Открыть в Яндекс/Google Maps
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Image source={require('../../assets/images/map-placeholder.png')} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
                    )}
                  </View>

                  {/* Players / payment */}
                  <View className="mt-4 rounded-xl border border-gray-200 p-3">
                    <Text className="font-manrope-semibold text-sm text-text-primary">
                      Игроки: {lobbyJoinedCount[selectedLobby.id] ?? 0}/{selectedLobby.maxPlayers}
                    </Text>
                    <Text className="mt-1 font-manrope-semibold text-sm text-text-primary">
                      Оплачено: {Number(selectedLobby.confirmedTotal ?? 0).toLocaleString('ru-RU')} / {Number(selectedLobby.totalAmount ?? 0).toLocaleString('ru-RU')} сум
                    </Text>
                  </View>

                  {/* Teams */}
                  <View className="mt-4 rounded-xl border border-gray-200 p-3">
                    <Text className="mb-2 font-manrope-semibold text-sm text-text-primary">Названия команд</Text>
                    {detailsLoading ? (
                      <Text className="font-manrope-medium text-xs text-gray-500">Загрузка...</Text>
                    ) : selectedLobbyTeams.length > 0 ? (
                      selectedLobbyTeams.map((team) => (
                        <Text key={team.id} className="mb-1 font-manrope-medium text-sm text-text-primary">
                          • {team.name}
                        </Text>
                      ))
                    ) : (
                      <Text className="font-manrope-medium text-xs text-gray-500">Команды еще не назначены</Text>
                    )}
                  </View>

                  {/* Players list */}
                  <View className="mt-4 rounded-xl border border-gray-200 p-3">
                    <Text className="mb-2 font-manrope-semibold text-sm text-text-primary">Игроки лобби</Text>
                    {selectedLobbyPlayers.length > 0 ? (
                      selectedLobbyPlayers
                        .filter((p) => p.status === 'approved')
                        .map((player) => (
                          <View key={player.userId} className="mb-2 flex-row items-center justify-between">
                            <Text className="font-manrope-medium text-sm text-text-primary">
                              {player.user?.firstName ?? 'Игрок'} {player.user?.lastName ?? ''}
                            </Text>
                            {isCreator && player.userId !== user?.id ? (
                              <TouchableOpacity onPress={() => handleKickPlayer(player.userId)} className="rounded-lg border border-red-300 px-2 py-1">
                                <Text className="font-manrope-semibold text-xs text-red-500">Удалить</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        ))
                    ) : (
                      <Text className="font-manrope-medium text-xs text-gray-500">Игроков нет</Text>
                    )}
                  </View>

                  {/* Creator management */}
                  {isCreator ? (
                    <View className="mt-4">
                      <Text className="mb-2 font-manrope-semibold text-sm text-text-primary">Управление лобби</Text>
                      <View className="mb-2 flex-row" style={{ gap: 8 }}>
                        {([
                          { key: 'open', label: 'Открытое' },
                          { key: 'invite_only', label: 'По приглашению' },
                          { key: 'closed', label: 'Закрытое' },
                        ] as Array<{ key: LobbyType; label: string }>).map((option) => (
                          <TouchableOpacity
                            key={option.key}
                            onPress={() => void handleChangeType(option.key)}
                            className={`rounded-lg px-3 py-2 ${selectedLobby.type === option.key ? 'bg-primary' : 'border border-gray-300'}`}
                          >
                            <Text className={`text-xs font-manrope-semibold ${selectedLobby.type === option.key ? 'text-white' : 'text-text-primary'}`}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity onPress={() => { setFriendQuery(''); setInviteModal(true); }} className="rounded-xl bg-primary py-3">
                        <Text className="text-center font-manrope-bold text-sm text-white">Пригласить игрока</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={inviteModal} transparent animationType="slide" onRequestClose={() => setInviteModal(false)}>
        <View className="flex-1 justify-end bg-black/35">
          <View className="rounded-t-3xl bg-white px-4 pb-8 pt-4" style={{ maxHeight: '72%' }}>
            <Text className="mb-2 font-manrope-bold text-base text-text-primary">Пригласить из друзей</Text>
            <TextInput
              value={friendQuery}
              onChangeText={setFriendQuery}
              placeholder="Поиск по имени или телефону"
              className="mb-3 rounded-xl border border-gray-200 px-3 py-2 text-text-primary"
              placeholderTextColor="#9CA3AF"
            />
            {friendsLoading ? (
              <View className="py-8">
                <ActivityIndicator size="small" color="#45AF31" />
              </View>
            ) : (
              <ScrollView>
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    onPress={() => void handleInviteFriend(friend.id)}
                    className="mb-2 flex-row items-center justify-between rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <View>
                      <Text className="font-manrope-semibold text-sm text-text-primary">
                        {friend.firstName} {friend.lastName}
                      </Text>
                      <Text className="font-manrope-medium text-xs text-gray-500">{friend.phone ?? 'Без номера'}</Text>
                    </View>
                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#45AF31" />
                  </TouchableOpacity>
                ))}
                {friends.length === 0 ? (
                  <Text className="py-8 text-center font-manrope-medium text-sm text-gray-500">
                    Друзья не найдены
                  </Text>
                ) : null}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setInviteModal(false)} className="mt-4 rounded-xl border border-gray-200 py-3">
              <Text className="text-center font-manrope-semibold text-sm text-text-primary">Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
