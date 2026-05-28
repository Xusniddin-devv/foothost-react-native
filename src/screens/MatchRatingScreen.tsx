import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Header, SuccessModal } from '../components/common';
import { reviewsApi } from '../services/api/reviews';
import { getApiErrorMessage } from '../services/api/client';
import ChelseaSvg from '../../assets/images/profile/chelsea.svg';
import MyuSvg from '../../assets/images/profile/MYU.svg';
type MatchRatingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MatchRating'
>;

type MatchRatingScreenRouteProp = RouteProp<
  RootStackParamList,
  'MatchRating'
>;

interface Props {
  navigation: MatchRatingScreenNavigationProp;
  route: MatchRatingScreenRouteProp;
}

interface TeamLogos {
  [key: string]: React.ReactNode;
}

const teamLogos: TeamLogos = {
  'CHELSEA': <ChelseaSvg width={80} height={80} />,
  'MAN UTD': <MyuSvg width={80} height={80} />,
  'ARSENAL': <Image source={require('../../assets/images/football-club.png')} style={{ width: 80, height: 80 }} />,
  'LIVERPOOL': <Image source={require('../../assets/images/football-club.png')} style={{ width: 80, height: 80 }} />,
  'MAN CITY': <Image source={require('../../assets/images/football-club.png')} style={{ width: 80, height: 80 }} />,
  'TOTTENHAM': <Image source={require('../../assets/images/football-club.png')} style={{ width: 80, height: 80 }} />,
};

const StarRating: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
  title: string;
}> = ({ rating, onRatingChange, title }) => {
  return (
    <View className="mb-6">
      <Text className="text-[28px] font-artico-bold text-text-primary mb-3">{title}</Text>
      <View className="bg-gray-100 rounded-lg p-4">
        <View className="flex-row justify-center space-x-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => onRatingChange(star)}
              className="p-1"
            >
              <MaterialCommunityIcons
                name={star <= rating ? "star" : "star-outline"}
                size={48}
                color={star <= rating ? "#45AF31" : "#D1D5DB"}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export const MatchRatingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { matchId, teams, eventName, date, fieldName } = route.params;
  const [matchRating, setMatchRating] = useState(3);
  const [fieldRating, setFieldRating] = useState(3);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await reviewsApi.create(matchId, { matchRating, fieldRating });
      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось отправить оценку'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const getTeamLogo = (teamName: string) => {
    return teamLogos[teamName] || <Image source={require('../../assets/images/football-club.png')} style={{ width: 80, height: 80 }} />;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="#212121" />
          </TouchableOpacity>
        }
        title="ОЦЕНКА МАТЧА"
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Match Banner */}
        <View className="relative h-56 mx-4 mt-4 rounded-xl overflow-hidden">
          <Image 
            source={require('../../assets/images/stadium/matchReview.png')} 
            className="w-full h-full absolute"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black bg-opacity-30" />
          
          {/* Team Logos and VS */}
          <View className="flex-1 flex-row items-center justify-between px-6 gap-14">
            <View className="flex-row items-center justify-center flex-1">
              <Text className="text-white font-bold text-sm mr-2">{teams[0]}</Text>
              {getTeamLogo(teams[0])}
            </View>
                 
            <View className="flex-row items-center justify-center flex-1">
              {getTeamLogo(teams[1])}
              <Text className="text-white font-bold text-sm ml-2">{teams[1]}</Text>
            </View>
          </View>
        </View>

        {/* Match Information */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[28px] font-artico-bold text-text-primary">{eventName}</Text>
            <View className="bg-primary rounded-md py-1 px-2 flex-row items-center">
              <Text className="text-white font-manrope-medium text-sm mr-1">9.9</Text>
              <MaterialCommunityIcons name="star" size={16} color="white" />
            </View>
          </View>
          
          <Text className="text-[#758A80] font-manrope-medium text-xs mb-1">{date}</Text>
          <Text className="text-[#758A80] font-manrope-medium text-xs mb-6">Футбольное поле: {fieldName}</Text>
        </View>

        {/* Rating Sections */}
        <View className="px-4">
          <StarRating
            rating={matchRating}
            onRatingChange={setMatchRating}
            title="КАК ВАМ МАТЧ?"
          />
          
          <StarRating
            rating={fieldRating}
            onRatingChange={setFieldRating}
            title="КАК ВАМ ПОЛЕ?"
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="px-4 pb-6">
        <TouchableOpacity
          className={`rounded-lg py-4 ${submitting ? 'bg-gray-400' : 'bg-primary'}`}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center text-lg font-manrope-bold">Отправить</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="ОЦЕНКА ОТПРАВЛЕНА"
        message="Спасибо за вашу оценку! Ваше мнение поможет другим пользователям."
      />
    </SafeAreaView>
  );
}; 