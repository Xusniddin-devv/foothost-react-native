# Backend — User Stats & New Endpoints

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 user stat columns to the `users` table and expose three new endpoints: `GET /lobbies/mine`, `GET /lobbies/all` (admin), `GET /users/all` (admin).

**Architecture:** TypeORM `synchronize: true` (dev) handles new columns automatically when entity is updated. New service methods call `Repository` directly. New controller routes slot into existing controllers.

**Tech Stack:** NestJS, TypeORM, PostgreSQL. Repo: `/Users/macstore.uz/Documents/GitHub/foothost-backend`

---

### Task 1: Add stat columns to User entity

**Files:**
- Modify: `src/users/user.entity.ts`
- Modify: `src/users/dto/update-user.dto.ts`

- [ ] **Step 1: Update User entity**

Replace the contents of `src/users/user.entity.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type UserRole = 'player' | 'field_owner' | 'both';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() firstName!: string;
  @Column() lastName!: string;
  @Column({ unique: true }) phone!: string;
  @Column() passwordHash!: string;
  @Column({ type: 'varchar', default: 'player' }) role!: UserRole;
  @Column({ default: false }) isPhoneVerified!: boolean;
  @Column({ type: 'varchar', nullable: true }) expoPushToken!: string | null;
  @Column({ type: 'varchar', nullable: true }) avatarUrl!: string | null;
  @Column({ type: 'int', default: 0 }) rating!: number;
  @Column({ type: 'int', default: 0 }) tournamentCount!: number;
  @Column({ type: 'int', default: 0 }) wins!: number;
  @Column({ type: 'int', default: 0 }) streakWeeks!: number;
  @Column({ type: 'varchar', nullable: true }) position!: string | null;
  @CreateDateColumn() createdAt!: Date;
}
```

- [ ] **Step 2: Update UpdateUserDto**

Replace contents of `src/users/dto/update-user.dto.ts`:

```typescript
import { IsOptional, IsString, IsInt, Min, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() expoPushToken?: string;
  @ValidateIf((o) => o.avatarUrl !== null) @IsOptional() @IsString() avatarUrl?: string | null;
  @IsOptional() @IsString() position?: string | null;
  @IsOptional() @IsInt() @Min(0) rating?: number;
  @IsOptional() @IsInt() @Min(0) tournamentCount?: number;
  @IsOptional() @IsInt() @Min(0) wins?: number;
  @IsOptional() @IsInt() @Min(0) streakWeeks?: number;
}
```

- [ ] **Step 3: Verify backend starts without error**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-backend
npm run start:dev
```

Expected: server starts, TypeORM logs `ALTER TABLE "users" ADD COLUMN ...` for the 5 new columns (or skips if they already exist).

- [ ] **Step 4: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-backend
git add src/users/user.entity.ts src/users/dto/update-user.dto.ts
git commit -m "feat(users): add rating, tournamentCount, wins, streakWeeks, position columns"
```

---

### Task 2: Add `findByUser` and `findAll` to LobbiesService

**Files:**
- Modify: `src/lobbies/lobbies.service.ts`

- [ ] **Step 1: Add two methods to LobbiesService**

Open `src/lobbies/lobbies.service.ts` and add these two methods after `findOpen()`:

```typescript
findByUser(userId: string): Promise<Lobby[]> {
  return this.lobbyRepo
    .createQueryBuilder('lobby')
    .innerJoin('lobby_players', 'lp', 'lp.lobbyId = lobby.id')
    .where('lp.userId = :userId', { userId })
    .orderBy('lobby.createdAt', 'DESC')
    .getMany();
}

findAll(): Promise<Lobby[]> {
  return this.lobbyRepo.find({ order: { createdAt: 'DESC' } });
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-backend
git add src/lobbies/lobbies.service.ts
git commit -m "feat(lobbies): add findByUser and findAll service methods"
```

---

### Task 3: Add `/lobbies/mine` and `/lobbies/all` routes

**Files:**
- Modify: `src/lobbies/lobbies.controller.ts`

- [ ] **Step 1: Add two routes to LobbiesController**

In `src/lobbies/lobbies.controller.ts`, add these two routes **before** the `@Get(':id')` route (order matters — Express matches routes top-to-bottom):

```typescript
@Get('mine')
getMine(@CurrentUser() u: JwtPayload) {
  return this.lobbies.findByUser(u.sub);
}

@Get('all')
@UseGuards(AdminGuard)
getAll() {
  return this.lobbies.findAll();
}
```

Also add `AdminGuard` to imports at the top:

```typescript
import { AdminGuard } from '../common/guards/admin.guard';
```

- [ ] **Step 2: Verify routes work**

Start the server and test:

```bash
# GET /lobbies/mine — needs Bearer token
curl -H "Authorization: Bearer <your_token>" http://localhost:3000/lobbies/mine
# Expected: [] or array of lobbies

# GET /lobbies/all — needs admin phone in ADMIN_PHONES env
curl -H "Authorization: Bearer <admin_token>" http://localhost:3000/lobbies/all
# Expected: array of all lobbies or 403 if not admin
```

- [ ] **Step 3: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-backend
git add src/lobbies/lobbies.controller.ts
git commit -m "feat(lobbies): add GET /lobbies/mine and GET /lobbies/all (admin)"
```

---

### Task 4: Add `findAll` to UsersService and `GET /users/all` route

**Files:**
- Modify: `src/users/users.service.ts`
- Modify: `src/users/users.controller.ts`

- [ ] **Step 1: Add findAll to UsersService**

In `src/users/users.service.ts`, add after `findById`:

```typescript
findAll(): Promise<User[]> {
  return this.userRepo.find({ order: { createdAt: 'DESC' } });
}
```

- [ ] **Step 2: Add route to UsersController**

In `src/users/users.controller.ts`, add at the top of the controller body (before `getMe`), and import `AdminGuard`:

```typescript
import { AdminGuard } from '../common/guards/admin.guard';
```

Add route:

```typescript
@Get('all')
@UseGuards(AdminGuard)
getAll() {
  return this.users.findAll();
}
```

- [ ] **Step 3: Verify**

```bash
curl -H "Authorization: Bearer <admin_token>" http://localhost:3000/users/all
# Expected: array of users
```

- [ ] **Step 4: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-backend
git add src/users/users.service.ts src/users/users.controller.ts
git commit -m "feat(users): add GET /users/all admin endpoint"
```
