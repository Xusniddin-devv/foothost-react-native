import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { StadiumListScreen } from '../screens/StadiumListScreen';
import { TournamentsScreen } from '../screens/TournamentsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

/** Matches `background.default` — same strip as App root so no extra “card” colour. */
export const MAIN_APP_SHELL = '#F5F5F5';

const PILL_HEIGHT = 52;
const PILL_GAP_ABOVE_HOME = 8;
const PILL_GAP_BELOW_CONTENT = 8;
const PILL_HORIZONTAL_INSET = 24;
const PILL_MAX_WIDTH = 400;

/**
 * In-flow tab bar (not position:absolute) so tab scenes are not covered — scroll content is never
 * clipped by the bar. Pill: transparent, hairline border only — no shadow/elevation (those read as grey).
 */
function FloatingPillTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarWrap,
        {
          paddingTop: PILL_GAP_BELOW_CONTENT,
          paddingBottom: insets.bottom + PILL_GAP_ABOVE_HOME,
          paddingHorizontal: PILL_HORIZONTAL_INSET,
        },
      ]}
    >
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? '#45AF31' : '#212121';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const icon = options.tabBarIcon?.({
            focused: isFocused,
            color,
            size: 28,
          });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {icon}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

type MainTabNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Main'>;
};

export const MainTabNavigator: React.FC<MainTabNavigatorProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight =
    PILL_GAP_BELOW_CONTENT + PILL_HEIGHT + PILL_GAP_ABOVE_HOME + insets.bottom;

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      tabBar={(props) => <FloatingPillTabBar {...props} />}
      screenOptions={({ route }: { route: RouteProp<Record<string, object | undefined>, string> }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: 'transparent' }} />,
        tabBarStyle: {
          position: 'absolute',
          height: tabBarHeight,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          if (route.name === 'Home') {
            return <MaterialCommunityIcons name="home" size={28} color={focused ? '#45AF31' : '#212121'} />;
          }
          if (route.name === 'StadiumList') {
            return <MaterialCommunityIcons name="soccer-field" size={28} color={focused ? '#45AF31' : '#212121'} />;
          }
          if (route.name === 'Tournaments') {
            return <MaterialCommunityIcons name="soccer" size={28} color={focused ? '#45AF31' : '#212121'} />;
          }
          if (route.name === 'Profile') {
            return <MaterialCommunityIcons name="account-outline" size={28} color={focused ? '#45AF31' : '#212121'} />;
          }
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="StadiumList">
        {(props) => <StadiumListScreen {...props} rootNavigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen name="Tournaments">
        {(props) => <TournamentsScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  /** Solid strip so MAIN_APP_SHELL from the Main route does not show through under the pill. */
  tabBarWrap: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: PILL_HEIGHT,
    width: '100%',
    maxWidth: PILL_MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});
