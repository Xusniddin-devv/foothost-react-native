export type UserRole = 'player' | 'field_owner' | 'both';

export interface User {
  id: string;
  username?: string | null;
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  role?: UserRole;
}

export interface LoginDto {
  phone: string;
  password: string;
}

export interface VerifyOtpDto {
  phone: string;
  code: string;
}

export interface Field {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  pricePerHour: number;
  slotDuration: number;
  amenities: Record<string, boolean>;
  description: string | null;
  pitchType: string | null;
  dimensions: string | null;
  workTime: string | null;
  mapUrl: string | null;
  photos: string[];
  rating: number;
  reviewsCount: number;
  createdAt: string;
}

export interface FieldSlot {
  id: string;
  fieldId: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'locked' | 'booked';
}

export type LobbyType = 'open' | 'invite_only' | 'closed';
export type LobbyStatus =
  | 'draft'
  | 'active'
  | 'full'
  | 'paid'
  | 'booked'
  | 'completed'
  | 'cancelled';

export interface Lobby {
  id: string;
  creatorId: string;
  fieldId: string;
  type: LobbyType;
  status: LobbyStatus;
  maxPlayers: number;
  teamCount: number;
  durationHours: number;
  totalAmount: number;
  confirmedTotal: number;
  inviteCode: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface LobbyPlayer {
  id: string;
  lobbyId: string;
  userId: string;
  teamId: string | null;
  status: 'invited' | 'pending' | 'approved';
  invitedByUserId?: string | null;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'phone' | 'avatarUrl'>;
  joinedAt: string;
}

export interface Team {
  id: string;
  lobbyId: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  lobbyId: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  providerRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  lobbyId: string;
  fieldSlotId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  authorId: string;
  fieldRating: number;
  matchRating: number;
  comment: string | null;
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
