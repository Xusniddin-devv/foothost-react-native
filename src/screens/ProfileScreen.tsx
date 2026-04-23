import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import type { Lobby, Field } from '../types/api';
import { Header, Container, TeamCard, Button } from '../components/common';
import LogoWhite from '../../assets/images/logo_white.svg';
import CameraSvg from '../../assets/images/profile/camera.svg';
import { useAuth } from '../contexts/AuthContext';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';

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

interface Team {
  name: string;
  logo?: any;
}

const mockTeams = [
  { id: '1', name: 'CHELSEA', logo: null, onPress: () => {} },
  { id: '2', name: 'ARSENAL', logo: null, onPress: () => {} },
  { id: '3', name: 'MAN UNITED', logo: null, onPress: () => {} },
];

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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'teams'>('upcoming');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const { user, logout } = useAuth();
  const [myLobbies, setMyLobbies] = useState<Lobby[]>([]);
  const [lobbyFields, setLobbyFields] = useState<Record<string, Field>>({});

  useEffect(() => {
    lobbiesApi.mine().then(async (data) => {
      setMyLobbies(data);
      const ids = [...new Set(data.map((l) => l.fieldId))];
      const fetched = await Promise.all(ids.map((id) => fieldsApi.get(id).catch(() => null)));
      const map: Record<string, Field> = {};
      fetched.forEach((f) => { if (f) map[f.id] = f; });
      setLobbyFields(map);
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

  return (
    <SafeAreaView className="flex-1 bg-transparent">
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
        contentContainerStyle={{ paddingBottom: activeTab === 'teams' ? 100 : 24 }}
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
          mode: 'Активный режим',
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
          <TouchableOpacity
            className={`flex-1 py-3 ${activeTab === 'teams' ? 'border-b-2 border-primary' : ''}`}
            onPress={() => setActiveTab('teams')}
          >
            <Text
              className={`text-center font-manrope-medium text-xs ${activeTab === 'teams' ? 'text-primary' : 'text-[#150000]'}`}
            >
              Мои команды
            </Text>
          </TouchableOpacity>
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
                    <View key={lobby.id} className="mb-4 rounded-xl overflow-hidden bg-gray-100 px-4 py-3">
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
                          {lobby.maxPlayers} игроков
                        </Text>
                        <Text className="text-xs text-[#5B5757] ml-3">
                          {lobby.totalAmount.toLocaleString('ru-RU')} сум
                        </Text>
                      </View>
                    </View>
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
                    <View key={lobby.id} className="mb-4 rounded-xl overflow-hidden bg-gray-100 px-4 py-3">
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
                          {lobby.maxPlayers} игроков
                        </Text>
                      </View>
                    </View>
                  );
                })}
              {myLobbies.filter((l) => ['completed', 'cancelled'].includes(l.status)).length === 0 && (
                <Text className="text-center text-[#5B5757] font-manrope-medium mt-4">
                  Нет истории матчей
                </Text>
              )}
            </>
          ) : (
            <View>
              {mockTeams.map((team) => (
                <TeamCard key={team.id} name={team.name} logo={team.logo} onPress={team.onPress} />
              ))}
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      {/* Create team sticky button */}
      {activeTab === 'teams' && (
        <View className="absolute bottom-0 left-0 right-0 bg-white px-4 py-4">
          <Button
            title="Создать Команду"
            onPress={() => setShowCreateTeamModal(true)}
            variant="primary"
            className="w-full"
            textClassName="font-manrope-bold text-sm"
          />
        </View>
      )}

      {/* Create team modal */}
      <Modal
        visible={showCreateTeamModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateTeamModal(false)}
      >
        <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setShowCreateTeamModal(false)} />
          <View className="bg-white rounded-t-3xl shadow-lg" style={{ height: '70%' }}>
            <View className="bg-white rounded-t-3xl" style={{ height: 80 }}>
              <View className="flex-1 justify-center items-center">
                <Text className="text-lg font-manrope-bold text-text-primary">КОМАНДА</Text>
              </View>
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <View className="flex-1 px-4 pt-6">
                <TouchableOpacity className="p-2 mb-4" onPress={() => setShowCreateTeamModal(false)}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <View className="bg-gray-100 rounded-lg p-4 mb-6">
                  <View className="flex-row items-center">
                    <TouchableOpacity className="w-16 h-16 bg-gray-300 rounded-full items-center justify-center mr-4">
                      <CameraSvg width={24} height={24} />
                    </TouchableOpacity>
                    <View className="flex-1">
                      <TextInput
                        placeholder="Название команды"
                        placeholderTextColor="#9CA3AF"
                        className="text-base font-manrope-medium text-text-primary"
                        autoFocus
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                </View>
                <View className="flex-1" />
                <View className="pb-6">
                  <Button
                    title="СОЗДАТЬ"
                    onPress={() => {
                      setShowCreateTeamModal(false);
                      Alert.alert('Успешно', 'Команда создана!');
                    }}
                    variant="primary"
                    className="w-full"
                    textClassName="font-manrope-bold text-base"
                  />
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
