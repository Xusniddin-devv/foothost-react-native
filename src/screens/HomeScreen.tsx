import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// ─── FACEIT-style rating arc badge ───────────────────────────────────────────
interface RatingBadgeProps {
  level: number;   // 1-10
  score: number;   // current points
  maxScore: number;
}

const GREEN = '#45AF31';

const RatingBadge: React.FC<RatingBadgeProps> = ({ level, score: _score, maxScore: _maxScore }) => {
  const size = 48;
  /** Gap at bottom (~60°); arc ~300° with round caps */
  const startAngle = 120;
  const totalSweep = 300;
  const progress = Math.min(Math.max(level / 10, 0), 1);
  const filledSweep = totalSweep * progress;

  /** Wider white stroke under green = white rims on both sides of the green band */
  const greenStroke = 5;
  const whiteStroke = greenStroke + 3;
  const trackStroke = whiteStroke;
  const inset = 1.5;
  const radius = size / 2 - whiteStroke / 2 - inset;
  const cx = size / 2;
  const cy = size / 2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pt = (angle: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });

  const arcPath = (fromDeg: number, sweep: number) => {
    if (sweep <= 0) return '';
    const s = pt(fromDeg);
    const e = pt(fromDeg + sweep);
    const large = sweep > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  const trackPath = arcPath(startAngle, totalSweep);
  const fillPath = arcPath(startAngle, filledSweep);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: size / 2,
        backgroundColor: '#FFFFFF',
      }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Light track (full arc) */}
        <Path
          d={trackPath}
          stroke="rgba(0,0,0,0.09)"
          strokeWidth={trackStroke}
          fill="none"
          strokeLinecap="round"
        />
        {filledSweep > 0 && (
          <>
            {/* White “sandwich” under green → inner + outer white borders */}
            <Path
              d={fillPath}
              stroke="#FFFFFF"
              strokeWidth={whiteStroke}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d={fillPath}
              stroke={GREEN}
              strokeWidth={greenStroke}
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
      </Svg>

      <Text
        style={{
          color: GREEN,
          fontFamily: 'ManRope-Bold',
          fontSize: 18,
          lineHeight: 28,
          letterSpacing: -0.8,
        }}
      >
        {level}
      </Text>
    </View>
  );
};

// Import reusable components
import {
  SectionHeader,
  FieldCard,
  Container,
} from '../components/common';

// Import SVG files
import News1Svg from '../../assets/images/homepage/news1.svg';
import News2Svg from '../../assets/images/homepage/news2.svg';
import BestFieldSvg from '../../assets/images/homepage/bestfield.svg';
import MockClansSvg from '../../assets/images/homepage/mockClans.svg';
import ReadyMatchSvg from '../../assets/images/homepage/readyMatch.svg';
import Logo from '../../assets/images/logo_white.svg';
import Bell from '../../assets/images/homepage/bell-white.svg';

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

        {/* White only for main feed — not full-screen behind tab bar */}
        <View className="bg-white">
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
              {/* FACEIT-style rating arc — bottom-right */}
              <View className="absolute -bottom-3 -right-3 z-10">
                <RatingBadge level={10} score={1000} maxScore={2000} />
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
        <View className="mb-4">
          {/* Players to follow - horizontal scroll */}
          <View className="px-5 mb-3">
            <SectionHeader
              title="NEWS"
              onViewAll={() => console.log('View all news')}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            className="mb-4"
          >
            {[
              { id: 1, name: 'Qobiljonov qobil', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/220px-Cristiano_Ronaldo_2018.jpg' },
              { id: 2, name: 'Qobiljonov qobil', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/220px-Cristiano_Ronaldo_2018.jpg' },
              { id: 3, name: 'Qobiljonov qobil', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/220px-Cristiano_Ronaldo_2018.jpg' },
              { id: 4, name: 'Qobiljonov qobil', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/220px-Cristiano_Ronaldo_2018.jpg' },
            ].map((player) => (
              <View
                key={player.id}
                className="items-center border border-primary rounded-xl p-3"
                style={{ width: 140 }}
              >
                <View className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-[#ececec]">
                  <Image source={{ uri: player.avatar }} className="w-full h-full" resizeMode="cover" />
                </View>
                <Text className="font-manrope-semibold text-[13px] text-text-primary text-center mb-2" numberOfLines={1}>
                  {player.name}
                </Text>
                <TouchableOpacity className="border border-primary rounded-lg px-4 py-1">
                  <Text className="text-primary font-manrope-medium text-xs">Подписаться</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* News grid - fixed width inside px-5 */}
          <View className="px-5">
            {/* Row 1 — two equal cards */}
            <View className="flex-row mb-2" style={{ gap: 8 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => console.log('News 1')}>
                <View className="h-40 rounded-xl overflow-hidden">
                  <News1Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
                </View>
                <View className="absolute bottom-2 left-2 right-2">
                  <Text className="text-white font-manrope-semibold text-xs leading-4" numberOfLines={2}>
                    Gamemag.ru - Состоялся релиз футбольного...
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => console.log('News 2')}>
                <View className="h-40 rounded-xl overflow-hidden">
                  <News2Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
                </View>
                <View className="absolute bottom-2 left-2 right-2">
                  <Text className="text-white font-manrope-semibold text-xs leading-4" numberOfLines={2}>
                    Yamal helps Barcelona seal La Liga title at rivals
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 2 — full-width card */}
            <TouchableOpacity className="w-full" onPress={() => console.log('Large news')}>
              <View className="w-full h-56 rounded-xl overflow-hidden">
                <BestFieldSvg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
              </View>
              <View className="absolute top-4 left-4 right-4">
                <Text className="text-white text-2xl font-artico-bold mb-1" style={{ lineHeight: 28 }}>
                  ЛУЧШИЕ ФУТБОЛЬНЫЕ ПОЛЯ В ТАШКЕНТЕ
                </Text>
                <Text className="text-white font-manrope-medium text-xs">Debits - 03 June 2023</Text>
              </View>
              <View className="absolute bottom-4 right-4 border border-white rounded-lg px-5 py-2">
                <Text className="text-white font-manrope-medium text-sm">Читать</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* (Clans and Ready-to-Play sections removed) */}
        <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}; 