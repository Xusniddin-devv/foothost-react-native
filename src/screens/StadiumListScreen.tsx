import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { FieldCard, Container, Header } from '../components/common';
import { fieldsApi } from '../services/api/fields';
import { getApiErrorMessage } from '../services/api/client';
import type { Field } from '../types/api';

const FALLBACK_IMAGE = require('../../assets/images/homepage/homepage.png');

type StadiumListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'StadiumList'
>;

interface Props {
  navigation: StadiumListScreenNavigationProp;
  rootNavigation?: StackNavigationProp<RootStackParamList, 'Main'>;
}

export const StadiumListScreen: React.FC<Props> = ({
  navigation,
  rootNavigation,
}) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    try {
      const data = await fieldsApi.list();
      setFields(data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить список полей'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFields();
    }, [fetchFields]),
  );

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFields();
  }, [fetchFields]);

  const handleDetailPress = useCallback(
    (fieldId: string) => {
      rootNavigation?.navigate('BookingStep1', { fieldId });
    },
    [rootNavigation],
  );

  const sorted = useMemo(
    () => [...fields].sort((a, b) => b.rating - a.rating),
    [fields],
  );

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <View className="bg-white">
        <Header
          left={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-2"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={28}
                color="#212121"
              />
            </TouchableOpacity>
          }
          title="СПИСОК ПОЛЕЙ"
          right={
            <TouchableOpacity>
              <MaterialCommunityIcons
                name="dots-vertical"
                size={28}
                color="#212121"
              />
            </TouchableOpacity>
          }
        />

        <View className="items-center pb-2 -mt-2">
          <Text className="text-gray-600 font-manrope-medium text-xs">
            {loading ? 'Загрузка…' : `${fields.length} стадион(ов)`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1F7A1F" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 bg-transparent"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1F7A1F"
            />
          }
        >
          {error && (
            <Container padding="sm">
              <Text className="text-red-500 text-center my-4 font-manrope-medium">
                {error}
              </Text>
            </Container>
          )}

          {!error && sorted.length === 0 && (
            <Container padding="sm">
              <View className="py-12 items-center">
                <Text className="text-gray-500 font-manrope-medium text-center">
                  Пока нет доступных полей.{'\n'}Потяните вниз, чтобы обновить.
                </Text>
              </View>
            </Container>
          )}

          {sorted.map((item) => {
            const firstPhoto = item.photos?.[0];
            const imageSource = firstPhoto
              ? { uri: firstPhoto }
              : FALLBACK_IMAGE;
            return (
              <Container key={item.id} padding="sm">
                <View className="rounded-xl overflow-hidden shadow-lg bg-white">
                  <FieldCard
                    name={item.name}
                    location={item.address}
                    rating={Number(item.rating.toFixed(1))}
                    distance={`${item.reviewsCount} отзывов`}
                    price={item.pricePerHour}
                    image={imageSource}
                    ratingPosition="next-to-name"
                    onPress={() => handleDetailPress(item.id)}
                  />
                  <TouchableOpacity
                    className="bg-primary py-3 items-center"
                    onPress={() => handleDetailPress(item.id)}
                    style={{ marginTop: 0 }}
                  >
                    <Text className="text-white text-base font-bold">
                      Подробнее
                    </Text>
                  </TouchableOpacity>
                </View>
              </Container>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
