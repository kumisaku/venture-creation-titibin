import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { AppTopBar, ProductThumb, StatusBadge } from '@/components/app';
import { Badge, Button, Card, EmptyState, ErrorState, IconButton, Loading, Row, Screen, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { progressLabel, rupiah } from '@/lib/format';
import { useApi, useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Order } from '@/lib/types';

export function JastiperRequests() {
  const { data: orders, error, loading, reload } = useApi<Order[]>('/orders?as=jastiper');
  const incoming = (orders ?? []).filter((o) => o.status === 'pending');
  const active = (orders ?? []).filter((o) => ['accepted', 'paid', 'bought', 'arrived', 'on_the_way'].includes(o.status));

  return (
    <Screen>
      <AppTopBar greeting={false} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text weight="extrabold" size={20}>
            Request Titipan Masuk
          </Text>
          {incoming.length > 0 && <Badge label={`${incoming.length} Baru`} tone="solidOrange" />}
        </Row>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            {incoming.length ? (
              incoming.map((o) => <IncomingCard key={o.id} order={o} onChanged={reload} />)
            ) : (
              <EmptyState icon="mail-open-outline" title="Belum ada request baru" body="Request titipan dari buyer akan muncul di sini." />
            )}
            {active.length > 0 && (
              <>
                <Text weight="extrabold" size={18} style={{ marginTop: 8 }}>
                  Pesanan Aktif
                </Text>
                {active.map((o) => (
                  <ActiveCard key={o.id} order={o} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function BuyerHeader({ order }: { order: Order }) {
  return (
    <Row style={{ gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Row style={{ gap: 10, flex: 1 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Row style={{ gap: 6 }}>
            <Text weight="bold" size={15}>
              {order.buyer.name}
            </Text>
            <Badge label={`Binus ${order.buyer.campus}`} tone="gray" />
          </Row>
          <Row style={{ gap: 4 }}>
            <Ionicons name="checkmark-circle-outline" size={13} color={colors.green} />
            <Text size={12} color={colors.muted}>
              Verified {order.buyer.nim}
            </Text>
          </Row>
        </View>
      </Row>
      <Badge label={`Est. Berat ${order.weightKg} Kg`} tone="orange" />
    </Row>
  );
}

function ProductBox({ order }: { order: Order }) {
  return (
    <Row style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 10, gap: 12 }}>
      <ProductThumb photo={order.photo} size={58} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="bold" size={15}>
          {order.productName}
        </Text>
        <Text size={12} color={colors.textSoft}>
          {order.store ? `Beli di ${order.store}` : order.purchaseLocation}
        </Text>
        <Row style={{ gap: 10 }}>
          <Text weight="bold" size={12}>
            Beli: {rupiah(order.itemPrice)}
          </Text>
          <Text weight="bold" size={12} color={colors.primary}>
            Fee: {rupiah(order.jastipFee)}
          </Text>
        </Row>
      </View>
    </Row>
  );
}

function IncomingCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { busy, run } = useAsyncAction();
  const act = (action: 'accept' | 'reject') =>
    run(async () => {
      await api(`/orders/${order.id}/${action}`, { method: 'POST' });
      onChanged();
    });

  return (
    <Pressable onPress={() => router.push(`/order/${order.id}/review`)}>
      <Card style={{ gap: 12 }}>
        <BuyerHeader order={order} />
        <ProductBox order={order} />
        <Row style={{ gap: 8 }}>
          <IconButton icon="chatbubble-ellipses-outline" size={46} onPress={() => router.push(`/order/${order.id}/chat`)} />
          <Button title="Tolak" variant="danger-soft" icon="close" size="md" disabled={busy} onPress={() => act('reject')} style={{ flex: 1 }} />
          <Button title="Terima Titipan" icon="checkmark" size="md" loading={busy} onPress={() => act('accept')} style={{ flex: 2 }} />
        </Row>
      </Card>
    </Pressable>
  );
}

function ActiveCard({ order }: { order: Order }) {
  return (
    <Card style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text weight="bold">#{order.code}</Text>
        <StatusBadge status={order.status} />
      </Row>
      <ProductBox order={order} />
      <Row style={{ justifyContent: 'space-between', gap: 8 }}>
        <Text size={12} weight="semibold" color={colors.orangeText} style={{ flex: 1 }}>
          {order.status === 'accepted' ? 'Menunggu pembayaran buyer' : progressLabel(order.status, order.trip?.country ?? '')}
        </Text>
        <IconButton icon="chatbubble-ellipses-outline" size={38} onPress={() => router.push(`/order/${order.id}/chat`)} />
        {order.trip && <Button title="Kelola" size="sm" iconRight="arrow-forward" onPress={() => router.push(`/trip/${order.trip!.id}`)} />}
      </Row>
    </Card>
  );
}
