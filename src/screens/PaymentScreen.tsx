import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SuccessModal } from '../components/common';

import ClickSvg from '../../assets/images/payments/click.svg';
import PaymeSvg from '../../assets/images/payments/payme.svg';
import RahmatSvg from '../../assets/images/payments/rahmat.svg';

type PaymentScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PaymentScreen'
>;

interface Props {
  navigation: PaymentScreenNavigationProp;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PAYMENT_METHODS = [
  { key: 'click',  label: 'CLICK',  Icon: ClickSvg },
  { key: 'payme',  label: 'PAYME',  Icon: PaymeSvg },
  { key: 'rahmat', label: 'RAHMAT', Icon: RahmatSvg },
];

export const PaymentScreen: React.FC<Props> = ({ navigation }) => {
  const [successVisible, setSuccessVisible] = useState(false);

  const handleSelect = (_key: string) => {
    setSuccessVisible(true);
  };

  const handleSuccessClose = () => {
    setSuccessVisible(false);
    navigation.navigate('BookingStep1', { showSchedule: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Stadium hero — peeking behind the sheet */}
      <View style={{ height: SCREEN_HEIGHT * 0.38 }}>
        <Image
          source={require('../../assets/images/stadium/stadium.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {/* Name overlay */}
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            left: 16,
          }}
        >
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Text className="font-artico-bold text-white text-[20px]" style={{ letterSpacing: 1 }}>
              BUNYODKOR
            </Text>
            <View className="bg-primary rounded-md px-2 py-0.5 flex-row items-center" style={{ gap: 3 }}>
              <Text className="text-white font-manrope-bold text-sm">9.9</Text>
              <MaterialCommunityIcons name="star" size={12} color="white" />
            </View>
          </View>
          <View className="flex-row items-center mt-0.5">
            <MaterialCommunityIcons name="map-marker" size={12} color="white" />
            <Text className="text-white font-manrope-medium text-xs ml-1">Малая кольцевая дорога</Text>
          </View>
        </View>
      </View>

      {/* Payment sheet */}
      <View
        className="flex-1 bg-white"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 }}
      >
        {/* Sheet header */}
        <View className="flex-row items-center px-4 pt-5 pb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#212121" />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-manrope-bold text-base text-text-primary">
            ОПЛАТА
          </Text>
          {/* Spacer to center title */}
          <View style={{ width: 28 }} />
        </View>

        {/* Amount */}
        <View className="items-center pt-4 pb-6">
          <Text className="font-manrope-medium text-sm text-gray-500 mb-2">Стоимость аванса</Text>
          <Text className="font-artico-bold text-[40px] text-text-primary" style={{ lineHeight: 44 }}>
            200.000 SUM
          </Text>
        </View>

        {/* Payment methods */}
        <View className="px-4">
          <Text className="font-manrope-medium text-sm text-gray-500 mb-3">Способы оплаты</Text>

          {PAYMENT_METHODS.map((method, idx) => (
            <TouchableOpacity
              key={method.key}
              onPress={() => handleSelect(method.key)}
              className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
              style={{ marginBottom: idx < PAYMENT_METHODS.length - 1 ? 10 : 0 }}
              activeOpacity={0.7}
            >
              <View
                className="rounded-xl overflow-hidden items-center justify-center"
                style={{ width: 48, height: 48 }}
              >
                <method.Icon width={48} height={48} />
              </View>
              <Text className="flex-1 font-manrope-bold text-base text-text-primary ml-4">
                {method.label}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#9E9E9E" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Cancel button */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-white">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-primary rounded-xl py-4 items-center"
          >
            <Text className="text-white font-manrope-bold text-base">Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Success modal */}
      <SuccessModal
        visible={successVisible}
        onClose={handleSuccessClose}
        title="ОПЛАТА ПРОШЛА"
        message="Ваша оплата успешно проведена."
      />
    </SafeAreaView>
  );
};
