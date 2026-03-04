import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Container, LoginButton, RegisterButton } from '../components/common';
import Ellipse1 from '../../assets/images/onboardingPage/ellipse1.svg';
import Ellipse2 from '../../assets/images/onboardingPage/ellipse2.svg';
import Ellipse3 from '../../assets/images/onboardingPage/ellipse3.svg';
import BgBall from '../../assets/images/onboardingPage/bgBall.svg';
import PlayerWithBall from '../../assets/images/onboardingPage/playerwithBall.svg';
import Logo from '../../assets/images/logo.svg';

const { width, height } = Dimensions.get('window');

export const OnboardingScreen: React.FC<any> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Background ball - more visible */}
      <View className="absolute top-32 left-6 right-0 items-center">
        <BgBall width={width * 0.7} height={width * 0.75} />
      </View>

      {/* Ellipses positioned exactly as in image */}
      <View className="absolute top-0 right-0">
        <Ellipse1 width={width * 0.5} height={height * 0.5} style={styles.ellipse1} />
      </View>
      <View className="absolute bottom-0 left-0">
        <Ellipse3 width={width * 0.4} height={width * 0.35} style={styles.ellipse3} />
      </View>
      <View className="absolute bottom-0 right-0">
        <Ellipse2 width={width * 0.45} height={width * 0.65} style={styles.ellipse2} />
      </View>

      {/* Player image - larger and better positioned */}
      <View className="absolute top-20 left-0 right-0 items-center">
        <PlayerWithBall width={width * 1.4} height={width * 1.12} />
      </View>

      <Container padding="sm" className="flex-1">
        {/* Top bar: logo on left, time on right */}
        <View className="flex-row justify-between items-center pt-8">
          <View className="flex-row items-center">
            <Logo width={100} height={40} />
          </View>
        </View>

        {/* Main content */}
        <View className="flex-1 justify-end pb-6">
          <Text className="text-5xl font-artico-medium mb-3 mt-16 leading-tight">
            {`ФУТБОЛ ДЛЯ ВСЕХ
НАЙДИ ПОЛЕ И
ИГРАЙ!`}
          </Text>
          <Text className="text-lg font-manrope-medium mb-4 opacity-70 leading-relaxed">
            {`Зови друзей, выбирай время и
выходи на матч!`}
          </Text>

          <LoginButton
            onPress={() => navigation.navigate('Login')}
          />
          <RegisterButton
            onPress={() => navigation.navigate('Register')}
            className="mt-4"
          />
        </View>
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ellipse1: { position: 'absolute', top: -width * 0.37, right: -width * 0.03 },
  ellipse2: { position: 'absolute', bottom: width * 0.95, right: -width * 0.02 },
  ellipse3: { position: 'absolute', bottom: width * 1.1, left: -width * 0.12 },
}); 