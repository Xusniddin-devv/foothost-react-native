# Mobile App — Replace Mock Data with Live API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded mock data in HomeScreen, TournamentsScreen, and ProfileScreen with live data from the backend API.

**Architecture:** Existing `apiRequest` client + `lobbiesApi`/`newsApi`/`usersApi` services are already wired. New data is fetched via `useEffect`/`useState` inside screens. User stats come from `AuthContext.user` (already populated by `GET /users/me`).

**Tech Stack:** React Native (Expo), TypeScript. Repo: `/Users/macstore.uz/Documents/GitHub/foothost-react-native`

---

### Task 1: Update User type and add lobbies/mine API call

**Files:**
- Modify: `src/types/api/index.ts`
- Modify: `src/services/api/lobbies.ts`

- [ ] **Step 1: Add stat fields to User interface**

In `src/types/api/index.ts`, update the `User` interface to add the 5 new stat fields:

```typescript
export interface User {
  id: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  isGuest: boolean;
  avatarUrl: string | null;
  expoPushToken: string | null;
  rating: number;
  tournamentCount: number;
  wins: number;
  streakWeeks: number;
  position: string | null;
  createdAt: string;
}
```

- [ ] **Step 2: Add `mine` call to lobbiesApi**

In `src/services/api/lobbies.ts`, add to the `lobbiesApi` object:

```typescript
mine: () => apiRequest<Lobby[]>({ method: 'GET', url: '/lobbies/mine' }),
```

- [ ] **Step 3: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-react-native
git add src/types/api/index.ts src/services/api/lobbies.ts
git commit -m "feat(api): add user stats fields and lobbies/mine endpoint"
```

---

### Task 2: Update HomeScreen — real user stats and news-based player cards

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Replace hardcoded rating level with computed value**

In `src/screens/HomeScreen.tsx`, add a helper above the component and update the `RatingBadge` usage.

Add this helper after the imports:

```typescript
function getRatingLevel(rating: number): number {
  return Math.min(10, Math.floor(rating / 300) + 1);
}

function getRatingProgress(rating: number): number {
  return (rating % 300) / 300;
}

function getRatingTier(rating: number): string {
  if (rating < 300) return 'Новичок';
  if (rating < 900) return 'Любитель';
  if (rating < 1800) return 'Полупрофи';
  if (rating < 3000) return 'Профи';
  return 'Легенда';
}
```

- [ ] **Step 2: Update HomeScreen component to use real stats**

Replace the `HomeScreen` component's state and render to use `user.rating`:

Replace the progress bar section (currently has hardcoded `w-[85%]`, `1000`, `2000` values and `level={10}`):

```tsx
const userRating = user?.rating ?? 0;
const level = getRatingLevel(userRating);
const progress = getRatingProgress(userRating);
const levelMin = Math.floor(userRating / 300) * 300;
const levelMax = levelMin + 300;
const progressPct = Math.round(progress * 100);
const tier = getRatingTier(userRating);
```

Replace the `<RatingBadge level={10} score={1000} maxScore={2000} />` with:

```tsx
<RatingBadge level={level} score={userRating} maxScore={levelMax} />
```

Replace the progress bar width class `w-[85%]` with a dynamic style:

```tsx
<View className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
```

Replace the hardcoded `1000` and `2000` labels:

```tsx
<Text className="text-[#5B5757] font-manrope-medium text-xs">{levelMin}</Text>
<Text className="text-[#5B5757] font-manrope-medium text-xs">{levelMax}</Text>
```

Replace the hardcoded `Полупрофи` text:

```tsx
<Text className="text-[#322D2D] font-manrope-medium text-[15px]">{tier}</Text>
```

- [ ] **Step 3: Replace mock player cards with real news items**

In `HomeScreen`, the horizontal scroll under "NEWS" currently maps over a hardcoded array of 4 players. Replace it with real news from `newsFeed`:

Replace this block:
```tsx
{[
  { id: 1, name: 'Qobiljonov qobil', avatar: 'https://...' },
  ...
].map((player) => (
```

With:
```tsx
{newsFeed.slice(0, 6).map((item) => (
  <View
    key={item.id}
    className="items-center border border-primary rounded-xl p-3"
    style={{ width: 140 }}
  >
    <View className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-[#ececec]">
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <View className="w-full h-full bg-[#d0d0d0]" />
      )}
    </View>
    <Text className="font-manrope-semibold text-[13px] text-text-primary text-center mb-2" numberOfLines={2}>
      {item.title}
    </Text>
    <TouchableOpacity className="border border-primary rounded-lg px-4 py-1">
      <Text className="text-primary font-manrope-medium text-xs">Читать</Text>
    </TouchableOpacity>
  </View>
))}
```

Also remove the unused `mockClans` constant at the top of the file.

- [ ] **Step 4: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-react-native
git add src/screens/HomeScreen.tsx
git commit -m "feat(home): replace mock stats and player cards with real user data and news"
```

---

### Task 3: Update TournamentsScreen — live lobbies

**Files:**
- Modify: `src/screens/TournamentsScreen.tsx`

- [ ] **Step 1: Rewrite TournamentsScreen to use real lobbies**

Replace the entire file contents with:

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Container, Header } from '../components/common';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
import type { Lobby, Field } from '../types/api';

type TournamentsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Tournaments'
>;

interface Props {
  navigation: TournamentsScreenNavigationProp;
}

function formatExpiry(iso: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export const TournamentsScreen: React.FC<Props> = ({ navigation }) => {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [fields, setFields] = useState<Record<string, Field>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await lobbiesApi.listOpen();
      setLobbies(data);
      const fieldIds = [...new Set(data.map((l) => l.fieldId))];
      const fetched = await Promise.all(fieldIds.map((id) => fieldsApi.get(id).catch(() => null)));
      const map: Record<string, Field> = {};
      fetched.forEach((f) => { if (f) map[f.id] = f; });
      setFields(map);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <View className="bg-white">
        <Header
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
              <MaterialCommunityIcons name="arrow-left" size={28} color="#212121" />
            </TouchableOpacity>
          }
          title="ТУРНИРЫ"
          right={
            <TouchableOpacity>
              <MaterialCommunityIcons name="dots-vertical" size={28} color="#212121" />
            </TouchableOpacity>
          }
        />
      </View>

      <ScrollView className="flex-1 bg-transparent" showsVerticalScrollIndicator={false}>
        <Container padding="sm">
          {loading ? (
            <ActivityIndicator size="large" color="#45AF31" className="mt-8" />
          ) : lobbies.length === 0 ? (
            <Text className="text-center text-[#5B5757] font-manrope-medium mt-8">
              Нет открытых лобби
            </Text>
          ) : (
            lobbies.map((lobby) => {
              const field = fields[lobby.fieldId];
              return (
                <TouchableOpacity
                  key={lobby.id}
                  className="bg-gray-100 rounded-xl px-4 py-3 mb-4 shadow-sm active:bg-gray-200"
                  activeOpacity={0.7}
                >
                  <Text className="text-lg font-manrope-bold text-text-primary mb-1">
                    {field?.name ?? 'Лобби'}
                  </Text>
                  <Text className="text-base text-[#150000] mb-0.5">
                    {lobby.teamCount}x{lobby.teamCount} — {lobby.durationHours}ч
                  </Text>
                  <Text className="text-base text-[#150000] mb-2">
                    Стоимость:{' '}
                    <Text className="font-manrope-bold">
                      {lobby.totalAmount.toLocaleString('ru-RU')}
                    </Text>{' '}
                    сум
                  </Text>
                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="map-marker" size={18} color="#45AF31" />
                      <Text className="text-xs text-text-primary ml-1 font-manrope-bold" numberOfLines={1}>
                        {field?.address ?? '—'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="account-group" size={18} color="#45AF31" />
                      <Text className="text-xs text-text-primary ml-1 font-manrope-bold">
                        {lobby.maxPlayers}
                      </Text>
                    </View>
                    <Text className="text-xs text-text-primary font-manrope-bold">
                      {formatExpiry(lobby.expiresAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};
```

- [ ] **Step 2: Verify TournamentsScreen compiles**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-react-native
npx tsc --noEmit
```

Expected: no errors related to `TournamentsScreen.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/screens/TournamentsScreen.tsx
git commit -m "feat(tournaments): replace mock data with live lobbies API"
```

---

### Task 4: Update ProfileScreen — real user stats and matches

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add state for real lobby data and wire to useEffect**

At the top of the `ProfileScreen` component (after `const { user } = useAuth();`), add:

```tsx
const [myLobbies, setMyLobbies] = useState<import('../types/api').Lobby[]>([]);
const [lobbyFields, setLobbyFields] = useState<Record<string, import('../types/api').Field>>({});

useEffect(() => {
  lobbiesApi.mine().then(async (data) => {
    setMyLobbies(data);
    const ids = [...new Set(data.map((l) => l.fieldId))];
    const fetched = await Promise.all(ids.map((id) => fieldsApi.get(id).catch(() => null)));
    const map: Record<string, import('../types/api').Field> = {};
    fetched.forEach((f) => { if (f) map[f.id] = f; });
    setLobbyFields(map);
  }).catch(() => {});
}, []);
```

Add imports at the top of the file:
```tsx
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
```

- [ ] **Step 2: Replace mock stats with real user data**

Replace the `<StatsCard stats={mockUser.stats} />` with:

```tsx
<StatsCard stats={{
  rating: String(user?.rating ?? 0),
  tournaments: String(user?.tournamentCount ?? 0),
  wins: String(user?.wins ?? 0),
  matchesPlayed: String(myLobbies.length),
  streakWeeks: String(user?.streakWeeks ?? 0),
  mode: 'Активный режим',
  position: user?.position ?? '—',
}} />
```

Replace the hardcoded user name in the green header and `Полупрофи` tier:

The `displayName` is already derived from `user?.firstName` + `user?.lastName` in most screens. Ensure the profile header uses:

```tsx
const displayName = user
  ? `${user.firstName} ${user.lastName}`.trim().toUpperCase()
  : 'ИГРОК';

const tier = (() => {
  const r = user?.rating ?? 0;
  if (r < 300) return 'Новичок';
  if (r < 900) return 'Любитель';
  if (r < 1800) return 'Полупрофи';
  if (r < 3000) return 'Профи';
  return 'Легенда';
})();
```

Replace the hardcoded `Полупрофи` text in the profile with `{tier}`.

- [ ] **Step 3: Replace mock upcoming/past matches with real lobbies**

Find the `activeTab === 'upcoming'` section and replace `mockUpcomingMatches.map(...)` with:

```tsx
{myLobbies
  .filter((l) => ['active', 'full', 'paid', 'booked'].includes(l.status))
  .map((lobby) => {
    const field = lobbyFields[lobby.fieldId];
    return (
      <View key={lobby.id} className="mb-4 rounded-xl overflow-hidden bg-gray-100 px-4 py-3">
        <View className="flex-row items-center mb-1">
          <MaterialCommunityIcons name="map-marker" size={14} color="#45AF31" />
          <Text className="text-xs text-text-primary ml-1 font-manrope-medium" numberOfLines={1}>
            {field?.address ?? '—'}
          </Text>
        </View>
        <Text className="font-manrope-bold text-sm text-text-primary mb-1">
          {field?.name ?? 'Лобби'}
        </Text>
        <Text className="text-xs text-[#5B5757]">
          До: {lobby.expiresAt ? new Date(lobby.expiresAt).toLocaleDateString('ru-RU') : '—'}
        </Text>
        <View className="flex-row items-center mt-2">
          <MaterialCommunityIcons name="account-group" size={14} color="#45AF31" />
          <Text className="text-xs font-manrope-bold ml-1 text-text-primary">
            {lobby.maxPlayers} игроков
          </Text>
          <Text className="text-xs text-[#5B5757] ml-3">
            {(lobby.totalAmount).toLocaleString('ru-RU')} сум
          </Text>
        </View>
      </View>
    );
  })}
{myLobbies.filter((l) => ['active', 'full', 'paid', 'booked'].includes(l.status)).length === 0 && (
  <Text className="text-center text-[#5B5757] font-manrope-medium mt-4">
    Нет предстоящих матчей
  </Text>
)}
```

Replace `mockPastMatches.map(...)` similarly in the `activeTab === 'history'` section:

```tsx
{myLobbies
  .filter((l) => l.status === 'completed' || l.status === 'cancelled')
  .map((lobby) => {
    const field = lobbyFields[lobby.fieldId];
    return (
      <View key={lobby.id} className="mb-4 rounded-xl overflow-hidden bg-gray-100 px-4 py-3">
        <View className="flex-row items-center mb-1">
          <MaterialCommunityIcons name="map-marker" size={14} color="#45AF31" />
          <Text className="text-xs text-text-primary ml-1 font-manrope-medium" numberOfLines={1}>
            {field?.address ?? '—'}
          </Text>
        </View>
        <Text className="font-manrope-bold text-sm text-text-primary mb-1">
          {field?.name ?? 'Лобби'}
        </Text>
        <Text className="text-xs text-[#5B5757]">
          Статус: {lobby.status === 'completed' ? 'Завершён' : 'Отменён'}
        </Text>
        <View className="flex-row items-center mt-2">
          <MaterialCommunityIcons name="account-group" size={14} color="#45AF31" />
          <Text className="text-xs font-manrope-bold ml-1 text-text-primary">
            {lobby.maxPlayers} игроков
          </Text>
        </View>
      </View>
    );
  })}
{myLobbies.filter((l) => ['completed', 'cancelled'].includes(l.status)).length === 0 && (
  <Text className="text-center text-[#5B5757] font-manrope-medium mt-4">
    Нет истории матчей
  </Text>
)}
```

- [ ] **Step 4: Fix StatsCard to use an explicit interface (before removing mockUser)**

`StatsCard` currently types its `stats` prop as `typeof mockUser.stats`, which will break once `mockUser` is deleted. Replace that inferred type with an explicit interface.

In `ProfileScreen.tsx`, find the `StatsCard` component definition (around line 120) and replace:

```tsx
const StatsCard = ({ stats }: { stats: typeof mockUser.stats }) => (
```

With:

```tsx
interface PlayerStats {
  rating: string;
  tournaments: string;
  wins: string;
  matchesPlayed: string;
  streakWeeks: string;
  mode: string;
  position: string;
}

const StatsCard = ({ stats }: { stats: PlayerStats }) => (
```

- [ ] **Step 5: Remove unused mock constants**

Delete these unused constants from the top of `ProfileScreen.tsx`:
- `mockUser`
- `mockUpcomingMatches`
- `mockPastMatches`
- `mockTeams`
- `mockRecommendedLobbies`

- [ ] **Step 6: Verify no TypeScript errors**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-react-native
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "feat(profile): replace mock data with real user stats and lobby history"
```
