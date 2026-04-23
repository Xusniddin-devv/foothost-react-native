# foothost-web — Admin Panel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full admin panel at `/admin` in the existing Next.js `foothost-web` app, with pages for News, Users, Fields, and Lobbies, using the real backend API.

**Architecture:** Server-side rendering via Next.js App Router. A shared `lib/api.ts` module wraps `fetch` with JWT from `localStorage` (via cookies for SSR or client components). All admin pages are Client Components (use `"use client"`) since they need auth state. Admin layout wraps all admin pages with a sidebar. Login page updated to call real `POST /auth/login` endpoint.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide Icons. No new npm packages needed. Repo: `/Users/macstore.uz/Documents/GitHub/foothost-web`

**Backend base URL:** `http://localhost:3000` (or env var `NEXT_PUBLIC_API_URL`)

---

### Task 1: API client and shared types

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```typescript
export type UserRole = 'player' | 'field_owner' | 'both';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isPhoneVerified: boolean;
  avatarUrl: string | null;
  rating: number;
  tournamentCount: number;
  wins: number;
  streakWeeks: number;
  position: string | null;
  createdAt: string;
}

export interface Field {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  pricePerHour: number;
  rating: number;
  photos: string[];
  description: string | null;
  createdAt: string;
}

export type LobbyStatus = 'draft' | 'active' | 'full' | 'paid' | 'booked' | 'completed' | 'cancelled';

export interface Lobby {
  id: string;
  creatorId: string;
  fieldId: string;
  status: LobbyStatus;
  maxPlayers: number;
  teamCount: number;
  durationHours: number;
  totalAmount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface News {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  published: boolean;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewsDto {
  title: string;
  body: string;
  published?: boolean;
}
```

- [ ] **Step 2: Create `src/lib/api.ts`**

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  login: (phone: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  me: () => request<import('./types').User>('/users/me'),

  // Admin
  users: {
    all: () => request<import('./types').User[]>('/users/all'),
  },

  fields: {
    all: () => request<import('./types').Field[]>('/fields'),
  },

  lobbies: {
    all: () => request<import('./types').Lobby[]>('/lobbies/all'),
  },

  news: {
    all: () => request<import('./types').News[]>('/news/all'),
    create: (dto: import('./types').CreateNewsDto) =>
      request<import('./types').News>('/news', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (id: string, dto: Partial<import('./types').CreateNewsDto>) =>
      request<import('./types').News>(`/news/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    remove: (id: string) =>
      request<{ deleted: boolean }>(`/news/${id}`, { method: 'DELETE' }),
    uploadImage: async (id: string, file: File): Promise<import('./types').News> => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${BASE}/news/${id}/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  },
};
```

- [ ] **Step 3: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-web
git add src/lib/api.ts src/lib/types.ts
git commit -m "feat(admin): add API client and shared types"
```

---

### Task 2: Update login page to use real API

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Replace mock login with real API call**

Replace the entire `handleSubmit` function in `src/app/login/page.tsx`:

```tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  try {
    const { accessToken } = await api.login(phone, password);
    localStorage.setItem('access_token', accessToken);
    router.push('/home');
  } catch {
    alert('Неверный номер телефона или пароль');
  } finally {
    setLoading(false);
  }
}
```

Add import at top of the file:

```tsx
import { api } from '@/lib/api';
```

- [ ] **Step 2: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-web
git add src/app/login/page.tsx
git commit -m "feat(auth): wire login page to real backend API"
```

---

### Task 3: Admin layout with sidebar

**Files:**
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Create admin layout**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { LayoutDashboard, Newspaper, Users, Building2, ListOrdered, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { href: "/admin/news", label: "Новости", icon: Newspaper },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/fields", label: "Поля", icon: Building2 },
  { href: "/admin/lobbies", label: "Лобби", icon: ListOrdered },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.me()
      .then(setMe)
      .catch(() => router.replace("/login"));
  }, [router]);

  function logout() {
    localStorage.removeItem("access_token");
    router.replace("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white shadow-lg transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <LayoutDashboard size={22} className="text-primary" />
          <span className="font-artico text-lg font-black uppercase tracking-wide text-[#0c0f0d]">
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t px-4 py-4">
          {me && (
            <p className="mb-3 truncate text-xs text-gray-500">
              {me.firstName} {me.lastName}
            </p>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 lg:hidden">
          <button onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <span className="font-artico font-black uppercase tracking-wide">Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `/admin` redirect page**

Create `src/app/admin/page.tsx`:

```tsx
import { redirect } from "next/navigation";
export default function AdminRoot() {
  redirect("/admin/news");
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-web
git add src/app/admin/layout.tsx src/app/admin/page.tsx
git commit -m "feat(admin): add admin layout with sidebar and auth guard"
```

---

### Task 4: News management page

**Files:**
- Create: `src/app/admin/news/page.tsx`

- [ ] **Step 1: Create news admin page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { News, CreateNewsDto } from "@/lib/types";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

const EMPTY: CreateNewsDto = { title: "", body: "", published: true };

export default function AdminNewsPage() {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<News | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateNewsDto>(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setItems(await api.news.all());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setForm(EMPTY);
    setImageFile(null);
    setEditing(null);
    setCreating(true);
  }

  function startEdit(item: News) {
    setForm({ title: item.title, body: item.body, published: item.published });
    setImageFile(null);
    setEditing(item);
    setCreating(false);
  }

  function cancel() {
    setCreating(false);
    setEditing(null);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      if (creating) {
        const created = await api.news.create(form);
        if (imageFile) await api.news.uploadImage(created.id, imageFile);
      } else if (editing) {
        await api.news.update(editing.id, form);
        if (imageFile) await api.news.uploadImage(editing.id, imageFile);
      }
      cancel();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить новость?")) return;
    await api.news.remove(id).catch(() => {});
    await load();
  }

  const showForm = creating || editing !== null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-wide">Новости</h1>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d9c2b]"
        >
          <Plus size={16} /> Создать
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">
            {creating ? "Новая новость" : "Редактировать"}
          </h2>
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Заголовок"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Текст"
              rows={4}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published ?? true}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="accent-primary"
              />
              Опубликовано
            </label>
            <div>
              <p className="mb-1 text-xs text-gray-500">Изображение (необязательно)</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-[#3d9c2b] disabled:opacity-60"
            >
              <Check size={16} /> {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-2 rounded-xl border px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <X size={16} /> Отмена
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Заголовок</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {item.published ? "Опубликовано" : "Черновик"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(item)} className="mr-3 text-gray-400 hover:text-primary">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Нет новостей</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-web
git add src/app/admin/news/page.tsx
git commit -m "feat(admin): add news management page (CRUD)"
```

---

### Task 5: Users list page

**Files:**
- Create: `src/app/admin/users/page.tsx`

- [ ] **Step 1: Create users admin page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  player: "Игрок",
  field_owner: "Владелец поля",
  both: "Оба",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.users.all()
      .then(setUsers)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black uppercase tracking-wide">Пользователи</h1>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Имя</th>
                <th className="px-4 py-3">Телефон</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Рейтинг</th>
                <th className="px-4 py-3">Регистрация</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.rating}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Нет пользователей</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-web
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): add users list page"
```

---

### Task 6: Fields list page

**Files:**
- Create: `src/app/admin/fields/page.tsx`

- [ ] **Step 1: Create fields admin page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Field } from "@/lib/types";
import { Star } from "lucide-react";

export default function AdminFieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.fields.all()
      .then(setFields)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black uppercase tracking-wide">Поля</h1>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Название</th>
                <th className="px-4 py-3">Адрес</th>
                <th className="px-4 py-3">Цена/час</th>
                <th className="px-4 py-3">Рейтинг</th>
                <th className="px-4 py-3">Добавлено</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3 text-gray-500">{f.address}</td>
                  <td className="px-4 py-3">{f.pricePerHour.toLocaleString("ru-RU")} сум</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Star size={13} className="text-yellow-400" />
                      {f.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(f.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
              {fields.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Нет полей</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-web
git add src/app/admin/fields/page.tsx
git commit -m "feat(admin): add fields list page"
```

---

### Task 7: Lobbies list page

**Files:**
- Create: `src/app/admin/lobbies/page.tsx`

- [ ] **Step 1: Create lobbies admin page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Lobby } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  full: "bg-blue-100 text-blue-700",
  paid: "bg-purple-100 text-purple-700",
  booked: "bg-indigo-100 text-indigo-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик", active: "Активно", full: "Полное",
  paid: "Оплачено", booked: "Забронировано", completed: "Завершено", cancelled: "Отменено",
};

export default function AdminLobbiesPage() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.lobbies.all()
      .then(setLobbies)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка — возможно, нет прав администратора"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black uppercase tracking-wide">Лобби</h1>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Игроков</th>
                <th className="px-4 py-3">Сумма</th>
                <th className="px-4 py-3">Истекает</th>
                <th className="px-4 py-3">Создано</th>
              </tr>
            </thead>
            <tbody>
              {lobbies.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{l.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[l.status] ?? ""}`}>
                      {STATUS_LABELS[l.status] ?? l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{l.maxPlayers}</td>
                  <td className="px-4 py-3">{l.totalAmount.toLocaleString("ru-RU")} сум</td>
                  <td className="px-4 py-3 text-gray-500">
                    {l.expiresAt ? new Date(l.expiresAt).toLocaleString("ru-RU") : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(l.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
              {lobbies.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Нет лобби</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the full admin build compiles**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-web
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/macstore.uz/Documents/GitHub/foothost-web
git add src/app/admin/lobbies/page.tsx
git commit -m "feat(admin): add lobbies list page"
```
