import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Container, Header } from '../components/common';

type TournamentsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Tournaments'
>;

interface Props {
  navigation: TournamentsScreenNavigationProp;
}

const mockTournaments = [
  {
    id: 1,
    title: 'WEEKEND BATTLE',
    format: '7х7 - Групповой этап + плей-офф',
    cost: 'Стоимость: 200 000 с команды',
    location: 'Chilonzor Arena',
    participants: '10/12',
    time: '17:00',
    date: '25.12.25',
    price: '200.000 СУМ',
    distance: '4.9 км от вас',
    surface: 'Искусственное покрытие',
    pitchType: 'Открытая',
    dimensions: '20x40',
    workTime: '08:00 - 03:00',
    address: 'Малая кольцевая дорога',
    team1: 'CHELSEA FOOTBALL CLUB',
    team2: 'MANCHESTER UNITED',
  },
  {
    id: 2,
    title: 'WEEKEND BATTLE',
    format: '7х7 - Групповой этап + плей-офф',
    cost: 'Стоимость: 200 000 с команды',
    location: 'Chilonzor Arena',
    participants: '10/12',
    time: '17:00',
    date: '25.12.25',
    price: '200.000 СУМ',
    distance: '4.9 км от вас',
    surface: 'Искусственное покрытие',
    pitchType: 'Открытая',
    dimensions: '20x40',
    workTime: '08:00 - 03:00',
    address: 'Малая кольцевая дорога',
    team1: 'CHELSEA FOOTBALL CLUB',
    team2: 'MANCHESTER UNITED',
  },
  {
    id: 3,
    title: 'WEEKEND BATTLE',
    format: '7х7 - Групповой этап + плей-офф',
    cost: 'Стоимость: 200 000 с команды',
    location: 'Chilonzor Arena',
    participants: '10/12',
    time: '17:00',
    date: '25.12.25',
    price: '200.000 СУМ',
    distance: '4.9 км от вас',
    surface: 'Искусственное покрытие',
    pitchType: 'Открытая',
    dimensions: '20x40',
    workTime: '08:00 - 03:00',
    address: 'Малая кольцевая дорога',
    team1: 'CHELSEA FOOTBALL CLUB',
    team2: 'MANCHESTER UNITED',
  },
];

export const TournamentsScreen: React.FC<Props> = ({ navigation }) => {
  const handleTournamentPress = (tournament: typeof mockTournaments[0]) => {
    navigation.navigate('TournamentDetails', { tournament });
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <View className="bg-white">
        {/* Header */}
        <Header
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
              <MaterialCommunityIcons name="arrow-left" size={28} color="#212121" />
            </TouchableOpacity>
          }
          title="ТУРНИРЫ"
          right={
            <TouchableOpacity>
              <MaterialCommunityIcons name="dots-vertical" size={28} color="#212121" />
            </TouchableOpacity>
          }
        />
      </View>

      {/* Tournament List */}
      <ScrollView className="flex-1 bg-transparent" showsVerticalScrollIndicator={false}>
        <Container padding="sm">
          {mockTournaments.map((tournament) => (
            <TouchableOpacity 
              key={tournament.id} 
              className="bg-gray-100 rounded-xl px-4 py-3 mb-4 shadow-sm active:bg-gray-200"
              onPress={() => handleTournamentPress(tournament)}
              activeOpacity={0.7}
            >
              <Text className="text-lg font-manrope-bold text-text-primary mb-1">{tournament.title}</Text>
              <Text className="text-base text-[#150000] mb-0.5">{tournament.format}</Text>
              <Text className="text-base text-[#150000] mb-2">Стоимость: <Text className="font-manrope-bold">200 000</Text> с команды</Text>
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="map-marker" size={18} color="#45AF31" />
                  <Text className="text-xs text-text-primary ml-1 font-manrope-bold">{tournament.location}</Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="account-group" size={18} color="#45AF31" />
                  <Text className="text-xs text-text-primary ml-1 font-manrope-bold">{tournament.participants}</Text>
                </View>
                <Text className="text-xs text-text-primary font-manrope-bold">{tournament.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}; 