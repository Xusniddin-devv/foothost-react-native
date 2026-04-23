# Profile Lobby Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Profile lobby detail bottom-sheet with navigation to BookingStep2, add per-player payment status dots to BookingStep2, and add an "Enter Lobby" button to Profile.

**Architecture:** Three files change. `navigation.ts` adds `fromProfile` param. `BookingStep2Screen` gains payment status fetching and hides its bottom bar when `fromProfile=true`. `ProfileScreen` removes its lobby-detail modal and all related code, adds card navigation + an enter-lobby modal.

**Tech Stack:** React Native, Expo, NativeWind, `@expo/vector-icons`, existing `lobbiesApi` / `paymentsApi` / `usersApi`

---

### Task 1: Add `fromProfile` to navigation types + hide bottom bar in BookingStep2

**Files:**
- Modify: `src/types/navigation.ts`
- Modify: `src/screens/BookingStep2Screen.tsx`

- [ ] **Step 1: Update BookingStep2 route params in navigation.ts**

In `src/types/navigation.ts`, replace:
```ts
BookingStep2: { lobbyId?: string; fieldId?: string } | undefined;
```
with:
```ts
BookingStep2: { lobbyId?: string; fieldId?: string; fromProfile?: boolean } | undefined;
```

- [ ] **Step 2: Read `fromProfile` in BookingStep2Screen and conditionally render bottom bar**

In `src/screens/BookingStep2Screen.tsx`, after the line:
```ts
const fieldId = route?.params?.fieldId;
```
insert:
```ts
const fromProfile = route?.params?.fromProfile === true;
```

Then find the sticky bottom actions block (currently renders unconditionally):
```tsx
{/* Sticky bottom actions */}
<View className="absolute bottom-0 left-0 right-0 bg-[#F5F5F5] px-4 pt-2 pb-6" style={{ gap: 8 }}>
```

Wrap the entire block (from the opening `<View className="absolute bottom-0 ...">` to its closing `</View>`) in a conditional:
```tsx
{!fromProfile && (
  <View className="absolute bottom-0 left-0 right-0 bg-[#F5F5F5] px-4 pt-2 pb-6" style={{ gap: 8 }}>
    {/* Secondary row */}
    <View className="flex-row" style={{ gap: 8 }}>
      <TouchableOpacity
        onPress={handlePublish}
        className="flex-1 bg-primary flex-row items-center justify-center rounded-xl py-3"
        style={{ gap: 6 }}
      >
        <MaterialCommunityIcons name="soccer" size={18} color="white" />
        <Text className="text-white font-manrope-bold text-sm">Опубликовать лобби</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleShare}
        className="flex-1 border border-primary flex-row items-center justify-center rounded-xl py-3"
        style={{ gap: 6 }}
      >
        <MaterialCommunityIcons name="export-variant" size={18} color="#45AF31" />
        <Text className="text-primary font-manrope-bold text-sm">Поделиться</Text>
      </TouchableOpacity>
    </View>

    {/* Primary book button */}
    <TouchableOpacity
      onPress={handleBook}
      className="bg-primary rounded-xl py-4 items-center"
    >
      <Text className="text-white font-manrope-bold text-base">Забронировать</Text>
    </TouchableOpacity>
  </View>
)}
```

Also, when `fromProfile=true` the ScrollView should not reserve bottom padding for the (now hidden) sticky bar. Find:
```tsx
<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
```
Replace with:
```tsx
<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: fromProfile ? 24 : 120 }}>
```

- [ ] **Step 3: Commit**

```bash
git add src/types/navigation.ts src/screens/BookingStep2Screen.tsx
git commit -m "feat(booking-step2): add fromProfile param, hide bottom bar when true"
```

---

### Task 2: Per-player payment status in BookingStep2

**Files:**
- Modify: `src/screens/BookingStep2Screen.tsx`

- [ ] **Step 1: Import paymentsApi and Payment type**

In `src/screens/BookingStep2Screen.tsx`, add to the existing imports:
```ts
import { paymentsApi } from '../services/api/payments';
import type { Field, Lobby, LobbyPlayer, Team as ApiTeam, User, Payment, PaymentStatus } from '../types/api';
```
(Replace the existing `type { Field, Lobby, LobbyPlayer, Team as ApiTeam, User }` import — just add `Payment, PaymentStatus` to it.)

- [ ] **Step 2: Add `payments` state and fetch it in the load effect**

After the existing state declarations (after `const [shareCopied, setShareCopied] = useState(false);`), add:
```ts
const [payments, setPayments] = useState<Payment[]>([]);
```

Inside the load `useEffect`, the current `Promise.all` fetches `[lobbiesApi.get, lobbiesApi.players]`. Extend it to also fetch payments in parallel. Find:
```ts
const [l, p] = await Promise.all([
  lobbiesApi.get(lobbyId),
  lobbiesApi.players(lobbyId).catch(() => [] as LobbyPlayer[]),
]);
if (cancelled) return;
setLobby(l);
setPlayers(p);
```

Replace with:
```ts
const [l, p, paymentData] = await Promise.all([
  lobbiesApi.get(lobbyId),
  lobbiesApi.players(lobbyId).catch(() => [] as LobbyPlayer[]),
  paymentsApi.status(lobbyId).catch(() => ({ payments: [] as Payment[] })),
]);
if (cancelled) return;
setLobby(l);
setPlayers(p);
setPayments(paymentData.payments);
```

- [ ] **Step 3: Build `paymentMap` useMemo**

After the existing `approvedPlayers` useMemo, add:
```ts
const paymentMap = useMemo<Record<string, PaymentStatus>>(() => {
  const map: Record<string, PaymentStatus> = {};
  for (const p of payments) map[p.userId] = p.status;
  return map;
}, [payments]);
```

- [ ] **Step 4: Update `PlayerSlot` to accept and render payment status dot**

Replace the entire `PlayerSlot` component definition with:
```tsx
const PlayerSlot = ({
  player,
  onPress,
  paymentStatus,
}: {
  player: LobbyPlayer | null;
  onPress: () => void;
  paymentStatus?: PaymentStatus;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="items-center justify-center rounded-full border-2 border-primary bg-white"
    style={{ width: 52, height: 52 }}
  >
    {player ? (
      <>
        <Text className="text-primary font-manrope-bold text-xs" numberOfLines={1}>
          {player.user?.firstName?.trim() || 'Игрок'}
        </Text>
        {paymentStatus != null && (
          <View
            style={{
              position: 'absolute',
              top: 1,
              right: 1,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor:
                paymentStatus === 'paid'
                  ? '#45AF31'
                  : paymentStatus === 'pending'
                  ? '#F59E0B'
                  : '#EF4444',
              borderWidth: 1.5,
              borderColor: 'white',
            }}
          />
        )}
      </>
    ) : (
      <Text className="text-primary text-2xl font-manrope-light" style={{ lineHeight: 28 }}>+</Text>
    )}
  </TouchableOpacity>
);
```

- [ ] **Step 5: Update `TeamCard` to accept and pass `paymentMap`**

Replace the entire `TeamCard` component definition with:
```tsx
const TeamCard = ({
  team,
  onAddPlayer,
  onShuffle,
  paymentMap,
}: {
  team: DisplayTeam;
  onAddPlayer: (teamId: string, slotIndex: number) => void;
  onShuffle: (teamId: string) => void;
  paymentMap: Record<string, PaymentStatus>;
}) => (
  <View
    className="bg-white rounded-2xl px-4 py-3 mb-3"
    style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } }}
  >
    <View className="flex-row items-center justify-between mb-3">
      <Text className="font-manrope-semibold text-sm text-text-primary">{team.name}</Text>
      <TouchableOpacity onPress={() => onShuffle(team.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MaterialCommunityIcons name="shuffle-variant" size={22} color="#45AF31" />
      </TouchableOpacity>
    </View>
    <View className="flex-row justify-between">
      {team.players.map((player, idx) => (
        <PlayerSlot
          key={idx}
          player={player}
          onPress={() => onAddPlayer(team.id, idx)}
          paymentStatus={player?.userId ? paymentMap[player.userId] : undefined}
        />
      ))}
    </View>
  </View>
);
```

- [ ] **Step 6: Pass `paymentMap` to TeamCard render site**

Find the TeamCard usage in the JSX (inside the teams section):
```tsx
{teams.map((team) => (
  <TeamCard
    key={team.id}
    team={team}
    onAddPlayer={handleAddPlayer}
    onShuffle={handleShuffle}
  />
))}
```

Replace with:
```tsx
{teams.map((team) => (
  <TeamCard
    key={team.id}
    team={team}
    onAddPlayer={handleAddPlayer}
    onShuffle={handleShuffle}
    paymentMap={paymentMap}
  />
))}
```

- [ ] **Step 7: Commit**

```bash
git add src/screens/BookingStep2Screen.tsx
git commit -m "feat(booking-step2): show per-player payment status dot on player slots"
```

---

### Task 3: ProfileScreen — remove modal, navigate to BookingStep2 on card tap

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Remove unused imports**

In `src/screens/ProfileScreen.tsx`, replace the import block at the top of the file with the cleaned-up version below. The key removals are: `useCallback`, `useMemo`, `Linking`, all 9 booking SVG imports, `Team`, `LobbyPlayer`, `LobbyType`, `User` from types (they were only needed by the modal).

```tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import type { Lobby, Field } from '../types/api';
import { Header } from '../components/common';
import LogoWhite from '../../assets/images/logo_white.svg';
import CameraSvg from '../../assets/images/profile/camera.svg';
import { useAuth } from '../contexts/AuthContext';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
import { getApiErrorMessage } from '../services/api/client';
```

- [ ] **Step 2: Remove InfoCard, AmenityItem, extractLatLng helpers**

Delete the entire `// ── Stadium detail helpers ─────────` section that was added in a previous commit. It spans from the `// ── Stadium detail helpers` comment through the closing `}` of `extractLatLng`. These are no longer used once the modal is removed.

- [ ] **Step 3: Remove modal-related state inside the component**

Inside `ProfileScreen`, remove these state declarations:
```tsx
const [selectedLobby, setSelectedLobby] = useState<Lobby | null>(null);
const [selectedLobbyTeams, setSelectedLobbyTeams] = useState<Team[]>([]);
const [detailsLoading, setDetailsLoading] = useState(false);
const [selectedLobbyPlayers, setSelectedLobbyPlayers] = useState<LobbyPlayer[]>([]);
const [friends, setFriends] = useState<User[]>([]);
const [friendQuery, setFriendQuery] = useState('');
const [inviteModal, setInviteModal] = useState(false);
const [friendsLoading, setFriendsLoading] = useState(false);
```

- [ ] **Step 4: Remove derived values and their useEffect / handlers**

Remove all of the following from inside the component:

1. The `selectedField` and `isCreator` derived constants:
```tsx
const selectedField = selectedLobby ? lobbyFields[selectedLobby.fieldId] : null;
const isCreator = !!(selectedLobby && user?.id === selectedLobby.creatorId);
```

2. The `mapPreviewUrl` useMemo and `openMap` useCallback blocks.

3. The friends-loading `useEffect` (depends on `inviteModal`, `friendQuery`, `selectedLobby`).

4. All five handler functions: `openLobbyDetails`, `closeLobbyDetails`, `refreshLobbyDetails`, `handleInviteFriend`, `handleKickPlayer`, `handleChangeType`.

- [ ] **Step 5: Change lobby card `onPress` to navigate to BookingStep2**

There are two lobby card lists: upcoming (status filter `active/full/paid/booked`) and history (status `completed/cancelled`). In both, the card currently calls `void openLobbyDetails(lobby)`.

Replace both `onPress` handlers with:
```tsx
onPress={() => navigation.navigate('BookingStep2', { lobbyId: lobby.id, fieldId: lobby.fieldId, fromProfile: true })}
```

- [ ] **Step 6: Remove both modals from JSX**

Remove the entire lobby detail `<Modal visible={!!selectedLobby} ...>...</Modal>` block and the entire invite friends `<Modal visible={inviteModal} ...>...</Modal>` block from the JSX return. Both modals are replaced by the BookingStep2 screen.

- [ ] **Step 7: Remove `usersApi` import (no longer needed)**

Remove:
```tsx
import { usersApi } from '../services/api/users';
```

- [ ] **Step 8: Verify the file compiles cleanly**

Run TypeScript check:
```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors in `ProfileScreen.tsx` or `navigation.ts`.

- [ ] **Step 9: Commit**

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "feat(profile): replace lobby detail modal with navigation to BookingStep2"
```

---

### Task 4: "Enter Lobby" button and modal on ProfileScreen

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add enter-lobby state**

Inside `ProfileScreen`, after the existing `const [showDropdown, setShowDropdown] = useState(false);` line, add:
```tsx
const [enterLobbyModal, setEnterLobbyModal] = useState(false);
const [lobbyCode, setLobbyCode] = useState('');
const [joiningLobby, setJoiningLobby] = useState(false);
```

- [ ] **Step 2: Add `handleEnterLobby` handler**

After `handleLogOut`, insert:
```tsx
const handleEnterLobby = async () => {
  const code = lobbyCode.trim();
  if (!code) return;
  setJoiningLobby(true);
  try {
    const joined = await lobbiesApi.join(code);
    setEnterLobbyModal(false);
    setLobbyCode('');
    navigation.navigate('BookingStep2', { lobbyId: joined.id, fieldId: joined.fieldId });
  } catch (err) {
    Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось войти в лобби'));
  } finally {
    setJoiningLobby(false);
  }
};
```

- [ ] **Step 3: Add "Войти в лобби" button to the header**

The header currently has `left` (logo) and `right` (edit icon + dropdown). Add the enter-lobby icon button alongside the edit icon. Find the right section:

```tsx
right={
  <View className="relative">
    <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
      <MaterialCommunityIcons name="square-edit-outline" size={26} color="#fff" style={{ marginTop: 16 }} />
    </TouchableOpacity>
    ...
  </View>
}
```

Replace the `right` prop with:
```tsx
right={
  <View className="relative flex-row items-center" style={{ gap: 12 }}>
    <TouchableOpacity onPress={() => setEnterLobbyModal(true)}>
      <MaterialCommunityIcons name="login" size={26} color="#fff" style={{ marginTop: 16 }} />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
      <MaterialCommunityIcons name="square-edit-outline" size={26} color="#fff" style={{ marginTop: 16 }} />
    </TouchableOpacity>
    {showDropdown && (
      <View className="absolute top-10 -right-5 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-44">
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-100"
          onPress={handlePersonalDetails}
        >
          <MaterialCommunityIcons name="account" size={20} color="#666" />
          <Text className="ml-3 text-text-primary font-manrope-medium">Личные данные</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-100"
          onPress={handleAboutUs}
        >
          <MaterialCommunityIcons name="information-outline" size={20} color="#666" />
          <Text className="ml-3 text-text-primary font-manrope-medium">О НАС</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3"
          onPress={handleLogOut}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text className="ml-3 text-red-500 font-manrope-medium">Выйти</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
}
```

- [ ] **Step 4: Add the enter-lobby Modal to JSX**

After the closing `</SafeAreaView>` tag (or just before it, as the last child), add the modal. The best placement is just before `</SafeAreaView>`:

```tsx
<Modal visible={enterLobbyModal} transparent animationType="slide" onRequestClose={() => { setEnterLobbyModal(false); setLobbyCode(''); }}>
  <View className="flex-1 justify-end bg-black/40">
    <View className="rounded-t-3xl bg-white px-4 pb-8 pt-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="font-artico-bold text-[20px] text-text-primary">Войти в лобби</Text>
        <TouchableOpacity onPress={() => { setEnterLobbyModal(false); setLobbyCode(''); }}>
          <MaterialCommunityIcons name="close" size={24} color="#212121" />
        </TouchableOpacity>
      </View>
      <TextInput
        value={lobbyCode}
        onChangeText={setLobbyCode}
        placeholder="Введите ID лобби"
        autoCapitalize="none"
        autoCorrect={false}
        className="mb-4 rounded-xl border border-gray-200 px-4 py-3 font-manrope-medium text-text-primary"
        placeholderTextColor="#9CA3AF"
      />
      <TouchableOpacity
        onPress={() => void handleEnterLobby()}
        disabled={joiningLobby || !lobbyCode.trim()}
        className={`rounded-xl py-4 items-center ${joiningLobby || !lobbyCode.trim() ? 'bg-gray-300' : 'bg-primary'}`}
      >
        {joiningLobby ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="font-manrope-bold text-base text-white">Войти</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "feat(profile): add enter-lobby button and join-by-id modal"
```
