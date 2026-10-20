import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { AppTopBar, TripCapacity } from '@/components/app';
import { Badge, Button, Card, EmptyState, ErrorState, IconButton, Loading, Row, Screen, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { daysUntil, longDate, rupiah } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Trip } from '@/lib/types';

const AVG_ITEM_KG = 0.8;

// Finished trips (everything handed over) sink to the bottom of the list.
const byActive = (a: Trip, b: Trip) => Number(a.finished) - Number(b.finished);

export function JastiperHome() {
  const { user } = useAuth();
  const { data: trips, error, loading, reload } = useApi<Trip[]>('/trips/mine');

  return (
    <Screen>
      <AppTopBar greeting={false} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
        <View style={{ gap: 2 }}>
          <Text weight="medium" color={colors.muted}>
            Halo, {user?.name.split(' ')[0]}
          </Text>
          <Text weight="bold" size={19} style={{ lineHeight: 26 }}>
            Perjalananmu, peluang baru untuk cuan tanpa batas.
          </Text>
        </View>

        <Pressable onPress={() => router.push('/earnings')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primarySoft }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="stats-chart" size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="bold">Pendapatan & Ulasan</Text>
              <Text size={12} color={colors.muted}>
                Harian, mingguan, bulanan, tahunan + tip dari buyer
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </Card>
        </Pressable>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : trips?.length ? (
          [...trips].sort(byActive).map((t) => <MyTripCard key={t.id} trip={t} />)
        ) : (
          <Card style={{ gap: 12 }}>
            <EmptyState icon="airplane-outline" title="Belum ada trip" body="Umumkan perjalananmu supaya teman kampus bisa titip barang." />
            <Button title="Create Trip" variant="orange" icon="add" onPress={() => router.push('/trip/new')} />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function tripState(trip: Trip) {
  const toDepart = daysUntil(trip.departDate);
  const toReturn = daysUntil(trip.returnDate);
  if (trip.finished || toReturn < 0) return { label: 'SELESAI', tone: 'gray' as const };
  if (toDepart <= 0) return { label: 'ACTIVE', tone: 'solidOrange' as const };
  return { label: toDepart === 1 ? 'BESOK' : `IN ${toDepart} DAYS`, tone: 'orange' as const };
}

function MyTripCard({ trip }: { trip: Trip }) {
  const state = tripState(trip);
  const itemsMin = Math.floor(trip.remainingKg / (AVG_ITEM_KG * 1.5));
  const itemsMax = Math.floor(trip.remainingKg / AVG_ITEM_KG);

  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Badge label="Trip Terverifikasi" tone="green" icon="checkmark-circle" />
        <Row style={{ gap: 8 }}>
          <Badge label={state.label} tone={state.tone} />
          <IconButton icon="paper-plane-outline" size={36} onPress={() => router.push(`/trip/${trip.id}`)} />
        </Row>
      </Row>
      <Text weight="extrabold" size={19}>
        {trip.origin} → {trip.destination}
      </Text>
      <Row style={{ gap: 6 }}>
        <Ionicons name="calendar-outline" size={14} color={colors.muted} />
        <Text size={13} color={colors.textSoft}>
          {longDate(trip.departDate)} → {longDate(trip.returnDate)}
        </Text>
      </Row>

      <TripCapacity trip={trip} />
      <Text weight="semibold" size={11}>
        {itemsMax > 0 ? `Bagasi optimal untuk ${Math.max(1, itemsMin)}–${itemsMax} item lagi` : 'Bagasi penuh'}
      </Text>

      {trip.pendingRequests > 0 && (
        <Badge label={`${trip.pendingRequests} request baru menunggu`} tone="orange" icon="mail-unread-outline" />
      )}
      {trip.negotiationRequests > 0 && (
        <Badge label={`${trip.negotiationRequests} request melebihi budget (negosiasi)`} tone="amber" icon="swap-horizontal-outline" />
      )}

      <Row style={{ gap: 12 }}>
        <Row style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm, padding: 10, gap: 8 }}>
          <Ionicons name="shield" size={18} color={colors.primary} />
          <View>
            <Text size={10} color={colors.muted}>
              Potensi Tip & Jasa
            </Text>
            <Text weight="bold" size={13}>
              {rupiah(trip.potentialFee)}
            </Text>
          </View>
        </Row>
        <Button title="UPDATE" size="sm" iconRight="arrow-forward" onPress={() => router.push(`/trip/${trip.id}`)} style={{ borderRadius: 10 }} />
      </Row>
    </Card>
  );
}
