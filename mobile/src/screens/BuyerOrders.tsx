import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/lib/alert';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { ProductThumb, SegmentProgress, StatusBadge } from '@/components/app';
import { Button, Card, Chip, Divider, EmptyState, ErrorState, IconButton, Loading, Row, Screen, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { progressLabel, progressStep, rupiah, shortDateTime, STATUS_META } from '@/lib/format';
import { useApi, useAsyncAction } from '@/lib/hooks';
import { colors, fonts, radius } from '@/lib/theme';
import type { Order } from '@/lib/types';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Diterima' },
  { key: 'rejected', label: 'Ditolak' },
] as const;

type Filter = (typeof FILTERS)[number]['key'];

function matches(order: Order, filter: Filter) {
  if (filter === 'all') return true;
  const tone = STATUS_META[order.status].tone;
  return filter === 'accepted' ? tone === 'accepted' || tone === 'done' : tone === filter;
}

export function BuyerOrders() {
  const { data: orders, error, loading, reload } = useApi<Order[]>('/orders');
  const [filter, setFilter] = useState<Filter>('all');
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');

  const visible = (orders ?? []).filter(
    (o) => matches(o, filter) && (!search || `${o.productName} ${o.code}`.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <Screen>
      <Row style={{ paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'space-between' }}>
        <Text weight="extrabold" size={22}>
          Pesanan Saya
        </Text>
        <IconButton icon={searching ? 'close' : 'search'} onPress={() => (setSearching((s) => !s), setSearch(''))} />
      </Row>
      {searching && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <TextInput
            autoFocus
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama barang atau kode pesanan"
            placeholderTextColor={colors.faint}
            style={{ backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 16, height: 44, fontFamily: fonts.medium, borderWidth: 1, borderColor: colors.border }}
          />
        </View>
      )}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 14, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : visible.length ? (
          visible.map((o) => <OrderCard key={o.id} order={o} onChanged={reload} />)
        ) : (
          <EmptyState icon="receipt-outline" title="Belum ada pesanan" body="Titip barang dari trip jastiper di Beranda." />
        )}
      </ScrollView>
    </Screen>
  );
}

function Notice({ tone, icon, text }: { tone: 'amber' | 'red'; icon: 'time-outline' | 'close-circle-outline'; text: string }) {
  const c = tone === 'amber' ? { bg: colors.amberSoft, fg: colors.amber } : { bg: colors.redSoft, fg: colors.red };
  return (
    <Row style={{ backgroundColor: c.bg, borderRadius: radius.sm, padding: 12, gap: 8, alignItems: 'flex-start' }}>
      <Ionicons name={icon} size={16} color={c.fg} style={{ marginTop: 1 }} />
      <Text size={12} color={c.fg} style={{ flex: 1, lineHeight: 18 }}>
        {text}
      </Text>
    </Row>
  );
}

function OrderCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { busy, run } = useAsyncAction();
  const step = progressStep(order.status);
  const location = order.trip?.country ?? order.purchaseLocation;

  const cancel = () =>
    showAlert('Batalkan request?', 'Request titipan ini akan dibatalkan.', [
      { text: 'Tidak', style: 'cancel' },
      {
        text: 'Batalkan',
        style: 'destructive',
        onPress: () =>
          run(async () => {
            await api(`/orders/${order.id}/cancel`, { method: 'POST' });
            onChanged();
          }),
      },
    ]);

  const resubmit = () =>
    router.push({
      pathname: '/request/new',
      params: {
        productName: order.productName,
        quantity: String(order.quantity),
        purchaseLocation: order.purchaseLocation,
        store: order.store,
        weightKg: String(order.weightKg),
        unitPrice: String(order.unitPrice),
      },
    });

  const awaitingPayment = Boolean(order.invoicePhoto) && !order.paid && ['bought', 'arrived', 'on_the_way'].includes(order.status);

  let action: ReactNode = null;
  if (order.status === 'pending' || order.status === 'negotiation') {
    action = <Button title="Batalkan Request" variant="outline" size="md" icon="close-circle-outline" loading={busy} onPress={cancel} />;
  } else if (awaitingPayment) {
    action = <Button title="Bayar Sekarang" variant="orange" size="md" icon="wallet-outline" onPress={() => router.push(`/order/${order.id}/pay`)} />;
  } else if (step > 0 && order.status !== 'completed') {
    action = <Button title="Lacak Pesanan" variant="orange" size="md" icon="car-outline" onPress={() => router.push(`/order/${order.id}/track`)} />;
  } else if (order.status === 'completed' && !order.reviewed) {
    action = <Button title="Beri Ulasan" variant="orange" size="md" icon="star-outline" onPress={() => router.push(`/order/${order.id}/rate`)} />;
  } else if (order.status === 'rejected') {
    action = (
      <Button
        title="Ajukan Ulang"
        variant="outline"
        size="md"
        icon="refresh"
        onPress={resubmit}
        style={{ borderColor: colors.orange }}
      />
    );
  }

  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Text weight="bold">#{order.code}</Text>
          <Text size={11} color={colors.muted}>
            {shortDateTime(order.createdAt)}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </Row>
      <Divider />
      <Row style={{ gap: 12, alignItems: 'flex-start' }}>
        <ProductThumb photo={order.photo} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text weight="bold" size={15}>
            {order.productName}
          </Text>
          <Text size={12} color={colors.muted}>
            {order.purchaseLocation} • {order.quantity} pcs • {order.weightKg} kg
          </Text>
          <Row style={{ gap: 4 }}>
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Text size={12} color={colors.muted} style={{ flex: 1 }}>
              Serah terima: {order.handoverPoint}
            </Text>
          </Row>
        </View>
      </Row>

      {order.jastiper && (
        <Row style={{ gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person-outline" size={14} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="bold" size={13}>
              {order.jastiper.name}
            </Text>
            {order.jastiper.rating != null && (
              <Text size={11} color={colors.muted}>
                ★ {order.jastiper.rating.toFixed(1)} • {order.jastiper.ratingCount} trip
              </Text>
            )}
          </View>
          {!['rejected', 'cancelled'].includes(order.status) && (
            <Pressable
              onPress={() => router.push(`/order/${order.id}/chat`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.primarySoft }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
              <Text weight="bold" size={12} color={colors.primary}>
                Chat
              </Text>
            </Pressable>
          )}
        </Row>
      )}

      {order.status === 'pending' && (
        <Notice tone="amber" icon="time-outline" text="Request kamu sedang ditinjau jastiper. Kamu belum perlu membayar apa pun." />
      )}
      {order.status === 'negotiation' && (
        <Notice tone="amber" icon="time-outline" text="Request melebihi budget jastiper, jadi sedang dinegosiasikan. Jastiper bisa menambah modal atau menolak. Kamu bisa membahasnya lewat chat." />
      )}
      {order.status === 'accepted' && (
        <Notice tone="amber" icon="time-outline" text="Jastiper menerima request-mu! Kamu bayar nanti, setelah jastiper membelikan barang dan mengunggah invoice." />
      )}
      {awaitingPayment && (
        <Notice tone="amber" icon="time-outline" text="Invoice sudah diunggah jastiper. Silakan bayar lewat QR jastiper." />
      )}
      {(order.status === 'rejected' || order.status === 'cancelled') && (
        <Notice
          tone="red"
          icon="close-circle-outline"
          text={order.status === 'cancelled' ? 'Request ini kamu batalkan.' : `Ditolak: ${order.rejectReason ?? 'Jastiper tidak dapat memenuhi request.'}`}
        />
      )}
      {step > 0 && (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.sm, padding: 12, gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: 6, flex: 1 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange }} />
              <Text weight="bold" size={12} color={colors.orangeText}>
                {progressLabel(order.status, location)}
              </Text>
            </Row>
            <Text size={11} color={colors.muted}>
              Langkah {step}/4
            </Text>
          </Row>
          <SegmentProgress step={step} />
        </View>
      )}

      <Row style={{ justifyContent: 'space-between', gap: 12 }}>
        <View>
          <Text size={11} color={colors.muted}>
            Total Estimasi ({order.quantity} pcs)
          </Text>
          <Text weight="extrabold" size={18} color={colors.primary}>
            {rupiah(order.total)}
          </Text>
        </View>
        {action}
      </Row>
    </Card>
  );
}
