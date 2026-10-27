import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { ProductThumb, StatusBadge, TripCapacity } from '@/components/app';
import { Badge, Button, Card, EmptyState, ErrorState, IconButton, Loading, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import { longDate, rupiah, tripTitle } from '@/lib/format';
import { useApi, useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Order, OrderStatus, Trip } from '@/lib/types';

// Buttons that advance the order. 'accepted' and 'on_the_way' open their own screens instead.
const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  bought: 'Barang Sudah di Tanganku',
  arrived: 'Menuju Titik Serah Terima',
};

const WAITING: Partial<Record<OrderStatus, string>> = {
  completed: 'Selesai — barang sudah diserahkan',
  rejected: 'Request ditolak',
  cancelled: 'Dibatalkan buyer',
};

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, error, loading, reload } = useApi<Trip>(`/trips/${id}`);

  return (
    <Screen>
      <ScreenHeader title="Kelola Trip" subtitle={trip ? `${trip.origin} → ${trip.destination}` : undefined} />
      {loading ? (
        <Loading />
      ) : error || !trip ? (
        <ErrorState message={error ?? 'Trip tidak ditemukan'} onRetry={reload} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
          <Card style={{ gap: 10 }}>
            <Text weight="extrabold" size={18}>
              {trip.kind === 'event' ? trip.eventName : tripTitle(trip.destination, trip.country)}
            </Text>
            {trip.kind === 'event' && (
              <Text size={13} color={colors.textSoft}>
                {tripTitle(trip.destination, trip.country)}
              </Text>
            )}
            <Row style={{ gap: 6 }}>
              <Ionicons name="calendar-outline" size={14} color={colors.muted} />
              <Text size={13} color={colors.textSoft}>
                {longDate(trip.departDate)} → {longDate(trip.returnDate)}
              </Text>
            </Row>
            <Text size={13} color={colors.textSoft}>
              Toko: {trip.stores || '-'}
            </Text>
            <Text size={13} color={colors.textSoft}>
              Drop point: {trip.dropPoint}
            </Text>
            <Row style={{ gap: 6, flexWrap: 'wrap' }}>
              {trip.categories.map((k) => (
                <Badge key={k} label={CATEGORIES.find((c) => c.key === k)?.label ?? k} tone="blue" />
              ))}
            </Row>
            <TripCapacity trip={trip} />
            <Row style={{ gap: 10, marginTop: 4 }}>
              <Stat label="Potensi Fee" value={rupiah(trip.potentialFee)} />
              {trip.negotiationRequests > 0 && <Stat label="Menunggu negosiasi" value={`${trip.negotiationRequests} request`} />}
            </Row>
          </Card>

          <Text weight="extrabold" size={17}>
            Titipan di trip ini
          </Text>
          {trip.orders?.length ? (
            trip.orders.map((o) => <TripOrder key={o.id} order={o} onChanged={reload} />)
          ) : (
            <EmptyState icon="cube-outline" title="Belum ada titipan" body="Request dari buyer akan muncul di sini." />
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm, padding: 10 }}>
      <Text size={11} color={colors.muted}>
        {label}
      </Text>
      <Text weight="bold">{value}</Text>
    </View>
  );
}

function TripOrder({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { busy, run } = useAsyncAction();
  const next = NEXT_ACTION[order.status];

  return (
    <Card style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text weight="bold">#{order.code}</Text>
        <StatusBadge status={order.status} />
      </Row>
      <Row style={{ gap: 12 }}>
        <ProductThumb photo={order.photo} size={48} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{order.productName}</Text>
          <Text size={12} color={colors.muted}>
            {order.buyer.name} • {order.quantity} pcs • {order.weightKg} kg
          </Text>
          <Text size={12} color={colors.primary} weight="semibold">
            Fee kamu: {rupiah(order.jastipFee)}
          </Text>
        </View>
      </Row>
      {order.status === 'bought' && (
        <Text size={12} weight="semibold" color={order.paid ? colors.green : colors.amber}>
          {order.paid ? '✓ Buyer sudah membayar' : 'Invoice terkirim — menunggu buyer membayar'}
        </Text>
      )}
      {['arrived', 'on_the_way'].includes(order.status) && !order.paid && (
        <Text size={12} weight="semibold" color={colors.amber}>
          Buyer belum membayar — serah terima menunggu pembayaran
        </Text>
      )}
      <Row style={{ gap: 8 }}>
        {order.status === 'pending' || order.status === 'negotiation' ? (
          <Button
            title={order.status === 'negotiation' ? 'Negosiasi Budget' : 'Tinjau Request'}
            size="sm"
            variant={order.status === 'negotiation' ? 'orange' : 'primary'}
            onPress={() => router.push(`/order/${order.id}/review`)}
            style={{ flex: 1 }}
          />
        ) : order.status === 'accepted' ? (
          <Button title="Upload Invoice" icon="receipt-outline" size="sm" variant="orange" onPress={() => router.push(`/order/${order.id}/invoice`)} style={{ flex: 1 }} />
        ) : order.status === 'on_the_way' ? (
          <Button title="Serah Terima (Scan QR)" icon="qr-code-outline" size="sm" variant="orange" onPress={() => router.push(`/order/${order.id}/handover`)} style={{ flex: 1 }} />
        ) : next ? (
          <Button
            title={next}
            size="sm"
            variant="orange"
            loading={busy}
            style={{ flex: 1 }}
            onPress={() =>
              run(async () => {
                await api(`/orders/${order.id}/advance`, { method: 'POST' });
                onChanged();
              })
            }
          />
        ) : (
          <Text size={12} weight="semibold" color={colors.muted} style={{ flex: 1 }}>
            {WAITING[order.status]}
          </Text>
        )}
        {!['pending', 'rejected', 'cancelled'].includes(order.status) && (
          <IconButton icon="chatbubble-ellipses-outline" size={38} onPress={() => router.push(`/order/${order.id}/chat`)} />
        )}
      </Row>
    </Card>
  );
}
