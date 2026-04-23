# Backend Integration & Admin Panel Design
**Date:** 2026-04-23  
**Status:** Approved

## Scope

Three parallel workstreams across three repos:
1. **foothost-backend** — add user stats fields + new endpoints
2. **foothost-react-native** — replace mock data with live API calls
3. **foothost-web** — build admin panel

---

## Part 1: Backend

### User entity additions
Add 5 columns to `users` table via TypeORM entity update (sync on start or migration):
- `rating: int` (default 0)
- `tournamentCount: int` (default 0)
- `wins: int` (default 0)
- `streakWeeks: int` (default 0)
- `position: varchar nullable`

All fields are manually set via existing `PATCH /users/me`. No auto-computation.

### New endpoints

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/lobbies/mine` | JwtAuthGuard | Lobbies the current user has joined (via lobby_players table) |
| GET | `/lobbies/all` | JwtAuthGuard + AdminGuard | All lobbies regardless of status, for admin panel |
| GET | `/users/all` | JwtAuthGuard + AdminGuard | Paginated users list for admin panel |

### UpdateUserDto additions
Allow `position`, `rating`, `tournamentCount`, `wins`, `streakWeeks` in the DTO (so users can update their own profile stats).

---

## Part 2: Mobile App (foothost-react-native)

### HomeScreen
- Rating level badge: `level = Math.min(10, Math.floor(user.rating / 300))`, progress = `(user.rating % 300) / 300`
- Tier label: < 900 = "Новичок", < 1800 = "Любитель", < 2700 = "Полупрофи", < 3600 = "Профи", >= 3600 = "Легенда"
- "Players to follow" horizontal scroll → replaced with real news cards from `GET /news`
- Static news grid (SVG images) → kept as editorial design content

### TournamentsScreen
- Replace `mockTournaments` with `GET /lobbies` (open lobbies)
- For each lobby, fetch field name via `GET /fields/:id` (or batch)
- Show: field name as location, `totalAmount` as cost, `maxPlayers` as participants, `expiresAt` formatted as time
- Loading + empty state

### ProfileScreen
- Stats from `AuthContext.user`: `rating`, `tournamentCount`, `wins`, `streakWeeks`, `position`
- Display name + avatar already real
- Upcoming matches: `GET /lobbies/mine` → filter `status in [active, full, paid, booked]`
- Past matches: `GET /lobbies/mine` → filter `status === completed`
- My Teams: `GET /lobbies/:id/teams` per each joined lobby
- Avatar upload already wired

---

## Part 3: foothost-web Admin Panel

### Auth
- Existing `/login` page (phone + password) → JWT stored in localStorage
- Admin routes check `GET /users/me` on load; if 403 on any admin endpoint → redirect to `/login`
- No separate admin login page

### New routes
- `/admin` → redirect to `/admin/news`
- `/admin/news` — CRUD table: list via `GET /news/all`, create/edit modal with title, body, published toggle, image upload via `POST /news/:id/image`, delete
- `/admin/users` — read-only table via `GET /users/all`: name, phone, role, createdAt
- `/admin/fields` — table via `GET /fields` (public endpoint): name, address, owner, rating
- `/admin/lobbies` — table via `GET /lobbies/all`: status, field, creator, maxPlayers, expiresAt

### Shared layout
- Left sidebar: logo, nav links (News, Users, Fields, Lobbies), logout button
- Shows logged-in user's name in sidebar footer
- Mobile-responsive sidebar collapses

### API client
- Single `lib/api.ts` with axios instance, JWT header injected, 401 → redirect to login
