import { router, useLocalSearchParams } from 'expo-router';
import { showAlert } from '@/lib/alert';
import { Image, ScrollView, View } from 'react-native';
import { ProductThumb } from '@/components/app';
import { Badge, Button, Card, ErrorState, Loading, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { api, fileUrl } from '@/lib/api';
import { plain, rupiah } from '@/lib/format';
import { useApi, useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Order } from '@/lib/types';

const REJECT_REASONS = ['Barang melebihi sisa bagasi jastiper.', 'Melebihi budget jastiper.', 'Barang tidak tersedia di toko tujuan.'];

export default function OrderReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error, loading, reload } = useApi<Order>(`/orders/${id}`);
  const { busy, run } = useAsyncAction();

  const act = (action: 'accept' | 'reject' | 'topup', reason?: string) =>
    run(async () => {
      const result = await api<Order>(`/orders/${id}/${action}`, { body: { reason } });
      if (result.status === 'negotiation') {
        showAlert('Ditahan untuk negosiasi', 'Titipan ini melebihi sisa budget trip. Tambah modal atau tolak.');
        reload();
        return;
      }
      showAlert(
        action === 'reject' ? 'Titipan ditolak' : 'Titipan diterima',
        action === 'reject' ? undefined : 'Beli barangnya, lalu upload invoice supaya buyer bisa membayar.',
      );
      router.back();
    });

  const reject = () =>
    showAlert('Alasan menolak', 'Pilih alasan yang akan dilihat buyer.', [
      ...REJECT_REASONS.map((r) => ({ text: r.replace(/\.$/, ''), onPress: () => act('reject', r) })),
      { text: 'Batal', style: 'cancel' as const },
    ]);

  return (
    <Screen bg={colors.white}>
      <ScreenHeader title="Order Request" right={order && <Badge label={order.status === 'pending' ? 'IN REVIEW' : order.status === 'negotiation' ? 'NEGOSIASI' : order.status.toUpperCase()} tone="amber" />} />
      {loading ? (
        <Loading />
      ) : error || !order ? (
        <ErrorState message={error ?? 'Tidak ditemukan'} onRetry={reload} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <Text size={13} color={colors.muted}>
              Silahkan tinjau kembali detail pesanan dari {order.buyer.name} (Binus {order.buyer.campus}).
            </Text>
            <Card style={{ gap: 12, borderWidth: 1.5, borderColor: colors.border }}>
              <Text weight="bold" size={12}>
                ITEM
              </Text>
              <Row style={{ gap: 14 }}>
                <ProductThumb photo={order.photo} size={64} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text weight="bold" size={17}>
                    {order.productName}
                  </Text>
                  <Text size={13} color={colors.textSoft}>
                    {order.store || order.purchaseLocation}
                  </Text>
                </View>
              </Row>
              <Row style={{ gap: 14 }}>
                <Text size={12}>
                  {order.quantity > 1 ? `${order.quantity} x ${plain(order.unitPrice)} = ` : ''}
                  {rupiah(order.itemPrice)}
                </Text>
                <Text weight="bold" size={12} color={colors.primary}>
                  Fee: {rupiah(order.jastipFee)}
                </Text>
              </Row>
              <Text size={12} color={colors.muted}>
                {order.quantity} pcs • Est. berat {order.weightKg} kg • Serah terima: {order.handoverPoint}
              </Text>
            </Card>
            {order.photos.length > 1 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {order.photos.map((p) => (
                  <Image key={p} source={{ uri: fileUrl(p) }} style={{ width: 84, height: 84, borderRadius: 12, backgroundColor: colors.surface }} />
                ))}
              </View>
            )}
            {order.status === 'negotiation' && (
              <View style={{ backgroundColor: colors.amberSoft, borderRadius: radius.md, padding: 14, gap: 4 }}>
                <Text weight="bold" size={13} color={colors.amber}>
                  Melebihi budget trip
                </Text>
                <Text size={12} color={colors.amber} style={{ lineHeight: 18 }}>
                  Request ini melebihi sisa budget{order.budgetShortfall ? ` sebesar ${rupiah(order.budgetShortfall)}` : ''}. Kamu bisa menambah modal (budget trip dinaikkan otomatis) atau menolaknya.
                </Text>
              </View>
            )}
            <Card style={{ gap: 8, borderWidth: 1.5, borderColor: colors.border }}>
              <Text weight="bold" size={12}>
                TOTAL HARGA
              </Text>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text size={13} color={colors.muted}>
                  Estimasi Harga Barang
                </Text>
                <Text size={13}>{rupiah(order.itemPrice)}</Text>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text size={13} color={colors.muted}>
                  Fee Jastip + Aplikasi
                </Text>
                <Text size={13}>{rupiah(order.jastipFee + order.appFee)}</Text>
              </Row>
              <View style={{ height: 1.5, backgroundColor: colors.primary }} />
              <Row style={{ justifyContent: 'space-between' }}>
                <Text weight="bold" size={13} color={colors.primary}>
                  Total Estimasi Harga
                </Text>
                <Text weight="bold" size={13} color={colors.primary}>
                  {rupiah(order.total)}
                </Text>
              </Row>
            </Card>
          </ScrollView>
          {(order.status === 'pending' || order.status === 'negotiation') && (
            <View style={{ padding: 20, gap: 12 }}>
              <Button
                title={order.status === 'negotiation' ? 'TAMBAH MODAL & TERIMA' : 'TERIMA'}
                loading={busy}
                onPress={() => act(order.status === 'negotiation' ? 'topup' : 'accept')}
                style={{ borderRadius: 12 }}
              />
              <Button title="TOLAK" variant="outline" disabled={busy} onPress={reject} style={{ borderRadius: 12 }} />
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
