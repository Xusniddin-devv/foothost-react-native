import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface NewsCardProps {
  title: string;
  image: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  title,
  image,
  onPress,
  className = "",
}) => {
  return (
    <TouchableOpacity
      className={`rounded-lg overflow-hidden relative ${className}`}
      onPress={onPress}
      style={{ width: '100%' }}
    >
      <View className="w-full h-40 rounded-lg">
        {React.cloneElement(image as React.ReactElement<{ style?: any }>, {
          style: {
            width: '100%',
            height: '100%',
            borderRadius: 8
          }
        })}
      </View>
      <View className="absolute bottom-2 left-2 right-2 z-20">
        <Text className="text-white font-manrope-bold text-xs leading-4">
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}; 