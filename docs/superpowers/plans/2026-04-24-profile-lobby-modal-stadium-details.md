# Profile Lobby Modal — Full Stadium Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the lobby detail bottom-sheet in `ProfileScreen` so it shows the same rich stadium info (specs, amenities, map) as `BookingStep1Screen`, while preserving existing creator management (invite / kick / change type).

**Architecture:** All changes are contained in `src/screens/ProfileScreen.tsx`. Inline the same `InfoCard`, `AmenityItem`, and `extractLatLng` helpers that live in `BookingStep1Screen` — no new shared files. The modal inner content becomes a `ScrollView` so the taller content is usable on small screens.

**Tech Stack:** React Native, Expo, NativeWind (Tailwind), `@expo/vector-icons`, inline SVGs from `assets/images/booking/`

---

### Task 1: Add imports and inline helpers

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add `Linking` to the RN import block and add SVG imports**

Find the existing import block at the top of `src/screens/ProfileScreen.tsx` and replace it so it reads:

```tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import type { Lobby, Field, Team, LobbyPlayer, LobbyType, User } from '../types/api';
import { Header, Container } from '../components/common';
import LogoWhite from '../../assets/images/logo_white.svg';
import CameraSvg from '../../assets/images/profile/camera.svg';
import ParkingSvg from '../../assets/images/booking/parking.svg';
import ShowerSvg from '../../assets/images/booking/shower.svg';
import OutfitChangeSvg from '../../assets/images/booking/outfitChange.svg';
import SeatsSvg from '../../assets/images/booking/seats.svg';
import LightedSvg from '../../assets/images/booking/lighted.svg';
import TimeOfWorkSvg from '../../assets/images/booking/timeofWork.svg';
import LengthOfFieldSvg from '../../assets/images/booking/lengthofField.svg';
import TypeOfFieldSvg from '../../assets/images/booking/typeofField.svg';
import TypeOfPitchSvg from '../../assets/images/booking/typeofPitch.svg';
import { useAuth } from '../contexts/AuthContext';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
import { usersApi } from '../services/api/users';
import { getApiErrorMessage } from '../services/api/client';
```

- [ ] **Step 2: Add `InfoCard`, `AmenityItem`, and `extractLatLng` helpers after the existing `StatRow` component (around line 91)**

Insert the following block immediately after the closing of `StatRow`:

```tsx
// ── Stadium detail helpers ─────────────────────────────────────────────────────
const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View className="bg-gray-100 rounded-lg p-3 flex-1 flex-row items-center h-full">
    {icon}
    <View className="ml-2">
      <Text className="font-manrope-bold text-xs">{label}</Text>
      <Text className="font-manrope-medium text-[10px] mt-1">{value}</Text>
    </View>
  </View>
);

const AmenityItem = ({ icon, label, available }: { icon: React.ReactNode; label: string; available: boolean }) => (
  <View className="flex-row items-center">
    {icon}
    <View className="ml-2">
      <Text className="font-manrope-bold text-xs">{label}</Text>
      <Text className={`font-manrope-medium text-xs ${available ? 'text-green-600' : 'text-red-600'}`}>
        {available ? 'Есть' : 'Нет'}
      </Text>
    </View>
  </View>
);

function extractLatLng(mapUrl: string): { lat: number; lng: number } | null {
  const decoded = decodeURIComponent(mapUrl);
  const llMatch = decoded.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (llMatch) return { lng: Number(llMatch[1]), lat: Number(llMatch[2]) };
  const googleMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (googleMatch) return { lat: Number(googleMatch[1]), lng: Number(googleMatch[2]) };
  const queryMatch = decoded.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) return { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) };
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "feat(profile): add stadium detail imports and helpers"
```

---

### Task 2: Add `mapPreviewUrl` and `openMap` inside the component

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add the two derived values inside `ProfileScreen` after the existing `isCreator` line**

The existing line (around line 194) reads:
```tsx
const isCreator = !!(selectedLobby && user?.id === selectedLobby.creatorId);
```

Insert immediately after it:

```tsx
const mapPreviewUrl = useMemo(() => {
  if (!selectedField?.mapUrl) return null;
  const coords = extractLatLng(selectedField.mapUrl);
  if (!coords) return null;
  return `https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=${coords.lng},${coords.lat}&size=650,300&z=15&l=map&pt=${coords.lng},${coords.lat},pm2rdm`;
}, [selectedField?.mapUrl]);

const openMap = useCallback(async () => {
  if (!selectedField?.mapUrl) return;
  const supported = await Linking.canOpenURL(selectedField.mapUrl);
  if (!supported) {
    Alert.alert('Ошибка', 'Не удалось открыть ссылку карты');
    return;
  }
  await Linking.openURL(selectedField.mapUrl);
}, [selectedField?.mapUrl]);
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "feat(profile): add mapPreviewUrl and openMap for lobby detail modal"
```

---

### Task 3: Enrich the lobby detail modal

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Make the modal inner container scrollable**

Find the modal's inner `<View>` that currently reads:
```tsx
<View className="rounded-t-3xl bg-white px-4 pb-8 pt-4">
```

Replace it with a wrapper + ScrollView structure so the header stays fixed and the content scrolls:
```tsx
<View className="rounded-t-3xl bg-white px-4 pt-4" style={{ maxHeight: '90%' }}>
```

Then find the closing `</View>` of that same block (just before `</View>` that closes `justify-end`) and change it so the structure becomes:

```tsx
<View className="rounded-t-3xl bg-white px-4 pt-4" style={{ maxHeight: '90%' }}>
  {/* Fixed header */}
  <View className="mb-3 flex-row items-center justify-between">
    <Text className="font-artico-bold text-[20px] text-text-primary">Детали лобби</Text>
    <TouchableOpacity onPress={closeLobbyDetails}>
      <MaterialCommunityIcons name="close" size={24} color="#212121" />
    </TouchableOpacity>
  </View>

  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
    {selectedLobby ? (
      <>
        {/* ... enriched content goes here (Step 2) ... */}
      </>
    ) : null}
  </ScrollView>
</View>
```

Remove the old header block that was inside the modal (it's now above the ScrollView).

- [ ] **Step 2: Replace the stadium section inside the ScrollView**

The current stadium section (photo → name → address → type text) reads:
```tsx
<Image
  source={...}
  style={{ width: '100%', height: 140, borderRadius: 12 }}
  resizeMode="cover"
/>
<Text className="font-manrope-bold text-base text-text-primary">
  {selectedField?.name ?? 'Лобби'}
</Text>
<Text className="mt-1 font-manrope-medium text-xs text-gray-500">
  {selectedField?.address ?? '—'}
</Text>
<Text className="mt-1 font-manrope-medium text-xs text-gray-500">
  Тип: {selectedLobby.type === 'open' ? 'Открытое' : selectedLobby.type === 'invite_only' ? 'По приглашению' : 'Закрытое'}
</Text>
```

Replace it with:
```tsx
{/* Hero image */}
<Image
  source={
    selectedField?.photos?.[0]
      ? { uri: selectedField.photos[0] }
      : require('../../assets/images/stadium/stadium.png')
  }
  style={{ width: '100%', height: 140, borderRadius: 12 }}
  resizeMode="cover"
/>

{/* Name + rating */}
<View className="flex-row items-center mt-3">
  <Text className="font-artico-medium text-2xl text-text-primary flex-shrink">{selectedField?.name ?? 'Лобби'}</Text>
  {selectedField?.rating != null && (
    <View className="bg-primary rounded-md px-2 py-1 ml-2 flex-row items-center">
      <Text className="text-white font-bold text-sm mr-1">{Number(selectedField.rating).toFixed(1)}</Text>
      <MaterialCommunityIcons name="star" size={14} color="white" />
    </View>
  )}
</View>

{/* Address */}
<View className="flex-row items-center mt-1">
  <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
  <Text className="text-gray-500 font-manrope-medium text-xs ml-1">{selectedField?.address ?? '—'}</Text>
</View>

{/* Price + reviews */}
<View className="flex-row items-center justify-between mt-1">
  <Text className="font-artico-medium text-xl text-text-primary">
    {selectedField?.pricePerHour != null ? `${Number(selectedField.pricePerHour).toLocaleString('ru-RU')} СУМ` : '—'}
  </Text>
  <Text className="font-manrope-medium text-xs text-gray-500">
    {selectedField?.reviewsCount != null ? `${selectedField.reviewsCount} отзывов` : ''}
  </Text>
</View>

{/* Lobby type pill */}
<Text className="mt-1 font-manrope-medium text-xs text-gray-500">
  Тип: {selectedLobby.type === 'open' ? 'Открытое' : selectedLobby.type === 'invite_only' ? 'По приглашению' : 'Закрытое'}
</Text>

{/* Field specs */}
<View className="mt-4 mb-2">
  <View className="flex-row mb-2">
    <InfoCard icon={<TypeOfPitchSvg width={36} height={36} />} label="Покрытие" value={selectedField?.description ?? '—'} />
    <View className="w-2" />
    <InfoCard icon={<TypeOfFieldSvg width={36} height={36} />} label="Тип площадки" value={selectedField?.pitchType ?? '—'} />
  </View>
  <View className="flex-row">
    <InfoCard icon={<LengthOfFieldSvg width={36} height={36} />} label="Длина х Ширина (м)" value={selectedField?.dimensions ?? '—'} />
    <View className="w-2" />
    <InfoCard icon={<TimeOfWorkSvg width={36} height={36} />} label="Время работы" value={selectedField?.workTime ?? '—'} />
  </View>
</View>

{/* Amenities */}
{(() => {
  const amenities = (selectedField?.amenities ?? {}) as Record<string, boolean>;
  return (
    <View className="mt-4 mb-2">
      <Text className="font-artico-medium text-base mb-3">УДОБСТВО:</Text>
      <View className="flex-row justify-between">
        <View style={{ gap: 12 }}>
          <AmenityItem icon={<ParkingSvg width={28} height={28} />} label="Парковка" available={amenities.parking ?? false} />
          <AmenityItem icon={<ShowerSvg width={28} height={28} />} label="Душ" available={amenities.shower ?? false} />
        </View>
        <View style={{ gap: 12 }}>
          <AmenityItem icon={<OutfitChangeSvg width={28} height={28} />} label="Раздевалки" available={amenities.locker ?? false} />
          <AmenityItem icon={<SeatsSvg width={28} height={28} />} label="Трибуны" available={amenities.tribune ?? false} />
        </View>
        <View style={{ gap: 12 }}>
          <AmenityItem icon={<LightedSvg width={28} height={28} />} label="Освещение" available={amenities.lighting ?? false} />
        </View>
      </View>
    </View>
  );
})()}

{/* Map */}
<View className="mt-4 mb-4">
  <Text className="font-artico-medium text-base mb-3">МЕСТОПОЛОЖЕНИЕ:</Text>
  {mapPreviewUrl ? (
    <TouchableOpacity onPress={openMap} activeOpacity={0.85}>
      <Image source={{ uri: mapPreviewUrl }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
    </TouchableOpacity>
  ) : selectedField?.mapUrl ? (
    <TouchableOpacity
      onPress={openMap}
      activeOpacity={0.85}
      className="w-full rounded-xl border border-gray-200 bg-gray-50 items-center justify-center px-4"
      style={{ height: 160 }}
    >
      <MaterialCommunityIcons name="map-marker" size={28} color="#45AF31" />
      <Text className="font-manrope-semibold text-sm text-text-primary mt-2 text-center">
        Открыть в Яндекс/Google Maps
      </Text>
    </TouchableOpacity>
  ) : (
    <Image source={require('../../assets/images/map-placeholder.png')} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
  )}
</View>
```

- [ ] **Step 3: Keep existing lobby info boxes and creator management intact**

After the map section, the following blocks remain unchanged inside the ScrollView (they were already there, just ensure they follow the new stadium section):

```tsx
{/* Players / payment */}
<View className="mt-4 rounded-xl border border-gray-200 p-3">
  <Text className="font-manrope-semibold text-sm text-text-primary">
    Игроки: {lobbyJoinedCount[selectedLobby.id] ?? 0}/{selectedLobby.maxPlayers}
  </Text>
  <Text className="mt-1 font-manrope-semibold text-sm text-text-primary">
    Оплачено: {Number(selectedLobby.confirmedTotal ?? 0).toLocaleString('ru-RU')} / {Number(selectedLobby.totalAmount ?? 0).toLocaleString('ru-RU')} сум
  </Text>
</View>

{/* Teams */}
<View className="mt-4 rounded-xl border border-gray-200 p-3">
  <Text className="mb-2 font-manrope-semibold text-sm text-text-primary">Названия команд</Text>
  {detailsLoading ? (
    <Text className="font-manrope-medium text-xs text-gray-500">Загрузка...</Text>
  ) : selectedLobbyTeams.length > 0 ? (
    selectedLobbyTeams.map((team) => (
      <Text key={team.id} className="mb-1 font-manrope-medium text-sm text-text-primary">
        • {team.name}
      </Text>
    ))
  ) : (
    <Text className="font-manrope-medium text-xs text-gray-500">Команды еще не назначены</Text>
  )}
</View>

{/* Players list */}
<View className="mt-4 rounded-xl border border-gray-200 p-3">
  <Text className="mb-2 font-manrope-semibold text-sm text-text-primary">Игроки лобби</Text>
  {selectedLobbyPlayers.length > 0 ? (
    selectedLobbyPlayers
      .filter((p) => p.status === 'approved')
      .map((player) => (
        <View key={player.userId} className="mb-2 flex-row items-center justify-between">
          <Text className="font-manrope-medium text-sm text-text-primary">
            {player.user?.firstName ?? 'Игрок'} {player.user?.lastName ?? ''}
          </Text>
          {isCreator && player.userId !== user?.id ? (
            <TouchableOpacity onPress={() => handleKickPlayer(player.userId)} className="rounded-lg border border-red-300 px-2 py-1">
              <Text className="font-manrope-semibold text-xs text-red-500">Удалить</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))
  ) : (
    <Text className="font-manrope-medium text-xs text-gray-500">Игроков нет</Text>
  )}
</View>

{/* Creator management */}
{isCreator ? (
  <View className="mt-4">
    <Text className="mb-2 font-manrope-semibold text-sm text-text-primary">Управление лобби</Text>
    <View className="mb-2 flex-row" style={{ gap: 8 }}>
      {([
        { key: 'open', label: 'Открытое' },
        { key: 'invite_only', label: 'По приглашению' },
        { key: 'closed', label: 'Закрытое' },
      ] as Array<{ key: LobbyType; label: string }>).map((option) => (
        <TouchableOpacity
          key={option.key}
          onPress={() => void handleChangeType(option.key)}
          className={`rounded-lg px-3 py-2 ${selectedLobby.type === option.key ? 'bg-primary' : 'border border-gray-300'}`}
        >
          <Text className={`text-xs font-manrope-semibold ${selectedLobby.type === option.key ? 'text-white' : 'text-text-primary'}`}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    <TouchableOpacity onPress={() => { setFriendQuery(''); setInviteModal(true); }} className="rounded-xl bg-primary py-3">
      <Text className="text-center font-manrope-bold text-sm text-white">Пригласить игрока</Text>
    </TouchableOpacity>
  </View>
) : null}
```

- [ ] **Step 4: Verify the app compiles — run the dev server**

```bash
npx expo start --clear
```

Expected: No TypeScript/Metro errors. Open the app, navigate to Profile, tap a lobby card. The bottom sheet should show: hero image → name + rating badge → address → price/reviews → spec cards → amenities → map → player counts → teams → player list → (creator controls if applicable).

- [ ] **Step 5: Commit**

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "feat(profile): show full stadium details in lobby detail modal"
```
