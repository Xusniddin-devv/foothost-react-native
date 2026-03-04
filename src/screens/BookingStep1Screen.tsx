import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// SVGs are assumed to be set up correctly
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

type BookingStep1ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'BookingStep1'
>;

interface Props {
  navigation: BookingStep1ScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const mockStadium = {
  name: 'BUNYODKOR',
  address: 'Малая кольцевая дорога',
  distance: '4.9 км от вас',
  rating: 9.9,
  price: '200.000 СУМ',
  image: require('../../assets/images/stadium/stadium.png'), // Fixed image path
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

// Simplified schedule to fit 2x3 grid for demonstration
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

// Helper component for info cards
const InfoCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <View className="bg-gray-100 rounded-lg p-3 flex-1 flex-row items-center h-full">
    {icon}
    <View className="ml-2">
      <Text className="font-manrope-bold text-xs">{label}</Text>
      <Text className="font-manrope-medium text-[10px] mt-1">{value}</Text>
    </View>
  </View>
);

// Helper component for amenity items
const AmenityItem = ({ icon, label, available }: { icon: React.ReactNode, label: string, available: boolean }) => (
  <View className="flex-row items-center">
    {icon}
    <View className="ml-2">
      <Text className="font-manrope-bold text-xs">{label}</Text>
      <Text className={`font-manrope-medium text-xs ${available ? 'text-green-600' : 'text-red-600'}`}>{available ? 'Есть' : 'Нет'}</Text>
    </View>
  </View>
);

export const BookingStep1Screen: React.FC<Props> = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState('today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When selectedDate changes, select the first available slot
  React.useEffect(() => {
    const available = mockSchedule[selectedDate as keyof typeof mockSchedule]?.find(slot => slot.available);
    setSelectedTimeSlot(available ? available.time : null);
  }, [selectedDate]);

  const handleSubmit = () => {
    // Prevent multiple rapid presses
    if (!selectedTimeSlot || isSubmitting) return;

    setIsSubmitting(true);

    // Simple, reliable navigation
    try {
      navigation.navigate('BookingStep3');
    } catch (error) {
      console.error('Navigation error:', error);
    }

    // Reset submission state after a delay
    setTimeout(() => setIsSubmitting(false), 3000);
  };

  const handleTimeSlotPress = (slot: any) => {
    if (slot.available) {
      setSelectedTimeSlot(slot.time);
    }
  };

  const currentSchedule = mockSchedule[selectedDate as keyof typeof mockSchedule];

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

        {/* Image Carousel */}
        <View className="relative">
          <Image source={mockStadium.image} className="w-full h-56" resizeMode="cover" />
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((dot) => (
              <View key={dot} className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </View>
        </View>
        <Container padding="sm">
          {/* Field Overview */}
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
                  <Text className="text-gray-500  font-manrope-medium text-xs ml-1">{mockStadium.address}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-black font-artico-medium text-[30px]">{mockStadium.price}</Text>
                <Text className="text-gray-500 font-manrope-medium text-xs mt-1">{mockStadium.distance}</Text>
              </View>
            </View>
          </View>
          {/* 1. Field Specifications (2x2 Grid) */}
          <View className="mb-6">
            <View className="flex-row justify-center align-center mb-2">
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
          {/* Schedule Section */}
          <View className="mb-6">
            <Text className="text-black font-artico-medium text-xl mb-3">РАСПИСАНИЕ:</Text>
            <View className="flex-row justify-between mb-4">
              {mockDates.map((date, idx) => (
                <TouchableOpacity
                  key={date.value}
                  className={`flex-1 rounded-lg py-2 items-center ${selectedDate === date.value ? 'bg-primary' : 'bg-white border border-[#758A80]'}${idx !== mockDates.length - 1 ? ' mr-2' : ''}`}
                  onPress={() => setSelectedDate(date.value)}
                >
                  <Text className={`font-bold text-sm ${selectedDate === date.value ? 'text-white' : 'text-black'}`}>{date.label}</Text>
                  {date.day && <Text className={`text-xs ${selectedDate === date.value ? 'text-white' : 'text-gray-500'}`}>{date.day}</Text>}
                </TouchableOpacity>
              ))}
            </View>
            {/* 2. Time Slots (2x3 Grid) */}
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
                        onPress={() => handleTimeSlotPress(slot)}
                        disabled={!slot.available}
                      >
                        <Text className={`font-bold text-sm ${!slot.available ? 'text-gray-400' : isSelected ? 'text-white' : 'text-green-600'}`}>{slot.time}</Text>
                        <Text className={`text-xs ${!slot.available ? 'text-gray-400' : isSelected ? 'text-white' : 'text-green-600'}`}>{slot.available ? 'Свободно' : 'Мест Нет'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Fill empty space if odd number of slots */}
                  {currentSchedule.slice(rowIndex * 2, rowIndex * 2 + 2).length === 1 && <View className="w-[49%]" />}
                </View>
              ))}
            </View>
          </View>
          {/* 3. Amenities Section (3-Column Layout) */}
          <View className="mb-6">
            <Text className="font-artico-medium text-xl mb-4">УДОБСТВО:</Text>
            <View className="flex-row justify-between">
              {/* Column 1 */}
              <View className="space-y-4">
                <AmenityItem icon={<ParkingSvg width={28} height={28} />} label="Парковка" available={mockStadium.amenities.parking} />
                <AmenityItem icon={<ShowerSvg width={28} height={28} />} label="Душ" available={mockStadium.amenities.shower} />
              </View>
              {/* Column 2 */}
              <View className="space-y-4">
                <AmenityItem icon={<OutfitChangeSvg width={28} height={28} />} label="Раздевалки" available={mockStadium.amenities.locker} />
                <AmenityItem icon={<SeatsSvg width={28} height={28} />} label="Трибуны" available={mockStadium.amenities.tribune} />
              </View>
              {/* Column 3 */}
              <View className="space-y-4">
                <AmenityItem icon={<LightedSvg width={28} height={28} />} label="Освещение" available={mockStadium.amenities.lighting} />
              </View>
            </View>
          </View>
          {/* Location Section */}
          <View className="mb-32">
            <Text className="font-artico-medium text-xl mb-3">МЕСТОПОЛОЖЕНИЕ:</Text>
            <Image source={require('../../assets/images/map-placeholder.png')} className="w-full h-40 rounded-xl" />
          </View>
        </Container>
      </ScrollView>

      {/* Sticky Send Request Button */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-2 pb-6">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${selectedTimeSlot && !isSubmitting ? 'bg-primary' : 'bg-gray-300'
            }`}
          onPress={handleSubmit}
          disabled={!selectedTimeSlot || isSubmitting}
          activeOpacity={0.7}
        >
          <Text className="text-white font-manrope-bold text-md">
            {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};