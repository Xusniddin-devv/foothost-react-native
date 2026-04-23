# Profile Lobby Navigation Design

## Goal

Replace the Profile screen's simple lobby detail bottom-sheet with navigation to the existing `BookingStep2` screen, add per-player payment status to `BookingStep2`, and add an "Enter Lobby" button on the Profile screen so users can join a lobby by invite code.

---

## Feature 1: Profile lobby tap → BookingStep2

### Current behaviour
Tapping a lobby card in Profile opens a bottom-sheet modal with a basic image/name/players list/creator-management UI.

### New behaviour
Tapping any lobby card navigates to `BookingStep2` with `{ lobbyId, fieldId, fromProfile: true }`. The bottom-sheet modal and all its state (`selectedLobby`, `selectedLobbyTeams`, `selectedLobbyPlayers`, `selectedField`, `detailsLoading`, `friends`, `friendQuery`, `inviteModal`, `friendsLoading`) are removed from `ProfileScreen`.

`BookingStep2` already provides: PriceCard (progress bar + pay button), invite code card, QR modal, TeamCards with player slots, invite-friends modal, join requests, lobby type management.

When `fromProfile: true`, the sticky bottom bar on `BookingStep2` is hidden so "Опубликовать" and "Забронировать" buttons don't appear for lobbies that are already in progress or completed.

### Files
- `src/types/navigation.ts` — add `fromProfile?: boolean` to `BookingStep2` params
- `src/screens/ProfileScreen.tsx` — remove modal + related state, change `onPress` on lobby cards to `navigation.navigate('BookingStep2', { lobbyId, fieldId, fromProfile: true })`
- `src/screens/BookingStep2Screen.tsx` — read `fromProfile` from route params, hide sticky bottom bar when `true`

---

## Feature 2: Per-player payment status in BookingStep2

### New behaviour
When `BookingStep2` loads a lobby, it fetches `paymentsApi.status(lobbyId)` in parallel with the existing player/team fetch. The result is a `userId → PaymentStatus` map (`'pending' | 'paid' | 'failed' | 'refunded'`).

Each `PlayerSlot` receives the player's payment status. A small colored dot is rendered in the top-right corner of the slot circle:
- **Green** (`#45AF31`) — `'paid'`
- **Yellow** (`#F59E0B`) — `'pending'`
- **Red** (`#EF4444`) — `'failed'` or `'refunded'`
- No dot — slot is empty or status unknown

### Files
- `src/screens/BookingStep2Screen.tsx` — fetch payments, pass `paymentStatus` prop to `PlayerSlot`
- `PlayerSlot` component in same file — add optional `paymentStatus?: PaymentStatus` prop, render dot

---

## Feature 3: "Enter Lobby" button on Profile screen

### New behaviour
A button labelled "Войти в лобби" appears in the Profile header area (right of the edit icon) or just above the match tabs. Tapping it opens a small bottom-sheet modal with:
- Title: "Войти в лобби"
- TextInput for invite code (placeholder: "Введите код приглашения")
- "Войти" button — calls `lobbiesApi.join(code, code)` (treating the code as both the lobby ID and invite code), then navigates to `BookingStep2({ lobbyId: joinedLobby.id, fieldId: joinedLobby.fieldId })`
- Error handling: show Alert on failure

The API call is `lobbiesApi.join(lobbyId, inviteCode)`. Since users enter an invite code (not a lobby ID), we first need a way to resolve the invite code to a lobby. If the backend `join` endpoint accepts the invite code as the ID or code parameter, we call `lobbiesApi.join(code, code)`. If not, we may need a `lobbiesApi.findByCode(code)` endpoint — check at implementation time. If not available, we call `lobbiesApi.join(code)` treating the entered string as a lobby ID.

### Files
- `src/screens/ProfileScreen.tsx` — add `enterLobbyModal` state, add button to header, add modal JSX, add `handleEnterLobby` handler

---

## Data flow summary

```
ProfileScreen
  lobby card tap → navigate('BookingStep2', { lobbyId, fieldId, fromProfile: true })
  "Enter lobby" button → enterLobbyModal open
    TextInput: code
    "Войти" → lobbiesApi.join(code, code) → navigate('BookingStep2', { lobbyId })

BookingStep2Screen
  load: Promise.all([lobbiesApi.get, lobbiesApi.players, paymentsApi.status])
  paymentsMap: userId → PaymentStatus
  PlayerSlot: receives paymentStatus prop → renders colored dot
  fromProfile=true → hide sticky bottom bar
```

---

## Error handling

- `paymentsApi.status` failure: catch silently, render no dots (payment data is supplementary)
- `lobbiesApi.join` failure: `Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось войти в лобби'))`
- Navigation to `BookingStep2` with unknown `lobbyId` already handled by BookingStep2's own error alert

---

## Out of scope

- Real-time payment status updates (polling or websocket for payment changes)
- Payment initiation from the "Enter Lobby" flow
- Leaving a lobby from Profile
