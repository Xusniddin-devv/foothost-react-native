import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Share,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { lobbiesApi } from '../services/api/lobbies';
import { fieldsApi } from '../services/api/fields';
import { usersApi } from '../services/api/users';
import { getApiErrorMessage } from '../services/api/client';
import { useLobbySocket } from '../hooks/useLobbySocket';
import { useAuth } from '../contexts/AuthContext';
import { paymentsApi } from '../services/api/payments';
import type { Field, Lobby, LobbyPlayer, Team as ApiTeam, User, Payment, PaymentStatus } from '../types/api';

type BookingStep2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'BookingStep2'
>;

type BookingStep2ScreenRouteProp = RouteProp<RootStackParamList, 'BookingStep2'>;

interface Props {
  navigation: BookingStep2ScreenNavigationProp;
  route: BookingStep2ScreenRouteProp;
}

const FALLBACK_STADIUM_IMAGE = require('../../assets/images/stadium/stadium.png');

interface DisplayTeam {
  id: string;
  name: string;
  players: (LobbyPlayer | null)[];
}

// ── Progress bar ───────────────────────────────────────────────────────────────
const PriceCard = ({ total, collected, onPayPress }: { total: string; collected: string; onPayPress: () => void }) => {
  const totalNum = parseInt(total.replace(/[^\d]/g, ''), 10) || 0;
  const collectedNum = parseInt(collected.replace(/[^\d]/g, ''), 10) || 0;
  const progress = totalNum > 0 ? Math.min(collectedNum / totalNum, 1) : 0;

  return (
    <View className="bg-white rounded-2xl p-4 mx-4 mb-4 shadow-sm" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
      {/* Progress bar */}
      <View className="h-[5px] w-full bg-gray-200 rounded-full overflow-hidden mb-3">
        <View className="h-full bg-primary rounded-full" style={{ width: `${progress * 100}%` }} />
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-artico-bold text-[26px] text-text-primary" style={{ lineHeight: 30 }}>
            {total} <Text className="text-base font-manrope-medium">сум</Text>
          </Text>
          <Text className="font-manrope-medium text-xs text-gray-500 mt-0.5">
            Собрано: {collected} сум
          </Text>
        </View>
        <TouchableOpacity
          className="bg-primary flex-row items-center rounded-xl px-4 py-3"
          style={{ gap: 6 }}
          onPress={onPayPress}
        >
          <MaterialCommunityIcons name="credit-card-outline" size={18} color="white" />
          <Text className="text-white font-manrope-bold text-sm">Оплатить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Player slot ────────────────────────────────────────────────────────────────
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

// ── Team card ──────────────────────────────────────────────────────────────────
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

// ── Screen ─────────────────────────────────────────────────────────────────────
export const BookingStep2Screen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const lobbyId = route?.params?.lobbyId;
  const fieldId = route?.params?.fieldId;
  const fromProfile = route?.params?.fromProfile === true;
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [field, setField] = useState<Field | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [apiTeams, setApiTeams] = useState<ApiTeam[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [joinRequests, setJoinRequests] = useState<LobbyPlayer[]>([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [inviteModal, setInviteModal] = useState<{ visible: boolean; teamId: string | null }>({
    visible: false,
    teamId: null,
  });
  const [qrVisible, setQrVisible] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const isCreator = !!(user?.id && lobby?.creatorId && user.id === lobby.creatorId);

  const approvedPlayers = useMemo(
    () => players.filter((p) => p.status === 'approved'),
    [players],
  );

  const paymentMap = useMemo<Record<string, PaymentStatus>>(() => {
    const map: Record<string, PaymentStatus> = {};
    for (const p of payments) map[p.userId] = p.status;
    return map;
  }, [payments]);

  const teams = useMemo<DisplayTeam[]>(() => {
    const teamCount = Math.max(1, lobby?.teamCount ?? 2);
    const maxPlayers = Math.max(teamCount, lobby?.maxPlayers ?? teamCount * 5);
    const slotsPerTeam = Math.max(1, Math.ceil(maxPlayers / teamCount));

    const base = Array.from({ length: teamCount }, (_, idx) => {
      const fromApi = apiTeams[idx];
      return {
        id: fromApi?.id ?? `team-${idx + 1}`,
        name: fromApi?.name ?? `Команда ${idx + 1}`,
        players: Array(slotsPerTeam).fill(null) as (LobbyPlayer | null)[],
      };
    });

    const byTeam = new Map<string, LobbyPlayer[]>();
    for (const p of approvedPlayers) {
      if (!p.teamId) continue;
      const arr = byTeam.get(p.teamId) ?? [];
      arr.push(p);
      byTeam.set(p.teamId, arr);
    }

    return base.map((t) => {
      const filled = byTeam.get(t.id) ?? [];
      const padded = [...filled, ...Array(Math.max(0, t.players.length - filled.length)).fill(null)];
      return { ...t, players: padded.slice(0, t.players.length) };
    });
  }, [apiTeams, approvedPlayers, lobby?.maxPlayers, lobby?.teamCount]);

  useEffect(() => {
    if (!lobbyId) return;
    let cancelled = false;
    (async () => {
      try {
        const [l, p, paymentData] = await Promise.all([
          lobbiesApi.get(lobbyId),
          lobbiesApi.players(lobbyId).catch(() => [] as LobbyPlayer[]),
          paymentsApi.status(lobbyId).catch(() => ({ payments: [] as Payment[] })),
        ]);
        if (cancelled) return;
        setLobby(l);
        setPlayers(p);
        setPayments(paymentData.payments);
        const fId = fieldId ?? l.fieldId;
        if (fId) {
          const f = await fieldsApi.get(fId).catch(() => null);
          if (!cancelled && f) setField(f);
        }
        const lobbyTeams = await lobbiesApi.teams(lobbyId).catch(() => [] as ApiTeam[]);
        if (!cancelled) setApiTeams(lobbyTeams);
        if (l?.creatorId === user?.id) {
          const pending = await lobbiesApi.joinRequests(lobbyId).catch(() => [] as LobbyPlayer[]);
          if (!cancelled) setJoinRequests(pending);
        } else if (!cancelled) {
          setJoinRequests([]);
        }
      } catch (err) {
        if (!cancelled) Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось загрузить лобби'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lobbyId, fieldId, user?.id]);

  useEffect(() => {
    if (!inviteModal.visible || !lobbyId) return;
    let cancelled = false;
    setFriendsLoading(true);
    usersApi
      .friends(friendQuery)
      .then((data) => {
        if (!cancelled) setFriends(data);
      })
      .catch(() => {
        if (!cancelled) setFriends([]);
      })
      .finally(() => {
        if (!cancelled) setFriendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inviteModal.visible, friendQuery, lobbyId]);

  useLobbySocket(lobbyId, {
    onPlayerJoined: () => {
      if (lobbyId) lobbiesApi.players(lobbyId).then(setPlayers).catch(() => undefined);
    },
    onPlayerLeft: () => {
      if (lobbyId) lobbiesApi.players(lobbyId).then(setPlayers).catch(() => undefined);
    },
    onLobbyUpdated: () => {
      if (lobbyId) lobbiesApi.get(lobbyId).then(setLobby).catch(() => undefined);
    },
  });

  useEffect(() => {
    if (!lobbyId || !isCreator) return;
    lobbiesApi.joinRequests(lobbyId).then(setJoinRequests).catch(() => undefined);
  }, [lobbyId, isCreator, players.length]);

  const handleAddPlayer = (teamId: string, slotIndex: number) => {
    void slotIndex;
    if (!lobbyId) {
      Alert.alert('Информация', 'Приглашения будут доступны после создания лобби');
      return;
    }
    setFriendQuery('');
    setInviteModal({ visible: true, teamId });
  };

  const handleShuffle = (teamId: string) => {
    void teamId;
  };

  const handleInviteFriend = async (friendId: string) => {
    if (!lobbyId || !inviteModal.teamId) return;
    try {
      await lobbiesApi.invite(lobbyId, friendId, inviteModal.teamId);
      const updatedPlayers = await lobbiesApi.players(lobbyId).catch(() => [] as LobbyPlayer[]);
      setPlayers(updatedPlayers);
      setInviteModal({ visible: false, teamId: null });
      Alert.alert('Готово', 'Игрок приглашен в лобби');
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось отправить приглашение'));
    }
  };

  const handlePublish = async () => {
    if (!lobbyId) {
      Alert.alert('Ошибка', 'Лобби ещё не создано');
      return;
    }
    try {
      const updated = await lobbiesApi.publish(lobbyId);
      setLobby(updated);
      Alert.alert('Готово', 'Лобби опубликовано');
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось опубликовать лобби'));
    }
  };

  const handleShare = async () => {
    if (!lobby) return;
    try {
      const inviteCode = lobby.inviteCode ?? lobby.id;
      await Share.share({
        message: `Присоединяйся к лобби Foothost!\nПоле: ${field?.name ?? 'Лобби'}\nКод приглашения: ${inviteCode}\nСсылка: foothost://lobby/${lobby.id}?code=${inviteCode}`,
      });
      setShareCopied(true);
    } catch {
      // no-op
    }
  };

  const qrText = lobby
    ? `foothost://lobby/${lobby.id}?code=${lobby.inviteCode ?? ''}`
    : 'foothost://lobby';
  const qrUrl = `https://quickchart.io/qr?size=280&text=${encodeURIComponent(qrText)}`;

  const handleBook = () => {
    navigation.navigate('BookingStep3', { lobbyId });
  };

  const handleApproveRequest = async (requestUserId: string) => {
    if (!lobbyId) return;
    try {
      await lobbiesApi.approveJoinRequest(lobbyId, requestUserId);
      const [updatedPlayers, pending] = await Promise.all([
        lobbiesApi.players(lobbyId).catch(() => [] as LobbyPlayer[]),
        lobbiesApi.joinRequests(lobbyId).catch(() => [] as LobbyPlayer[]),
      ]);
      setPlayers(updatedPlayers);
      setJoinRequests(pending);
    } catch (err) {
      Alert.alert('Ошибка', getApiErrorMessage(err, 'Не удалось подтвердить заявку'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center">
          <MaterialCommunityIcons name="chevron-left" size={24} color="#212121" />
          <Text className="font-manrope-medium text-sm text-text-primary ml-1">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: fromProfile ? 24 : 120 }}>
        {/* Hero image */}
        <View style={{ position: 'relative' }}>
          <Image
            source={field?.photos?.[0] ? { uri: field.photos[0] } : FALLBACK_STADIUM_IMAGE}
            style={{ width: '100%', height: 200 }}
            resizeMode="cover"
          />
          {/* Gradient overlay at bottom */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              justifyContent: 'flex-end',
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
          >
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Text className="font-artico-bold text-white text-[22px]" style={{ letterSpacing: 1 }}>
                {field?.name ?? 'Лобби'}
              </Text>
              <View className="bg-primary rounded-md px-2 py-0.5 flex-row items-center" style={{ gap: 3 }}>
                <Text className="text-white font-manrope-bold text-sm">
                  {field ? Number(field.rating.toFixed(1)) : 0}
                </Text>
                <MaterialCommunityIcons name="star" size={12} color="white" />
              </View>
            </View>
            <View className="flex-row items-center mt-0.5">
              <MaterialCommunityIcons name="map-marker" size={12} color="white" />
              <Text className="text-white font-manrope-medium text-xs ml-1">{field?.address ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* Price card */}
        <View className="mt-3">
          <PriceCard
            total={Number(lobby?.totalAmount ?? 0).toLocaleString('ru-RU')}
            collected={Number(lobby?.confirmedTotal ?? 0).toLocaleString('ru-RU')}
            onPayPress={() =>
              navigation.navigate('PaymentScreen', {
                lobbyId,
                amount: field?.pricePerHour,
              })
            }
          />
        </View>

        <View className="mx-4 mb-4 rounded-xl border border-primary/30 bg-white px-4 py-3">
          <Text className="font-manrope-semibold text-sm text-text-primary">
            Код приглашения: {lobby?.inviteCode ?? 'будет после создания'}
          </Text>
          <TouchableOpacity
            onPress={() => setQrVisible(true)}
            className="mt-2 self-start rounded-lg border border-primary px-3 py-1.5"
          >
            <Text className="font-manrope-semibold text-xs text-primary">Показать QR-код</Text>
          </TouchableOpacity>
          {shareCopied ? (
            <Text className="mt-1 font-manrope-medium text-xs text-primary">Приглашение готово к отправке</Text>
          ) : null}
        </View>

        {isCreator && lobby?.type === 'invite_only' ? (
          <View className="mx-4 mb-4 rounded-xl border border-orange-200 bg-white px-4 py-3">
            <Text className="mb-2 font-manrope-semibold text-sm text-text-primary">
              Заявки на вступление
            </Text>
            {joinRequests.length === 0 ? (
              <Text className="font-manrope-medium text-xs text-gray-500">Новых заявок нет</Text>
            ) : (
              joinRequests.map((request) => (
                <View
                  key={request.userId}
                  className="mb-2 flex-row items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                >
                  <Text className="font-manrope-medium text-sm text-text-primary">
                    {request.user?.firstName ?? 'Игрок'} {request.user?.lastName ?? ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleApproveRequest(request.userId)}
                    className="rounded-lg bg-primary px-3 py-1.5"
                  >
                    <Text className="font-manrope-semibold text-xs text-white">Принять</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* Teams section */}
        <View className="px-4">
          <Text className="font-artico-bold text-[22px] text-text-primary mb-4" style={{ letterSpacing: 0.5 }}>
            ВЫБЕРИТЕ КОМАНДУ
          </Text>

          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onAddPlayer={handleAddPlayer}
              onShuffle={handleShuffle}
              paymentMap={paymentMap}
            />
          ))}
        </View>
      </ScrollView>

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

      <Modal visible={inviteModal.visible} transparent animationType="slide" onRequestClose={() => setInviteModal({ visible: false, teamId: null })}>
        <View className="flex-1 justify-end bg-black/35">
          <View className="rounded-t-3xl bg-white px-4 pb-8 pt-4" style={{ maxHeight: '72%' }}>
            <Text className="mb-2 font-manrope-bold text-base text-text-primary">Пригласить из друзей</Text>
            <TextInput
              value={friendQuery}
              onChangeText={setFriendQuery}
              placeholder="Поиск по имени или телефону"
              className="mb-3 rounded-xl border border-gray-200 px-3 py-2 text-text-primary"
              placeholderTextColor="#9CA3AF"
            />
            {friendsLoading ? (
              <View className="py-8">
                <ActivityIndicator size="small" color="#45AF31" />
              </View>
            ) : (
              <ScrollView>
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    onPress={() => handleInviteFriend(friend.id)}
                    className="mb-2 flex-row items-center justify-between rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <View>
                      <Text className="font-manrope-semibold text-sm text-text-primary">
                        {friend.firstName} {friend.lastName}
                      </Text>
                      <Text className="font-manrope-medium text-xs text-gray-500">{friend.phone ?? 'Без номера'}</Text>
                    </View>
                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#45AF31" />
                  </TouchableOpacity>
                ))}
                {friends.length === 0 ? (
                  <Text className="py-8 text-center font-manrope-medium text-sm text-gray-500">
                    Друзья не найдены
                  </Text>
                ) : null}
              </ScrollView>
            )}
            <TouchableOpacity
              onPress={() => setInviteModal({ visible: false, teamId: null })}
              className="mt-4 rounded-xl border border-gray-200 py-3"
            >
              <Text className="text-center font-manrope-semibold text-sm text-text-primary">Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={() => setQrVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <View className="w-full rounded-2xl bg-white p-4">
            <Text className="mb-3 text-center font-manrope-bold text-base text-text-primary">QR приглашения</Text>
            <Image source={{ uri: qrUrl }} style={{ width: 260, height: 260, alignSelf: 'center' }} />
            <Text className="mt-3 text-center font-manrope-medium text-xs text-gray-500">{qrText}</Text>
            <TouchableOpacity onPress={() => setQrVisible(false)} className="mt-4 rounded-xl bg-primary py-3">
              <Text className="text-center font-manrope-bold text-sm text-white">Готово</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
