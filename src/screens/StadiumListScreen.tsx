import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { FieldCard, Container, Header, FilterButton } from '../components/common';
import Logo from '../../assets/images/logo.svg';

// 1. Add 'price' to the mock data
const mockStadiums = [
  { id: 1, name: 'BUNYODKOR', location: 'Малая кольцевая дорога', distance: '4.9 км от вас', rating: 9.9, price: 200000, image: require('../../assets/images/homepage/homepage.png') },
  { id: 2, name: 'BUNYODKOR', location: 'Малая кольцевая дорога', distance: '4.9 км от вас', rating: 9.9, price: 200000, image: require('../../assets/images/homepage/homepage.png') },
  { id: 3, name: 'BUNYODKOR', location: 'Малая кольцевая дорога', distance: '4.9 км от вас', rating: 9.9, price: 200000, image: require('../../assets/images/homepage/homepage.png') },
];

const mockDates = [
  { label: 'Сегодня', value: 'today', day: 'Ср' },
  { label: 'Завтра', value: 'tomorrow', day: 'Чт' },
  { label: '11.06', value: '11.06', day: 'Pt' },
];

type StadiumListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'StadiumList'
>;

interface Props {
  navigation: StadiumListScreenNavigationProp;
  rootNavigation?: StackNavigationProp<RootStackParamList, 'Main'>;
}

export const StadiumListScreen: React.FC<Props> = ({ navigation, rootNavigation }) => {
  const [selectedDate, setSelectedDate] = useState('today');

  const handleDetailPress = () => {
    if (rootNavigation) {
      rootNavigation.navigate('BookingStep1');
    }
  };

  const textShadow = {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <View className="bg-white">
        {/* Header Layout */}
        <Header
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
              <MaterialCommunityIcons name="arrow-left" size={28} color="#212121" />
            </TouchableOpacity>
          }
          title="СПИСОК ПОЛЕЙ"
          right={
            <TouchableOpacity>
              <MaterialCommunityIcons name="dots-vertical" size={28} color="#212121" />
            </TouchableOpacity>
          }
        />

        {/* Stadium count subtext */}
        <View className="items-center pb-2 -mt-2">
          <Text className="text-gray-600 font-manrope-medium text-xs">121 стадион</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-transparent">
        {/* Use FieldCard for each stadium */}
        {mockStadiums.map((item) => (
          <Container key={item.id} padding="sm">
            <View className="rounded-xl overflow-hidden shadow-lg bg-white">
              <FieldCard
                name={item.name}
                location={item.location}
                rating={item.rating}
                distance={item.distance}
                price={item.price}
                image={item.image}
                ratingPosition="next-to-name"
                onPress={handleDetailPress}
              />
              <TouchableOpacity 
                className="bg-primary py-3 items-center"
                onPress={handleDetailPress}
                style={{ marginTop: 0 }}
              >
                <Text className="text-white text-base font-bold">Подробнее</Text>
              </TouchableOpacity>
            </View>
          </Container>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};