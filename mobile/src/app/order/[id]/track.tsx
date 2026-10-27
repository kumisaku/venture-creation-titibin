import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/lib/alert';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { RefreshControl, ScrollView, View } from 'react-native';
import { ratingText } from '@/components/app';
import { Avatar, Badge, Button, Card, ErrorState, IconButton, Loading, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { shortDateTime } from '@/lib/format';
import { useApi, useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Order } from '@/lib/types';

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error, loading, reload } = useApi<Order>(`/orders/${id}`);
  const { busy, run } = useAsyncAction();

  const confirm = () =>
    showAlert('Konfirmasi terima barang?', 'Pastikan segel & kondisi barang sudah sesuai.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, sudah diterima',
        onPress: () =>
          run(async () => {
            await api(`/orders/${id}/confirm`, { method: 'POST' });
            router.replace(`/order/${id}/rate`);
          }),
      },
    ]);

  if (loading) return <Loading />;
  if (error || !order) return <ErrorState message={error ?? 'Tidak ditemukan'} onRetry={reload} />;

  const city = order.trip?.country ?? order.purchaseLocation;
  const steps = [
    { title: `Pesanan Dibeli di ${order.purchaseLocation}`, body: 'Jastiper membeli dan mengunggah invoice' },
    { title: 'Barang Sudah di Tangan Jastiper', body: 'Siap diantar ke kampus' },
    { title: 'Menuju Titik Serah Terima Kampus', body: `Jastiper menuju ${order.handoverPoint}` },
    { title: 'Pemeriksaan Barang & Konfirmasi Terima', body: 'Jastiper scan QR di bawah untuk menyerahkan barang' },
  ];
  // Index of the step currently in progress (0-based); steps before it are done.
  const current = ({ accepted: 0, bought: 1, arrived: 2, on_the_way: 2, completed: 4 } as Record<string, number>)[order.status] ?? 0;
  const live = order.status === 'on_the_way';
  const arrivedOrOnWay = order.status === 'arrived' || order.status === 'on_the_way';
  const canConfirm = arrivedOrOnWay && order.paid;
  const awaitingPayment = Boolean(order.invoicePhoto) && !order.paid && ['bought', 'arrived', 'on_the_way'].includes(order.status);

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Order Tracking" subtitle={`Order #${order.code}`} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
        <Card style={{ gap: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange }} />
              <Text weight="bold" size={13} color={colors.textSoft}>
                STATUS PENGIRIMAN
              </Text>
            </Row>
            {live && <Badge label="Menuju lokasi" tone="orange" />}
          </Row>
          {steps.map((s, i) => {
            const done = i < current || order.status === 'completed';
            const active = i === current && !done;
            return (
              <Row key={s.title} style={{ gap: 12, alignItems: 'flex-start' }}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: done ? colors.primary : active ? colors.white : colors.surface,
                      borderWidth: active ? 3 : 0,
                      borderColor: colors.orange,
                    }}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    ) : active ? (
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange }} />
                    ) : (
                      <Text weight="bold" size={11} color={colors.faint}>
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  {i < steps.length - 1 && <View style={{ width: 2, height: 30, backgroundColor: done ? colors.primary : colors.border }} />}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Row style={{ gap: 6 }}>
                    <Text weight="bold" size={13} color={active ? colors.orangeText : done ? colors.text : colors.faint} style={{ flexShrink: 1 }}>
                      {s.title}
                    </Text>
                    {active && live && <Badge label="LIVE" tone="solidOrange" />}
                  </Row>
                  <Text size={12} color={done || active ? colors.muted : colors.faint}>
                    {i === 0 && order.status === 'accepted' ? `Sedang dibelikan di ${city}` : s.body}
                  </Text>
                </View>
              </Row>
            );
          })}
          <Row style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, gap: 10 }}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text weight="bold" size={13}>
                Meeting Point
              </Text>
              <Text size={12} color={colors.muted}>
                {order.handoverPoint}
              </Text>
            </View>
          </Row>
          <Text size={11} color={colors.faint}>
            Update terakhir: {shortDateTime(order.updatedAt)}
          </Text>
        </Card>

        {awaitingPayment && (
          <Card style={{ gap: 10, backgroundColor: colors.orangeSoft }}>
            <Text weight="bold" size={14} color={colors.orangeText}>
              Invoice sudah diunggah — saatnya membayar
            </Text>
            <Text size={12} color={colors.textSoft}>
              Bayar lewat QR jastiper. Serah terima barang baru bisa diselesaikan setelah pembayaran.
            </Text>
            <Button title="Bayar Sekarang" variant="orange" size="md" icon="wallet-outline" onPress={() => router.push(`/order/${order.id}/pay`)} />
          </Card>
        )}

        <Card style={{ alignItems: 'center', gap: 12 }}>
          <Badge label="Sistem Serah Terima Otomatis" tone="blue" icon="shield-checkmark" />
          <Text weight="bold" size={17}>
            Campus Handover QR
          </Text>
          <Text size={12} color={colors.muted} style={{ textAlign: 'center' }}>
            Tunjukkan QR ini ke Jastiper saat serah terima barang
          </Text>
          <HandoverQr code={order.code} dimmed={!arrivedOrOnWay || !order.paid} />
          <View style={{ backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
            <Text weight="semibold" size={12}>
              {order.code}
            </Text>
          </View>
          <Row style={{ gap: 6 }}>
            <Ionicons name="checkmark-circle" size={14} color={colors.green} />
            <Text size={12} color={colors.muted}>
              {order.paid ? 'Sudah dibayar — QR siap discan jastiper' : 'Bayar dulu sebelum serah terima'}
            </Text>
          </Row>
        </Card>

        {order.jastiper && (
          <Card>
            <Row style={{ gap: 12 }}>
              <Avatar name={order.jastiper.name} size={42} tone="orange" />
              <View style={{ flex: 1 }}>
                <Row style={{ gap: 6 }}>
                  <Text weight="bold">{order.jastiper.name}</Text>
                  <Badge label={`Binus ${order.jastiper.campus}`} tone="orange" />
                </Row>
                <Text size={12} color={colors.muted}>
                  Jastiper • {ratingText(order.jastiper.rating, order.jastiper.ratingCount, 'trip')}
                </Text>
              </View>
              <IconButton icon="chatbubble-ellipses" color={colors.white} bg={colors.orange} onPress={() => router.push(`/order/${order.id}/chat`)} />
            </Row>
          </Card>
        )}
      </ScrollView>
      <View style={{ padding: 16, gap: 8 }}>
        <Text size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          Jastiper akan scan QR-mu. Atau konfirmasi manual setelah memeriksa segel & kondisi barang.
        </Text>
        {order.status === 'completed' ? (
          order.reviewed ? (
            <Button title="Pesanan Selesai" variant="soft" disabled />
          ) : (
            <Button title="Beri Ulasan" variant="orange" icon="star" onPress={() => router.replace(`/order/${order.id}/rate`)} />
          )
        ) : (
          <Button title="Confirm Receipt" variant="orange" iconRight="arrow-forward" disabled={!canConfirm} loading={busy} onPress={confirm} />
        )}
      </View>
    </Screen>
  );
}

// The code encodes the order code; the jastiper scans it with the in-app camera.
function HandoverQr({ code, dimmed }: { code: string; dimmed: boolean }) {
  return (
    <View style={{ padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.faint, opacity: dimmed ? 0.4 : 1, backgroundColor: colors.white }}>
      <QRCode value={code} size={180} color="#0F172A" backgroundColor="#FFFFFF" />
    </View>
  );
}
