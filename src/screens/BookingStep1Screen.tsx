import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ParkingSvg from '../../assets/images/booking/parking.svg';
import ShowerSvg from '../../assets/images/booking/shower.svg';
import OutfitChangeSvg from '../../assets/images/booking/outfitChange.svg';
import SeatsSvg from '../../assets/images/booking/seats.svg';
import LightedSvg from '../../assets/images/booking/lighted.svg';
import TimeOfWorkSvg from '../../assets/images/booking/timeofWork.svg';
import LengthOfFieldSvg from '../../assets/images/booking/lengthofField.svg';
import TypeOfFieldSvg from '../../assets/images/booking/typeofField.svg';
import TypeOfPitchSvg from '../../assets/images/booking/typeofPitch.svg';
import { Container, Header } from '../components/common';

type BookingStep1ScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookingStep1'>;
type BookingStep1ScreenRouteProp = RouteProp<RootStackParamList, 'BookingStep1'>;

interface Props {
  navigation: BookingStep1ScreenNavigationProp;
  route: BookingStep1ScreenRouteProp;
}

const mockStadium = {
  name: 'BUNYODKOR',
  address: 'Малая кольцевая дорога',
  distance: '4.9 км от вас',
  rating: 9.9,
  price: '200.000 СУМ',
  image: require('../../assets/images/stadium/stadium.png'),
  cover: 'Искусственное покрытие',
  type: 'Открытая',
  size: '20x40',
  workTime: '08:00 - 03:00',
  amenities: {
    parking: false,
    locker: true,
    shower: true,
    tribune: true,
    lighting: true,
  },
};

const mockSchedule = {
  today: [
    { time: '07:00 AM - 09:00 AM', available: false },
    { time: '07:00 AM - 09:00 AM', available: true },
    { time: '07:00 AM - 09:00 AM', available: false },
    { time: '07:00 AM - 09:00 AM', available: false },
    { time: '07:00 AM - 09:00 AM', available: false },
    { time: '07:00 AM - 09:00 AM', available: false },
  ],
  tomorrow: [
    { time: '07:00 AM - 09:00 AM', available: true },
    { time: '09:00 AM - 11:00 AM', available: false },
    { time: '11:00 AM - 01:00 PM', available: false },
    { time: '01:00 PM - 03:00 PM', available: true },
    { time: '03:00 PM - 05:00 PM', available: false },
    { time: '05:00 PM - 07:00 PM', available: false },
  ],
  '11.06': [
    { time: '07:00 AM - 09:00 AM', available: false },
    { time: '09:00 AM - 11:00 AM', available: false },
    { time: '11:00 AM - 01:00 PM', available: true },
    { time: '01:00 PM - 03:00 PM', available: true },
    { time: '03:00 PM - 05:00 PM', available: false },
    { time: '05:00 PM - 07:00 PM', available: false },
  ],
};

const mockDates = [
  { label: 'Сегодня', value: 'today', day: 'Ср' },
  { label: 'Завтра', value: 'tomorrow', day: 'Чт' },
  { label: '11.06', value: '11.06', day: '' },
];

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

// ── Counter row ────────────────────────────────────────────────────────────────
const Counter = ({
  value,
  onChange,
  placeholder,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  min?: number;
}) => (
  <View className="flex-row items-center" style={{ gap: 0 }}>
    <TouchableOpacity
      onPress={() => onChange(Math.max(min, value - 1))}
      className="bg-primary items-center justify-center rounded-l-lg"
      style={{ width: 52, height: 48 }}
    >
      <Text className="text-white text-2xl font-manrope-bold" style={{ lineHeight: 26 }}>−</Text>
    </TouchableOpacity>

    <View
      className="flex-1 border border-gray-200 items-center justify-center"
      style={{ height: 48 }}
    >
      {value === 0 && placeholder ? (
        <Text className="text-gray-400 font-manrope-medium text-sm">{placeholder}</Text>
      ) : (
        <Text className="text-text-primary font-manrope-bold text-base">{value}</Text>
      )}
    </View>

    <TouchableOpacity
      onPress={() => onChange(value + 1)}
      className="bg-primary items-center justify-center rounded-r-lg"
      style={{ width: 52, height: 48 }}
    >
      <Text className="text-white text-2xl font-manrope-bold" style={{ lineHeight: 26 }}>+</Text>
    </TouchableOpacity>
  </View>
);

// ── Game-type tab ──────────────────────────────────────────────────────────────
type GameType = 'open' | 'closed' | 'invite';

const GAME_TYPES: { key: GameType; label: string }[] = [
  { key: 'open', label: 'Открытое' },
  { key: 'closed', label: 'Закрытое' },
  { key: 'invite', label: 'По приглашению' },
];

// ── Booking modal ──────────────────────────────────────────────────────────────
interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (players: number, teams: number, hours: number, gameType: GameType) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ visible, onClose, onSubmit }) => {
  const [players, setPlayers] = useState(0);
  const [teams, setTeams] = useState(2);
  const [hours, setHours] = useState(2);
  const [gameType, setGameType] = useState<GameType>('open');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Dim backdrop */}
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Modal card — stop event propagation so taps inside don't close */}
        <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
          <View className="bg-white rounded-2xl p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="font-artico-bold text-[24px] text-text-primary" style={{ letterSpacing: 1 }}>
                БРОНИРОВАНИЕ
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={26} color="#758A80" />
              </TouchableOpacity>
            </View>

            {/* Players */}
            <Counter
              value={players}
              onChange={setPlayers}
              placeholder="Количество игроков"
              min={0}
            />

            {/* Teams */}
            <Text className="font-manrope-medium text-sm text-text-primary mt-4 mb-1">
              Количество команд
            </Text>
            <Counter value={teams} onChange={setTeams} min={1} />

            {/* Hours */}
            <Text className="font-manrope-medium text-sm text-text-primary mt-4 mb-1">
              Количество часов
            </Text>
            <Counter value={hours} onChange={setHours} min={1} />

            {/* Game type */}
            <Text className="font-manrope-medium text-sm text-text-primary mt-4 mb-2">
              Тип игры
            </Text>
            <View className="flex-row" style={{ gap: 6 }}>
              {GAME_TYPES.map((gt) => (
                <TouchableOpacity
                  key={gt.key}
                  onPress={() => setGameType(gt.key)}
                  className={`flex-1 rounded-lg py-2.5 items-center ${
                    gameType === gt.key ? 'bg-primary' : 'bg-white border border-gray-300'
                  }`}
                >
                  <Text
                    className={`font-manrope-medium text-xs ${
                      gameType === gt.key ? 'text-white' : 'text-text-primary'
                    }`}
                    numberOfLines={1}
                  >
                    {gt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit */}
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center mt-5"
              onPress={() => onSubmit(players, teams, hours, gameType)}
            >
              <Text className="text-white font-manrope-bold text-base">Отправить</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ── Main screen ────────────────────────────────────────────────────────────────
export const BookingStep1Screen: React.FC<Props> = ({ navigation, route }) => {
  const showSchedule = route?.params?.showSchedule === true;
  const [selectedDate, setSelectedDate] = useState('today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  React.useEffect(() => {
    if (!showSchedule) return;
    const available = mockSchedule[selectedDate as keyof typeof mockSchedule]?.find((s) => s.available);
    setSelectedTimeSlot(available ? available.time : null);
  }, [selectedDate, showSchedule]);

  const currentSchedule = mockSchedule[selectedDate as keyof typeof mockSchedule];

  const handleModalSubmit = (_players: number, _teams: number, _hours: number, _gameType: GameType) => {
    setModalVisible(false);
    navigation.navigate('BookingStep2');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <MaterialCommunityIcons name="arrow-left" size={28} color="#212121" />
          </TouchableOpacity>
        }
        right={
          <TouchableOpacity>
            <MaterialCommunityIcons name="dots-vertical" size={28} color="#212121" />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Image */}
        <View className="relative">
          <Image source={mockStadium.image} className="w-full h-56" resizeMode="cover" />
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((dot) => (
              <View key={dot} className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </View>
        </View>

        <Container padding="sm">
          {/* Overview */}
          <View className="py-2">
            <View className="flex-row justify-between items-start">
              <View>
                <View className="flex-row items-center">
                  <Text className="text-text-primary font-artico-medium text-[30px]">{mockStadium.name}</Text>
                  <View className="bg-primary rounded-md px-2 py-1 ml-2 flex-row items-center">
                    <Text className="text-white font-bold text-sm mr-1">{mockStadium.rating}</Text>
                    <MaterialCommunityIcons name="star" size={14} color="white" />
                  </View>
                </View>
                <View className="flex-row items-center mt-1">
                  <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
                  <Text className="text-gray-500 font-manrope-medium text-xs ml-1">{mockStadium.address}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-black font-artico-medium text-[30px]">{mockStadium.price}</Text>
                <Text className="text-gray-500 font-manrope-medium text-xs mt-1">{mockStadium.distance}</Text>
              </View>
            </View>
          </View>

          {/* Field specs */}
          <View className="mb-6">
            <View className="flex-row justify-center mb-2">
              <InfoCard icon={<TypeOfPitchSvg width={36} height={36} />} label="Покрытие" value={mockStadium.cover} />
              <View className="w-2" />
              <InfoCard icon={<TypeOfFieldSvg width={36} height={36} />} label="Тип площадки" value={mockStadium.type} />
            </View>
            <View className="flex-row justify-between">
              <InfoCard icon={<LengthOfFieldSvg width={36} height={36} />} label="Длина х Ширина (м)" value={mockStadium.size} />
              <View className="w-2" />
              <InfoCard icon={<TimeOfWorkSvg width={36} height={36} />} label="Время работы" value={mockStadium.workTime} />
            </View>
          </View>

          {/* Schedule — only visible after payment */}
          {showSchedule && <View className="mb-6">
            <Text className="text-black font-artico-medium text-xl mb-3">РАСПИСАНИЕ:</Text>
            <View className="flex-row justify-between mb-4">
              {mockDates.map((date, idx) => (
                <TouchableOpacity
                  key={date.value}
                  className={`flex-1 rounded-lg py-2 items-center ${
                    selectedDate === date.value ? 'bg-primary' : 'bg-white border border-[#758A80]'
                  }${idx !== mockDates.length - 1 ? ' mr-2' : ''}`}
                  onPress={() => setSelectedDate(date.value)}
                >
                  <Text className={`font-bold text-sm ${selectedDate === date.value ? 'text-white' : 'text-black'}`}>
                    {date.label}
                  </Text>
                  {date.day && (
                    <Text className={`text-xs ${selectedDate === date.value ? 'text-white' : 'text-gray-500'}`}>
                      {date.day}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View>
              {Array.from({ length: Math.ceil(currentSchedule.length / 2) }).map((_, rowIndex) => (
                <View key={rowIndex} className="flex-row justify-between mb-2">
                  {currentSchedule.slice(rowIndex * 2, rowIndex * 2 + 2).map((slot, slotIndex) => {
                    const isSelected = selectedTimeSlot === slot.time && slot.available;
                    return (
                      <TouchableOpacity
                        key={slotIndex}
                        className={`w-[49%] rounded-lg p-2 items-center justify-center h-16
                          ${!slot.available ? 'bg-gray-100 border border-[#758A80]' : ''}
                          ${slot.available && !isSelected ? 'bg-white border border-green-600' : ''}
                          ${isSelected ? 'bg-primary border border-green-600' : ''}
                        `}
                        onPress={() => slot.available && setSelectedTimeSlot(slot.time)}
                        disabled={!slot.available}
                      >
                        <Text className={`font-bold text-sm ${!slot.available ? 'text-gray-400' : isSelected ? 'text-white' : 'text-green-600'}`}>
                          {slot.time}
                        </Text>
                        <Text className={`text-xs ${!slot.available ? 'text-gray-400' : isSelected ? 'text-white' : 'text-green-600'}`}>
                          {slot.available ? 'Свободно' : 'Мест Нет'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {currentSchedule.slice(rowIndex * 2, rowIndex * 2 + 2).length === 1 && <View className="w-[49%]" />}
                </View>
              ))}
            </View>
          </View>}

          {/* Amenities */}
          <View className="mb-6">
            <Text className="font-artico-medium text-xl mb-4">УДОБСТВО:</Text>
            <View className="flex-row justify-between">
              <View className="space-y-4">
                <AmenityItem icon={<ParkingSvg width={28} height={28} />} label="Парковка" available={mockStadium.amenities.parking} />
                <AmenityItem icon={<ShowerSvg width={28} height={28} />} label="Душ" available={mockStadium.amenities.shower} />
              </View>
              <View className="space-y-4">
                <AmenityItem icon={<OutfitChangeSvg width={28} height={28} />} label="Раздевалки" available={mockStadium.amenities.locker} />
                <AmenityItem icon={<SeatsSvg width={28} height={28} />} label="Трибуны" available={mockStadium.amenities.tribune} />
              </View>
              <View className="space-y-4">
                <AmenityItem icon={<LightedSvg width={28} height={28} />} label="Освещение" available={mockStadium.amenities.lighting} />
              </View>
            </View>
          </View>

          {/* Location */}
          <View className="mb-32">
            <Text className="font-artico-medium text-xl mb-3">МЕСТОПОЛОЖЕНИЕ:</Text>
            <Image source={require('../../assets/images/map-placeholder.png')} className="w-full h-40 rounded-xl" />
          </View>
        </Container>
      </ScrollView>

      {/* Sticky button */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-2 pb-6 bg-white">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${!showSchedule || selectedTimeSlot ? 'bg-primary' : 'bg-gray-300'}`}
          onPress={() => (!showSchedule || selectedTimeSlot) && setModalVisible(true)}
          disabled={showSchedule && !selectedTimeSlot}
          activeOpacity={0.7}
        >
          <Text className="text-white font-manrope-bold text-base">Создать лобби</Text>
        </TouchableOpacity>
      </View>

      {/* Booking modal */}
      <BookingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
      />
    </SafeAreaView>
  );
};
