import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// Import reusable components
import { 
  SearchBar, 
  FilterButton, 
  SectionHeader, 
  FieldCard, 
  NewsCard, 
  ClanCard,
  Container,
  Header
} from '../components/common';

// Import SVG files
import News1Svg from '../../assets/images/homepage/news1.svg';
import News2Svg from '../../assets/images/homepage/news2.svg';
import BestFieldSvg from '../../assets/images/homepage/bestfield.svg';
import MockClansSvg from '../../assets/images/homepage/mockClans.svg';
import ReadyMatchSvg from '../../assets/images/homepage/readyMatch.svg';
import Logo from '../../assets/images/logo.svg';
import Bell from '../../assets/images/homepage/bell.svg';

const mockClans = [
  { id: 1, name: 'Paxtakor', wins: 37, losses: 8, score: 1886, rank: 1 },
  { id: 2, name: 'Paxtakor', wins: 37, losses: 8, score: 1456, rank: 2 },
  { id: 3, name: 'Paxtakor', wins: 37, losses: 8, score: 1286, rank: 3 },
];

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Green Top Section */}
        <View 
          className="bg-primary px-5"
          style={{ paddingTop: insets.top + 16, paddingBottom: 60 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Logo width={100} height={40} />
            <TouchableOpacity>
              <Bell width={24} height={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Section Content overlapping green bg */}
        <View className="px-5 -mt-16">
          <View className="flex-row items-end mb-4">
            {/* Avatar with level badge overlapping */}
            <View className="relative mr-4">
              <View className="w-[110px] h-[110px] rounded-full border-4 border-white bg-[#ececec] overflow-hidden justify-center items-center">
                <Image 
                  source={{ uri: 'https://i.imgflip.com/1ur9b0.jpg' }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              {/* Level Badge */}
              <View className="absolute -bottom-1 left-4 w-[38px] h-[38px] rounded-full border-4 border-white bg-primary justify-center items-center z-10">
                <Text className="text-white font-artico-bold text-xs" style={{marginTop: 1}}>10</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="flex-1 pb-3">
              <View className="h-[6px] w-full bg-[#d0d0d0] rounded-full overflow-hidden mb-1">
                <View className="h-full bg-primary w-[85%] rounded-full" />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[#5B5757] font-manrope-medium text-xs">1000</Text>
                <Text className="text-[#5B5757] font-manrope-medium text-xs">2000</Text>
              </View>
            </View>
          </View>

          {/* Name & Title */}
          <Text className="text-[28px] font-artico-bold text-text-primary mb-1 uppercase tracking-widest mt-2" style={{lineHeight: 32}}>
            ШУКУР ГАЙНУТДИНОВ
          </Text>
          <View className="flex-row items-center mb-6">
            <Text className="text-base mr-1.5">🏆</Text>
            <Text className="text-[#322D2D] font-manrope-medium text-[15px]">Полупрофи</Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mb-4">
            <TouchableOpacity className="flex-1 bg-primary py-3.5 rounded-lg mr-2 items-center justify-center">
              <Text className="text-white font-manrope-bold text-[15px]">Найти матч</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-primary py-3.5 rounded-lg ml-2 items-center justify-center">
              <Text className="text-white font-manrope-bold text-[15px]">Создать лобби</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Fields Section */}
        <Container padding="sm">
          <SectionHeader 
            title="РЕКОМЕНДУЕМЫЕ ЛОББИ"
            onViewAll={() => console.log('View all fields')}
          />

          <FieldCard
            name="BUNYODKOR"
            location="Малая кольцевая дорога"
            rating={9.9}
            distance="4.9 км от вас"
            image={require('../../assets/images/homepage/homepage.png')}
            onPress={() => console.log('Field pressed')}
            roundedBottom={true}
          />

          {/* Pagination Dots */}
          <View className="flex-row justify-center mt-4 space-x-2">
            <View className="w-2 h-2 bg-primary rounded-full" />
            <View className="w-2 h-2 bg-gray-300 rounded-full" />
            <View className="w-2 h-2 bg-gray-300 rounded-full" />
            <View className="w-2 h-2 bg-gray-300 rounded-full" />
            <View className="w-2 h-2 bg-gray-300 rounded-full" />
          </View>
        </Container>

        {/* News Section */}
        <Container padding="sm" className="mb-2 w-full">
          <SectionHeader 
            title="NEWS"
            onViewAll={() => console.log('View all news')}
          />

          {/* News Grid */}
          <View className="w-full mb-4">
            {/* First Row - 2 items */}
            <View className="w-full flex-row mb-2">
              <TouchableOpacity className="w-1/2 pr-1" onPress={() => console.log('News 1 pressed')}>
                <View className="w-full h-40 rounded-lg overflow-hidden">
                  <News1Svg width="100%" height="100%" />
                </View>
                <View className="absolute bottom-2 left-5 right-2 z-20">
                  <Text className="text-white font-manrope-medium text-xs leading-4">
                    Gamemag.ru - Состоялся релиз футбольного...
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity className="w-1/2 pl-1" onPress={() => console.log('News 2 pressed')}>
                <View className="w-full h-40 rounded-lg overflow-hidden">
                  <News2Svg width="100%" height="100%" />
                </View>
                <View className="absolute bottom-2 left-5 right-2 z-20">
                  <Text className="text-white font-manrope-medium text-xs leading-4">
                    Yamal helps Barcelona seal La Liga title at rivals
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Second Row - 1 item */}
            <TouchableOpacity className="w-full" onPress={() => console.log('Large news pressed')}>
              <View className="w-full h-64 rounded-lg overflow-hidden">
                <BestFieldSvg width="100%" height="100%" />
              </View>
              <View className="absolute top-4 left-4">
                <Text className="text-white text-[28px] font-artico-bold mb-1">
                  ЛУЧШИЕ ФУТБОЛЬНЫЕ ПОЛЯ В ТАШКЕНТЕ
                </Text>
                <Text className="text-white font-manrope-medium text-sm">Debits - 03 June 2023</Text>
              </View>
              <View className="absolute bottom-4 right-4 border border-white rounded-lg px-6 py-2">
                <Text className="text-white font-manrope-medium">Читать</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Container>

        {/* Clans Section */}
        <Container padding="sm">
          <SectionHeader 
            title="CLANS"
            onViewAll={() => console.log('View all clans')}
          />

          <View className="space-y-3 px-3">
            {mockClans.map((clan) => (
              <ClanCard
                key={clan.id}
                rank={clan.rank}
                name={clan.name}
                wins={clan.wins}
                losses={clan.losses}
                score={clan.score}
                logo={<MockClansSvg width={34} height={42} />}
              />
            ))}
          </View>
        </Container>

        {/* Ready to Play Section */}
        <Container padding="sm" className="mb-4">
          <View className="flex-row items-center justify-between bg-[#EEEDED] p-6 rounded-lg">
            <View className="flex-1">
              <MaskedView
                style={{ flexDirection: 'row', alignSelf: 'flex-start' }}
                maskElement={
                  <Text
                    style={{
                      fontSize: 40,
                      fontFamily: 'Artico-Bold',
                      lineHeight: 37,
                      letterSpacing: 0.1,
                      color: 'black',
                    }}
                  >
                    ГОТОВ К{"\n"}ИГРЕ?
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#A2C673', '#43AE30']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={{
                    width: 320,
                    height: 100, 
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      opacity: 0,
                      fontSize: 40,
                      fontFamily: 'Artico',
                      fontWeight: 'bold',
                      lineHeight: 37,
                      letterSpacing: 0.1,
                    }}
                  >
                    ГОТОВ К{"\n"}ИГРЕ?
                  </Text>
                </LinearGradient>
              </MaskedView>
              <TouchableOpacity className="mt-2 border-2 border-primary rounded-lg px-6 py-3 self-start">
                <Text className="text-primary font-manrope-medium">Создать Матч</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              <View className="absolute -top-56 -left-14 rounded-lg">
                <ReadyMatchSvg width="28%" height="50%" />
              </View>
            </View>
          </View>
        </Container>
      </ScrollView>
    </View>
  );
}; 