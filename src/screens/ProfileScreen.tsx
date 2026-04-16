import React, { useState } from 'react';
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
import { Header, Container, MatchCard, TeamCard, Button } from '../components/common';
import LogoWhite from '../../assets/images/logo_white.svg';
import CameraSvg from '../../assets/images/profile/camera.svg';
import ChelseaSvg from '../../assets/images/profile/chelsea.svg';
import MyuSvg from '../../assets/images/profile/MYU.svg';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

interface Team {
  name: string;
  logo?: any;
}

const mockUser = {
  name: 'ШУКУР ГАЙНУТДИНОВ',
  title: 'Полупрофи',
  stats: {
    rating: '2 900',
    tournaments: '7',
    wins: '3',
    matchesPlayed: '58',
    streakWeeks: '3',
    mode: 'Активный режим',
    position: 'Вратарь / Полузащитник',
  },
};

const mockUpcomingMatches = [
  {
    id: '1',
    location: 'Малая кольцевая...',
    dateTime: '24.12.2025 - 18:00',
    teams: [
      { name: 'CHELSEA', logo: <ChelseaSvg width={64} height={64} /> },
      { name: 'MAN UTD', logo: <MyuSvg width={64} height={64} /> },
    ] as [Team, Team],
    title: 'Weekend Battle',
    stadiumName: 'Chilonzor Stadium',
    cost: 'Стоимость: 200 000 с команды',
    participants: '12/10',
    image: undefined,
    onPress: () => console.log('Match 1 pressed'),
  },
  {
    id: '2',
    location: 'Малая кольцевая...',
    dateTime: '24.12.2025 - 18:00',
    teams: [
      { name: 'CHELSEA', logo: <ChelseaSvg width={64} height={64} /> },
      { name: 'MAN UTD', logo: <MyuSvg width={64} height={64} /> },
    ] as [Team, Team],
    title: 'Weekend Battle',
    stadiumName: 'Chilonzor Stadium',
    cost: 'Стоимость: 200 000 с команды',
    participants: '12/10',
    image: require('../../assets/images/stadium/stadium.png'),
    onPress: () => console.log('Match 2 pressed'),
  },
];

const mockPastMatches = [
  {
    id: '1',
    location: 'Малая кольцевая...',
    dateTime: '20.12.2025 - 18:00',
    teams: [
      { name: 'ARSENAL', logo: null },
      { name: 'LIVERPOOL', logo: null },
    ] as [Team, Team],
    title: 'Weekend Battle',
    stadiumName: 'Chilonzor Stadium',
    cost: 'Стоимость: 200 000 с команды',
    participants: '12/12',
    image: undefined,
    onPress: () => console.log('Past Match 1 pressed'),
  },
];

const mockTeams = [
  { id: '1', name: 'CHELSEA', logo: <ChelseaSvg width={48} height={48} />, onPress: () => {} },
  { id: '2', name: 'ARSENAL', logo: null, onPress: () => {} },
  { id: '3', name: 'MAN UNITED', logo: <MyuSvg width={48} height={48} />, onPress: () => {} },
];

const mockRecommendedLobbies = [
  {
    id: '1',
    location: 'Малая кольцевая...',
    dateTime: '24.12.2025 - 18:00',
    title: 'Weekend Battle: Chilonzor Stadium',
    subtitle: 'Открытое лобби рядом с вами',
    participants: '12/10',
    image: require('../../assets/images/stadium/stadium.png'),
  },
];

// ── Player stats card ──────────────────────────────────────────────────────────
const StatsCard = ({ stats }: { stats: typeof mockUser.stats }) => (
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

// ── Lobby card ─────────────────────────────────────────────────────────────────
const LobbyCard = ({
  item,
}: {
  item: (typeof mockRecommendedLobbies)[number];
}) => (
  <TouchableOpacity
    className="rounded-xl overflow-hidden mb-3"
    style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
    activeOpacity={0.85}
  >
    {/* Image */}
    <View style={{ height: 120 }}>
      <Image source={item.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      {/* Meta row */}
      <View className="absolute top-0 left-0 right-0 flex-row justify-between px-3 pt-2">
        <View className="flex-row items-center bg-black/40 rounded-full px-2 py-0.5">
          <MaterialCommunityIcons name="map-marker" size={10} color="white" />
          <Text className="text-white font-manrope-medium text-[10px] ml-1">{item.location}</Text>
        </View>
        <View className="flex-row items-center bg-black/40 rounded-full px-2 py-0.5">
          <MaterialCommunityIcons name="calendar" size={10} color="white" />
          <Text className="text-white font-manrope-medium text-[10px] ml-1">{item.dateTime}</Text>
        </View>
      </View>
    </View>
    {/* Footer */}
    <View className="bg-primary flex-row items-center justify-between px-3 py-2.5">
      <View className="flex-1 mr-2">
        <Text className="text-white font-manrope-bold text-sm" numberOfLines={1}>{item.title}</Text>
        <Text className="text-white font-manrope-medium text-xs mt-0.5">{item.subtitle}</Text>
      </View>
      <View className="flex-row items-center">
        <MaterialCommunityIcons name="account-group" size={14} color="white" />
        <Text className="text-white font-manrope-medium text-xs ml-1">{item.participants}</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color="white" style={{ marginLeft: 6 }} />
      </View>
    </View>
  </TouchableOpacity>
);

// ── Main screen ────────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'teams'>('upcoming');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

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
        onPress: () => navigation.navigate('Onboarding'),
      },
    ]);
  };

  const handlePastMatchPress = (match: any) => {
    navigation.navigate('MatchRating', {
      matchId: match.id,
      teams: [match.teams[0].name, match.teams[1].name],
      eventName: match.title,
      date: match.dateTime,
      fieldName: match.stadiumName,
    });
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
            {mockUser.name}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-base mr-1">🏆</Text>
            <Text className="font-manrope-medium text-sm text-text-primary">{mockUser.title}</Text>
          </View>
        </View>

        {/* Stats card */}
        <Text className="font-artico-bold text-[20px] text-text-primary mx-4 mb-2" style={{ letterSpacing: 0.5 }}>
          СТАТИСТИКА ИГРОКА
        </Text>
        <StatsCard stats={mockUser.stats} />

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
              {mockUpcomingMatches.map((match) => (
                <View key={match.id} className="mb-4 rounded-xl overflow-hidden" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
                  <MatchCard
                    id={match.id}
                    location={match.location}
                    dateTime={match.dateTime}
                    teams={match.teams}
                    title={match.title}
                    stadiumName={match.stadiumName}
                    cost={match.cost}
                    participants={match.participants}
                    image={match.image}
                    onPress={match.onPress}
                  />
                  <TouchableOpacity
                    className="bg-primary py-3 px-4"
                    onPress={() => console.log('View match', match.id)}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-white font-manrope-bold text-sm mb-1">{match.title}: {match.stadiumName}</Text>
                        <Text className="text-white font-manrope-medium text-xs">{match.cost}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="account-group" size={16} color="white" />
                        <Text className="text-white font-manrope-medium text-xs ml-1">{match.participants}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="white" style={{ marginLeft: 6 }} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : activeTab === 'history' ? (
            <>
              {mockPastMatches.map((match) => (
                <View key={match.id} className="mb-4 rounded-xl overflow-hidden" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
                  <MatchCard
                    id={match.id}
                    location={match.location}
                    dateTime={match.dateTime}
                    teams={match.teams}
                    title={match.title}
                    stadiumName={match.stadiumName}
                    cost={match.cost}
                    participants={match.participants}
                    image={match.image}
                    isPastMatch={true}
                    onPress={() => handlePastMatchPress(match)}
                  />
                  <TouchableOpacity
                    className="py-3 px-4"
                    style={{ backgroundColor: '#1E1E1E' }}
                    onPress={() => handlePastMatchPress(match)}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-white font-manrope-bold text-sm mb-1">{match.title}: {match.stadiumName}</Text>
                        <Text className="text-white font-manrope-medium text-xs">{match.cost}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="account-group" size={16} color="white" />
                        <Text className="text-white font-manrope-medium text-xs ml-1">{match.participants}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="white" style={{ marginLeft: 6 }} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <View>
              {mockTeams.map((team) => (
                <TeamCard key={team.id} name={team.name} logo={team.logo} onPress={team.onPress} />
              ))}
            </View>
          )}
        </View>

        {/* Recommended lobbies */}
        {(activeTab === 'upcoming' || activeTab === 'history') && (
          <View className="px-4 mt-2">
            <Text className="font-artico-bold text-[20px] text-text-primary mb-3" style={{ letterSpacing: 0.5 }}>
              РЕКОМЕНДУЕМЫЕ ЛОББИ
            </Text>
            {mockRecommendedLobbies.map((lobby) => (
              <LobbyCard key={lobby.id} item={lobby} />
            ))}
          </View>
        )}
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
