import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SuccessModal } from '../components/common';
import { paymentsApi } from '../services/api/payments';
import { getApiErrorMessage } from '../services/api/client';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
import { useAuth } from '../contexts/AuthContext';

import ClickSvg from '../../assets/images/payments/click.svg';
import PaymeSvg from '../../assets/images/payments/payme.svg';
import RahmatSvg from '../../assets/images/payments/rahmat.svg';

type PaymentScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PaymentScreen'
>;

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'PaymentScreen'>;

interface Props {
  navigation: PaymentScreenNavigationProp;
  route: PaymentScreenRouteProp;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PAYMENT_METHODS = [
  { key: 'click',  label: 'CLICK',  Icon: ClickSvg },
  { key: 'payme',  label: 'PAYME',  Icon: PaymeSvg },
  { key: 'rahmat', label: 'RAHMAT', Icon: RahmatSvg },
];

export const PaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const lobbyId = route?.params?.lobbyId;
  const amountParam = route?.params?.amount;
  const [successVisible, setSuccessVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState<boolean>(!!lobbyId);
  const [lobby, setLobby] = useState<Awaited<ReturnType<typeof lobbiesApi.get>> | null>(null);
  const [field, setField] = useState<Awaited<ReturnType<typeof fieldsApi.get>> | null>(null);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [nextShare, setNextShare] = useState(amountParam ?? 0);
  const [amountInput, setAmountInput] = useState('');
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const initiatedPaymentIdRef = useRef<string | null>(null);

  const isCreator = Boolean(user?.id && lobby?.creatorId && user.id === lobby.creatorId);

  useEffect(() => {
    if (!lobbyId) return;
    let cancelled = false;
    (async () => {
      try {
        const [l, payStatus] = await Promise.all([
          lobbiesApi.get(lobbyId),
          paymentsApi.status(lobbyId),
        ]);
        if (cancelled) return;
        setLobby(l);
        setRemainingAmount(payStatus.remainingAmount);
        setNextShare(payStatus.nextShare);
        if (l.fieldId) {
          const f = await fieldsApi.get(l.fieldId).catch(() => null);
          if (!cancelled && f) setField(f);
        }
      } catch (err) {
        if (!cancelled) {
          Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось загрузить данные оплаты'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lobbyId]);

  useEffect(() => {
    const suggested = isCreator ? remainingAmount : nextShare;
    if (suggested > 0) setAmountInput(String(suggested));
  }, [isCreator, nextShare, remainingAmount]);

  const checkPaymentStatus = useCallback(async () => {
    if (!lobbyId) return;
    try {
      const status = await paymentsApi.status(lobbyId);
      setRemainingAmount(status.remainingAmount);
      setNextShare(status.nextShare);
      const initiatedId = initiatedPaymentIdRef.current;
      const target = initiatedId
        ? status.payments.find((p) => p.id === initiatedId)
        : status.payments.find((p) => p.userId === user?.id);
      if (!target) return;
      if (target.status === 'paid') {
        setAwaitingPayment(false);
        initiatedPaymentIdRef.current = null;
        setSuccessVisible(true);
      } else if (target.status === 'failed') {
        setAwaitingPayment(false);
        initiatedPaymentIdRef.current = null;
        Alert.alert('Платёж не прошёл', 'Попробуйте ещё раз другим способом.');
      }
    } catch {
      // silent; user can retry via banner
    }
  }, [lobbyId, user?.id]);

  useEffect(() => {
    if (!awaitingPayment) return;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void checkPaymentStatus();
    });
    return () => sub.remove();
  }, [awaitingPayment, checkPaymentStatus]);

  const handleSelect = async (_key: string) => {
    if (!lobbyId) {
      setSuccessVisible(true);
      return;
    }
    setProcessing(true);
    try {
      const parsed = Number((amountInput || '').replace(/[^\d]/g, ''));
      const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
      const { redirectUrl, paymentId } = await paymentsApi.initiate(lobbyId, amount);
      initiatedPaymentIdRef.current = paymentId ?? null;
      if (redirectUrl) {
        const can = await Linking.canOpenURL(redirectUrl);
        if (can) {
          await Linking.openURL(redirectUrl);
          setAwaitingPayment(true);
        } else {
          Alert.alert('Ошибка', 'Не удалось открыть платёжное приложение.');
        }
      } else {
        // No redirect — already settled server-side
        setSuccessVisible(true);
      }
    } catch (err) {
      Alert.alert('Ошибка оплаты', getApiErrorMessage(err, 'Не удалось инициировать платёж'));
    } finally {
      setProcessing(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessVisible(false);
    navigation.navigate('BookingStep1', {
      showSchedule: true,
      fieldId: lobby?.fieldId,
      lobbyId: lobby?.id,
    });
  };

  const computedAmount = useMemo(() => {
    const parsed = Number((amountInput || '').replace(/[^\d]/g, ''));
    if (parsed > 0) return parsed;
    return isCreator ? remainingAmount : nextShare;
  }, [amountInput, isCreator, nextShare, remainingAmount]);

  const displayAmount = `${computedAmount.toLocaleString('ru-RU')} SUM`;

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Stadium hero — peeking behind the sheet */}
      <View style={{ height: SCREEN_HEIGHT * 0.38 }}>
        <Image
          source={field?.photos?.[0] ? { uri: field.photos[0] } : require('../../assets/images/stadium/stadium.png')}
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
              {field?.name ?? 'Стадион'}
            </Text>
            <View className="bg-primary rounded-md px-2 py-0.5 flex-row items-center" style={{ gap: 3 }}>
              <Text className="text-white font-manrope-bold text-sm">
                {field ? Number(field.rating ?? 0).toFixed(1) : '0.0'}
              </Text>
              <MaterialCommunityIcons name="star" size={12} color="white" />
            </View>
          </View>
          <View className="flex-row items-center mt-0.5">
            <MaterialCommunityIcons name="map-marker" size={12} color="white" />
            <Text className="text-white font-manrope-medium text-xs ml-1">
              {field?.address ?? '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
      <View
        className="flex-1 bg-white"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 }}
      >
        {/* Sheet header */}
        <View className="flex-row items-center px-4 pt-5 pb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#212121" />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-artico-bold text-[20px] text-text-primary">
            ОПЛАТА
          </Text>
          {/* Spacer to center title */}
          <View style={{ width: 28 }} />
        </View>

        {/* Amount */}
        <View className="items-center pt-4 pb-6 px-4">
          <Text className="font-manrope-medium text-sm text-gray-500 mb-2">
            {isCreator ? 'Ваш взнос (сум)' : 'Сумма к оплате'}
          </Text>
          <TextInput
            value={amountInput}
            onChangeText={setAmountInput}
            keyboardType="number-pad"
            editable={!processing}
            placeholder={String(isCreator ? remainingAmount : nextShare)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg text-text-primary mb-3"
            placeholderTextColor="#9CA3AF"
          />
          <Text className="font-artico-bold text-[40px] text-text-primary" style={{ lineHeight: 44 }}>
            {displayAmount}
          </Text>
          <Text className="font-manrope-medium text-xs text-gray-500 mt-2">
            Остаток по лобби: {remainingAmount.toLocaleString('ru-RU')} SUM
          </Text>
        </View>

        {/* Payment methods */}
        <View className="px-4">
          <Text className="font-manrope-medium text-sm text-gray-500 mb-3">Способы оплаты</Text>

          {PAYMENT_METHODS.map((method, idx) => (
            <TouchableOpacity
              key={method.key}
              onPress={() => !processing && handleSelect(method.key)}
              disabled={processing}
              className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
              style={{ marginBottom: idx < PAYMENT_METHODS.length - 1 ? 10 : 0, opacity: processing ? 0.6 : 1 }}
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
              {processing ? (
                <ActivityIndicator color="#45AF31" />
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={22} color="#9E9E9E" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {awaitingPayment ? (
          <View className="mx-4 mt-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
            <Text className="font-manrope-bold text-sm text-text-primary">
              Ожидаем подтверждение оплаты
            </Text>
            <Text className="font-manrope-medium text-xs text-gray-600 mt-1">
              Вернитесь в приложение после завершения оплаты — статус обновится автоматически.
            </Text>
            <TouchableOpacity
              onPress={() => void checkPaymentStatus()}
              className="mt-2 self-start rounded-lg bg-primary px-3 py-1.5"
              activeOpacity={0.7}
            >
              <Text className="font-manrope-bold text-xs text-white">Проверить статус</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Cancel button */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-white">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="border border-gray-300 rounded-xl py-4 items-center bg-white"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Отмена"
          >
            <Text className="text-text-primary font-manrope-bold text-base">Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>

      {/* Success modal */}
      <SuccessModal
        visible={successVisible}
        onClose={handleSuccessClose}
        title="ОПЛАТА ПРОШЛА"
        message="Ваша оплата успешно проведена."
      />
      {loading ? (
        <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' }}>
          <ActivityIndicator size="large" color="#45AF31" />
        </View>
      ) : null}
    </SafeAreaView>
  );
};
