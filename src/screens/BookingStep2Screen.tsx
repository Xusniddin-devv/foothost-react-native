import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type BookingStep2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'BookingStep2'
>;

interface Props {
  navigation: BookingStep2ScreenNavigationProp;
}

const mockStadium = {
  name: 'BUNYODKOR',
  address: 'Малая кольцевая дорога',
  rating: 9.9,
  totalPrice: '200.000',
  collectedPrice: '100.000',
  image: require('../../assets/images/stadium/stadium.png'),
};

const SLOTS_PER_TEAM = 5;

interface Team {
  id: number;
  name: string;
  players: (string | null)[];
}

const initialTeams: Team[] = [
  { id: 1, name: 'Команда 1', players: Array(SLOTS_PER_TEAM).fill(null) },
  { id: 2, name: 'Команда 1', players: Array(SLOTS_PER_TEAM).fill(null) },
  { id: 3, name: 'Команда 1', players: Array(SLOTS_PER_TEAM).fill(null) },
];

// ── Progress bar ───────────────────────────────────────────────────────────────
const PriceCard = ({ total, collected, onPayPress }: { total: string; collected: string; onPayPress: () => void }) => {
  const totalNum = parseInt(total.replace('.', ''), 10);
  const collectedNum = parseInt(collected.replace('.', ''), 10);
  const progress = Math.min(collectedNum / totalNum, 1);

  return (
    <View className="bg-white rounded-2xl p-4 mx-4 mb-4 shadow-sm" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
      {/* Progress bar */}
      <View className="h-[5px] w-full bg-gray-200 rounded-full overflow-hidden mb-3">
        <View className="h-full bg-primary rounded-full" style={{ width: `${progress * 100}%` }} />
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-artico-bold text-[26px] text-text-primary" style={{ lineHeight: 30 }}>
            {total} <Text className="text-base font-manrope-medium">сум</Text>
          </Text>
          <Text className="font-manrope-medium text-xs text-gray-500 mt-0.5">
            Собрано: {collected} сум
          </Text>
        </View>
        <TouchableOpacity
          className="bg-primary flex-row items-center rounded-xl px-4 py-3"
          style={{ gap: 6 }}
          onPress={onPayPress}
        >
          <MaterialCommunityIcons name="credit-card-outline" size={18} color="white" />
          <Text className="text-white font-manrope-bold text-sm">Оплатить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Player slot ────────────────────────────────────────────────────────────────
const PlayerSlot = ({
  player,
  onPress,
}: {
  player: string | null;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="items-center justify-center rounded-full border-2 border-primary bg-white"
    style={{ width: 52, height: 52 }}
  >
    {player ? (
      <Text className="text-primary font-manrope-bold text-xs" numberOfLines={1}>{player}</Text>
    ) : (
      <Text className="text-primary text-2xl font-manrope-light" style={{ lineHeight: 28 }}>+</Text>
    )}
  </TouchableOpacity>
);

// ── Team card ──────────────────────────────────────────────────────────────────
const TeamCard = ({
  team,
  onAddPlayer,
  onShuffle,
}: {
  team: Team;
  onAddPlayer: (teamId: number, slotIndex: number) => void;
  onShuffle: (teamId: number) => void;
}) => (
  <View
    className="bg-white rounded-2xl px-4 py-3 mb-3"
    style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } }}
  >
    <View className="flex-row items-center justify-between mb-3">
      <Text className="font-manrope-semibold text-sm text-text-primary">{team.name}</Text>
      <TouchableOpacity onPress={() => onShuffle(team.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MaterialCommunityIcons name="shuffle-variant" size={22} color="#45AF31" />
      </TouchableOpacity>
    </View>
    <View className="flex-row justify-between">
      {team.players.map((player, idx) => (
        <PlayerSlot
          key={idx}
          player={player}
          onPress={() => onAddPlayer(team.id, idx)}
        />
      ))}
    </View>
  </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────
export const BookingStep2Screen: React.FC<Props> = ({ navigation }) => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  const handleAddPlayer = (teamId: number, slotIndex: number) => {
    // Placeholder — would open player search/invite modal
    console.log('Add player to team', teamId, 'slot', slotIndex);
  };

  const handleShuffle = (teamId: number) => {
    console.log('Shuffle team', teamId);
  };

  const handlePublish = () => {
    console.log('Publish lobby');
  };

  const handleShare = () => {
    console.log('Share');
  };

  const handleBook = () => {
    navigation.navigate('BookingStep3');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center">
          <MaterialCommunityIcons name="chevron-left" size={24} color="#212121" />
          <Text className="font-manrope-medium text-sm text-text-primary ml-1">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero image */}
        <View style={{ position: 'relative' }}>
          <Image source={mockStadium.image} style={{ width: '100%', height: 200 }} resizeMode="cover" />
          {/* Gradient overlay at bottom */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              justifyContent: 'flex-end',
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
          >
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Text className="font-artico-bold text-white text-[22px]" style={{ letterSpacing: 1 }}>
                {mockStadium.name}
              </Text>
              <View className="bg-primary rounded-md px-2 py-0.5 flex-row items-center" style={{ gap: 3 }}>
                <Text className="text-white font-manrope-bold text-sm">{mockStadium.rating}</Text>
                <MaterialCommunityIcons name="star" size={12} color="white" />
              </View>
            </View>
            <View className="flex-row items-center mt-0.5">
              <MaterialCommunityIcons name="map-marker" size={12} color="white" />
              <Text className="text-white font-manrope-medium text-xs ml-1">{mockStadium.address}</Text>
            </View>
          </View>
        </View>

        {/* Price card */}
        <View className="mt-3">
          <PriceCard total={mockStadium.totalPrice} collected={mockStadium.collectedPrice} onPayPress={() => navigation.navigate('PaymentScreen')} />
        </View>

        {/* Teams section */}
        <View className="px-4">
          <Text className="font-artico-bold text-[22px] text-text-primary mb-4" style={{ letterSpacing: 0.5 }}>
            ВЫБЕРИТЕ КОМАНДУ
          </Text>

          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onAddPlayer={handleAddPlayer}
              onShuffle={handleShuffle}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky bottom actions */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#F5F5F5] px-4 pt-2 pb-6" style={{ gap: 8 }}>
        {/* Secondary row */}
        <View className="flex-row" style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={handlePublish}
            className="flex-1 bg-primary flex-row items-center justify-center rounded-xl py-3"
            style={{ gap: 6 }}
          >
            <MaterialCommunityIcons name="soccer" size={18} color="white" />
            <Text className="text-white font-manrope-bold text-sm">Опубликовать лобби</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            className="flex-1 border border-primary flex-row items-center justify-center rounded-xl py-3"
            style={{ gap: 6 }}
          >
            <MaterialCommunityIcons name="export-variant" size={18} color="#45AF31" />
            <Text className="text-primary font-manrope-bold text-sm">Поделиться</Text>
          </TouchableOpacity>
        </View>

        {/* Primary book button */}
        <TouchableOpacity
          onPress={handleBook}
          className="bg-primary rounded-xl py-4 items-center"
        >
          <Text className="text-white font-manrope-bold text-base">Забронировать</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
