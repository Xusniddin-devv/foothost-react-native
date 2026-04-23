import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fieldsApi } from '../services/api/fields';
import { lobbiesApi } from '../services/api/lobbies';
import { bookingsApi } from '../services/api/bookings';
import { getApiErrorMessage } from '../services/api/client';
import type { Field, FieldSlot, LobbyType } from '../types/api';
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
  mapUrl: null as string | null,
  amenities: {
    parking: false,
    locker: true,
    shower: true,
    tribune: true,
    lighting: true,
  },
};

const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

type ScheduleOption = {
  id: string;
  time: string;
  available: boolean;
  bookSlotId: string;
  reason: 'ok' | 'preference' | 'busy';
};

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
  submitting?: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ visible, onClose, onSubmit, submitting }) => {
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
              className={`rounded-xl py-4 items-center mt-5 ${submitting ? 'bg-gray-400' : 'bg-primary'}`}
              disabled={submitting}
              onPress={() => onSubmit(players, teams, hours, gameType)}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-manrope-bold text-base">Отправить</Text>
              )}
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
  const fieldId = route?.params?.fieldId;
  const lobbyId = route?.params?.lobbyId;
  const dateTabs = useMemo(() => {
    return [0, 1, 2].map((offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const value = d.toISOString().slice(0, 10);
      if (offset === 0) return { label: 'Сегодня', value, day: DAY_NAMES_RU[d.getDay()] };
      if (offset === 1) return { label: 'Завтра', value, day: DAY_NAMES_RU[d.getDay()] };
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return { label: `${day}.${month}`, value, day: '' };
    });
  }, []);
  const [selectedDate, setSelectedDate] = useState(dateTabs[0]?.value ?? new Date().toISOString().slice(0, 10));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    id: string;
    label: string;
    bookSlotId: string;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [field, setField] = useState<Field | null>(null);
  const [scheduleLobby, setScheduleLobby] = useState<Awaited<ReturnType<typeof lobbiesApi.get>> | null>(null);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, FieldSlot[]>>({});
  const [loading, setLoading] = useState<boolean>(!!fieldId);

  useEffect(() => {
    if (!fieldId) return;
    let cancelled = false;
    (async () => {
      try {
        const [f, s] = await Promise.all([
          fieldsApi.get(fieldId),
          fieldsApi.slots(fieldId, dateTabs[0]?.value).catch(() => [] as FieldSlot[]),
        ]);
        if (cancelled) return;
        setField(f);
        setSlotsByDate((prev) => ({ ...prev, [dateTabs[0]?.value ?? '']: s }));
      } catch (err) {
        if (!cancelled) Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось загрузить поле'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fieldId, dateTabs]);

  useEffect(() => {
    if (!showSchedule || !lobbyId) return;
    let cancelled = false;
    lobbiesApi
      .get(lobbyId)
      .then((l) => {
        if (!cancelled) setScheduleLobby(l);
      })
      .catch(() => {
        if (!cancelled) setScheduleLobby(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showSchedule, lobbyId]);

  useEffect(() => {
    if (!fieldId || !showSchedule) return;
    if (slotsByDate[selectedDate]) return;
    let cancelled = false;
    fieldsApi
      .slots(fieldId, selectedDate)
      .then((s) => {
        if (!cancelled) {
          setSlotsByDate((prev) => ({ ...prev, [selectedDate]: s }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlotsByDate((prev) => ({ ...prev, [selectedDate]: [] }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fieldId, selectedDate, showSchedule, slotsByDate]);

  const displayStadium = useMemo(() => {
    if (!field) return mockStadium;
    const amenities = (field.amenities ?? {}) as Record<string, boolean>;
    return {
      name: field.name,
      address: field.address,
      distance: `${Number(field.reviewsCount ?? 0)} отзывов`,
      rating: Number((field.rating ?? 0).toFixed(1)),
      price: `${field.pricePerHour.toLocaleString('ru-RU')} СУМ`,
      image: field.photos?.[0] ? { uri: field.photos[0] } : mockStadium.image,
      cover: field.description ?? mockStadium.cover,
      type: field.pitchType ?? mockStadium.type,
      size: field.dimensions ?? mockStadium.size,
      workTime: field.workTime ?? mockStadium.workTime,
      amenities: {
        parking: amenities.parking ?? false,
        locker: amenities.locker ?? false,
        shower: amenities.shower ?? false,
        tribune: amenities.tribune ?? false,
        lighting: amenities.lighting ?? false,
      },
      mapUrl: field.mapUrl ?? null,
    };
  }, [field]);

  function extractLatLng(mapUrl: string): { lat: number; lng: number } | null {
    const decoded = decodeURIComponent(mapUrl);
    const llMatch = decoded.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (llMatch) {
      return { lng: Number(llMatch[1]), lat: Number(llMatch[2]) };
    }

    const googleMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (googleMatch) {
      return { lat: Number(googleMatch[1]), lng: Number(googleMatch[2]) };
    }

    const queryMatch = decoded.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (queryMatch) {
      return { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) };
    }

    return null;
  }

  const mapPreviewUrl = useMemo(() => {
    if (!displayStadium.mapUrl) return null;
    const coords = extractLatLng(displayStadium.mapUrl);
    if (!coords) return null;
    return `https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=${coords.lng},${coords.lat}&size=650,300&z=15&l=map&pt=${coords.lng},${coords.lat},pm2rdm`;
  }, [displayStadium.mapUrl]);

  const openMap = useCallback(async () => {
    if (!displayStadium.mapUrl) return;
    const supported = await Linking.canOpenURL(displayStadium.mapUrl);
    if (!supported) {
      Alert.alert('Ошибка', 'Не удалось открыть ссылку карты');
      return;
    }
    await Linking.openURL(displayStadium.mapUrl);
  }, [displayStadium.mapUrl]);

  const currentSchedule = useMemo<ScheduleOption[]>(() => {
    const slots = slotsByDate[selectedDate] ?? [];
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    if (slots.length === 0) return [];

    const preferredHours = Math.max(1, scheduleLobby?.durationHours ?? 1);
    const firstStart = new Date(slots[0].startTime).getTime();
    const firstEnd = new Date(slots[0].endTime).getTime();
    const slotMinutes = Math.max(1, Math.round((firstEnd - firstStart) / 60000));
    const unitsNeeded = Math.max(1, Math.round((preferredHours * 60) / slotMinutes));

    if (unitsNeeded <= 1) {
      return slots.map((slot) => {
        const start = formatter.format(new Date(slot.startTime));
        const end = formatter.format(new Date(slot.endTime));
        return {
          id: slot.id,
          time: `${start} - ${end}`,
          available: slot.status === 'available',
          bookSlotId: slot.id,
          reason: slot.status === 'available' ? 'ok' : 'busy',
        };
      });
    }

    const composed: ScheduleOption[] = [];

    for (let i = 0; i + unitsNeeded - 1 < slots.length; i += 1) {
      const window = slots.slice(i, i + unitsNeeded);
      const contiguous = window.every((slot, idx) => {
        if (idx === 0) return true;
        return new Date(slot.startTime).getTime() === new Date(window[idx - 1].endTime).getTime();
      });
      if (!contiguous) continue;

      const hasAvailable = window.some((slot) => slot.status === 'available');
      const allAvailable = window.every((slot) => slot.status === 'available');
      const start = formatter.format(new Date(window[0].startTime));
      const end = formatter.format(new Date(window[window.length - 1].endTime));

      composed.push({
        id: `${window[0].id}-${window[window.length - 1].id}`,
        time: `${start} - ${end}`,
        available: allAvailable,
        bookSlotId: window[0].id,
        reason: allAvailable ? 'ok' : hasAvailable ? 'preference' : 'busy',
      });
    }

    return composed;
  }, [selectedDate, slotsByDate, scheduleLobby?.durationHours]);

  React.useEffect(() => {
    if (!showSchedule) return;
    const available = currentSchedule.find((s) => s.available);
    setSelectedTimeSlot(
      available
        ? { id: available.id, label: available.time, bookSlotId: available.bookSlotId }
        : null,
    );
  }, [currentSchedule, selectedDate, showSchedule]);

  const handleConfirmBooking = useCallback(async () => {
    if (!showSchedule || !lobbyId || !selectedTimeSlot) return;
    setBookingSubmitting(true);
    try {
      await bookingsApi.book(lobbyId, selectedTimeSlot.bookSlotId);
      Alert.alert('Успешно', 'Слот успешно забронирован', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Profile'),
        },
      ]);
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось забронировать слот'));
    } finally {
      setBookingSubmitting(false);
    }
  }, [showSchedule, lobbyId, selectedTimeSlot, navigation]);

  const handleModalSubmit = useCallback(
    async (players: number, teams: number, hours: number, gameType: GameType) => {
      if (!fieldId) {
        setModalVisible(false);
        Alert.alert('Выбор стадиона', 'Сначала выберите стадион из списка');
        navigation.navigate('StadiumList');
        return;
      }
      setSubmitting(true);
      try {
        const lobbyType: LobbyType =
          gameType === 'closed' ? 'closed' : gameType === 'invite' ? 'invite_only' : 'open';
        const lobby = await lobbiesApi.create({
          fieldId,
          type: lobbyType,
          maxPlayers: players > 0 ? players : teams * 5,
          teamCount: Math.max(1, teams),
          durationHours: Math.max(1, hours),
        });
        setModalVisible(false);
        navigation.navigate('BookingStep2', { lobbyId: lobby.id, fieldId });
      } catch (err) {
        Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось создать лобби'));
      } finally {
        setSubmitting(false);
      }
    },
    [fieldId, navigation],
  );

  const canCreateLobby = Boolean(fieldId);

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
          <Image source={displayStadium.image} className="w-full h-56" resizeMode="cover" />
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
                  <Text className="text-text-primary font-artico-medium text-[30px]">{displayStadium.name}</Text>
                  <View className="bg-primary rounded-md px-2 py-1 ml-2 flex-row items-center">
                    <Text className="text-white font-bold text-sm mr-1">{displayStadium.rating}</Text>
                    <MaterialCommunityIcons name="star" size={14} color="white" />
                  </View>
                </View>
                <View className="flex-row items-center mt-1">
                  <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
                  <Text className="text-gray-500 font-manrope-medium text-xs ml-1">{displayStadium.address}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-black font-artico-medium text-[30px]">{displayStadium.price}</Text>
                <Text className="text-gray-500 font-manrope-medium text-xs mt-1">{displayStadium.distance}</Text>
              </View>
            </View>
          </View>

          {/* Field specs */}
          <View className="mb-6">
            <View className="flex-row justify-center mb-2">
              <InfoCard icon={<TypeOfPitchSvg width={36} height={36} />} label="Покрытие" value={displayStadium.cover} />
              <View className="w-2" />
              <InfoCard icon={<TypeOfFieldSvg width={36} height={36} />} label="Тип площадки" value={displayStadium.type} />
            </View>
            <View className="flex-row justify-between">
              <InfoCard icon={<LengthOfFieldSvg width={36} height={36} />} label="Длина х Ширина (м)" value={displayStadium.size} />
              <View className="w-2" />
              <InfoCard icon={<TimeOfWorkSvg width={36} height={36} />} label="Время работы" value={displayStadium.workTime} />
            </View>
          </View>

          {/* Schedule — only visible after payment */}
          {showSchedule && <View className="mb-6">
            <Text className="text-black font-artico-medium text-xl mb-3">РАСПИСАНИЕ:</Text>
            <View className="flex-row justify-between mb-4">
              {dateTabs.map((date, idx) => (
                <TouchableOpacity
                  key={date.value}
                  className={`flex-1 rounded-lg py-2 items-center ${
                    selectedDate === date.value ? 'bg-primary' : 'bg-white border border-[#758A80]'
                  }${idx !== dateTabs.length - 1 ? ' mr-2' : ''}`}
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
            {currentSchedule.length === 0 ? (
              <View className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <Text className="text-center font-manrope-medium text-sm text-gray-500">
                  Нет доступных слотов на выбранную дату
                </Text>
              </View>
            ) : (
              <View>
                {Array.from({ length: Math.ceil(currentSchedule.length / 2) }).map((_, rowIndex) => (
                  <View key={rowIndex} className="flex-row justify-between mb-2">
                    {currentSchedule.slice(rowIndex * 2, rowIndex * 2 + 2).map((slot) => {
                      const isSelected = selectedTimeSlot?.id === slot.id && slot.available;
                      return (
                        <TouchableOpacity
                          key={slot.id}
                          className={`w-[49%] rounded-lg p-2 items-center justify-center h-16
                            ${!slot.available ? 'bg-gray-100 border border-[#758A80]' : ''}
                            ${slot.available && !isSelected ? 'bg-white border border-green-600' : ''}
                            ${isSelected ? 'bg-primary border border-green-600' : ''}
                          `}
                          onPress={() =>
                            slot.available &&
                            setSelectedTimeSlot({
                              id: slot.id,
                              label: slot.time,
                              bookSlotId: slot.bookSlotId,
                            })
                          }
                          disabled={!slot.available}
                        >
                          <Text className={`font-bold text-sm ${!slot.available ? 'text-gray-400' : isSelected ? 'text-white' : 'text-green-600'}`}>
                            {slot.time}
                          </Text>
                          <Text className={`text-xs ${!slot.available ? 'text-gray-400' : isSelected ? 'text-white' : 'text-green-600'}`}>
                            {slot.available
                              ? 'Свободно'
                              : slot.reason === 'preference'
                                ? 'Недоступно для вашего выбора'
                                : 'Мест Нет'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {currentSchedule.slice(rowIndex * 2, rowIndex * 2 + 2).length === 1 && <View className="w-[49%]" />}
                  </View>
                ))}
              </View>
            )}
          </View>}

          {/* Amenities */}
          <View className="mb-6">
            <Text className="font-artico-medium text-xl mb-4">УДОБСТВО:</Text>
            <View className="flex-row justify-between">
              <View className="space-y-4">
                <AmenityItem icon={<ParkingSvg width={28} height={28} />} label="Парковка" available={displayStadium.amenities.parking} />
                <AmenityItem icon={<ShowerSvg width={28} height={28} />} label="Душ" available={displayStadium.amenities.shower} />
              </View>
              <View className="space-y-4">
                <AmenityItem icon={<OutfitChangeSvg width={28} height={28} />} label="Раздевалки" available={displayStadium.amenities.locker} />
                <AmenityItem icon={<SeatsSvg width={28} height={28} />} label="Трибуны" available={displayStadium.amenities.tribune} />
              </View>
              <View className="space-y-4">
                <AmenityItem icon={<LightedSvg width={28} height={28} />} label="Освещение" available={displayStadium.amenities.lighting} />
              </View>
            </View>
          </View>

          {/* Location */}
          <View className="mb-32">
            <Text className="font-artico-medium text-xl mb-3">МЕСТОПОЛОЖЕНИЕ:</Text>
            {mapPreviewUrl ? (
              <TouchableOpacity onPress={openMap} activeOpacity={0.85}>
                <Image source={{ uri: mapPreviewUrl }} className="w-full h-40 rounded-xl" resizeMode="cover" />
              </TouchableOpacity>
            ) : displayStadium.mapUrl ? (
              <TouchableOpacity
                onPress={openMap}
                activeOpacity={0.85}
                className="w-full h-40 rounded-xl border border-gray-200 bg-gray-50 items-center justify-center px-4"
              >
                <MaterialCommunityIcons name="map-marker" size={28} color="#45AF31" />
                <Text className="font-manrope-semibold text-sm text-text-primary mt-2 text-center">
                  Открыть в Яндекс/Google Maps
                </Text>
              </TouchableOpacity>
            ) : (
              <Image source={require('../../assets/images/map-placeholder.png')} className="w-full h-40 rounded-xl" />
            )}
          </View>
        </Container>
      </ScrollView>

      {/* Sticky button */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-2 pb-6 bg-white">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            (!showSchedule || selectedTimeSlot) && canCreateLobby && !bookingSubmitting ? 'bg-primary' : 'bg-gray-300'
          }`}
          onPress={() => {
            if (!canCreateLobby) return;
            if (showSchedule) {
              if (selectedTimeSlot && !bookingSubmitting) void handleConfirmBooking();
              return;
            }
            setModalVisible(true);
          }}
          disabled={(showSchedule && !selectedTimeSlot) || !canCreateLobby || bookingSubmitting}
          activeOpacity={0.7}
        >
          <Text className="text-white font-manrope-bold text-base">
            {canCreateLobby
              ? showSchedule
                ? bookingSubmitting
                  ? 'Бронирование...'
                  : 'Забронировать'
                : 'Создать лобби'
              : 'Сначала выберите стадион'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Booking modal */}
      <BookingModal
        visible={modalVisible}
        onClose={() => !submitting && setModalVisible(false)}
        onSubmit={handleModalSubmit}
        submitting={submitting}
      />

      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#45AF31" />
        </View>
      )}
    </SafeAreaView>
  );
};
