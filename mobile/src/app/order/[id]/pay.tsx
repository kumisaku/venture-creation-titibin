import { router, useLocalSearchParams } from 'expo-router';
import { showAlert } from '@/lib/alert';
import { Image, ScrollView, View } from 'react-native';
import { CostSummary } from '@/components/app';
import { Button, ErrorState, Loading, Screen, ScreenHeader, Text } from '@/components/ui';
import { api, fileUrl } from '@/lib/api';
import { useApi, useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Order } from '@/lib/types';

// Buyer side: pay the jastiper's own QR after they upload the invoice.
export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error, loading, reload } = useApi<Order>(`/orders/${id}`);
  const { busy, run } = useAsyncAction();

  const pay = () =>
    run(async () => {
      await api(`/orders/${id}/pay`, { method: 'POST' });
      showAlert('Pembayaran dicatat', 'Terima kasih! Jastiper akan menyerahkan barang setelah tiba di kampus.');
      router.replace(`/order/${id}/track`);
    });

  const ready = Boolean(order?.invoicePhoto && order.paymentQr);

  return (
    <Screen bg={colors.white} edges={['top', 'bottom']}>
      <ScreenHeader title="Pembayaran" subtitle={order ? `Pesanan #${order.code}` : undefined} />
      {loading ? (
        <Loading />
      ) : error || !order ? (
        <ErrorState message={error ?? 'Tidak ditemukan'} onRetry={reload} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {ready ? (
              <>
                <View style={{ gap: 8 }}>
                  <Text weight="bold" size={14}>
                    Invoice dari jastiper
                  </Text>
                  <Image
                    source={{ uri: fileUrl(order.invoicePhoto!) }}
                    style={{ width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.surface }}
                    resizeMode="contain"
                  />
                </View>

                <View style={{ alignItems: 'center', gap: 10, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg }}>
                  <Text weight="bold" size={14}>
                    Scan QR {order.jastiper?.name ?? 'jastiper'} untuk membayar
                  </Text>
                  <Image source={{ uri: fileUrl(order.paymentQr!) }} style={{ width: 240, height: 240, backgroundColor: colors.white }} resizeMode="contain" />
                  <Text size={12} color={colors.muted} style={{ textAlign: 'center' }}>
                    Bayar sesuai total di bawah lewat aplikasi bank / e-wallet, lalu tekan tombol konfirmasi.
                  </Text>
                </View>

                <View style={{ backgroundColor: colors.bg, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                  <CostSummary order={order} title="Cost Summary" />
                </View>
                <Text size={12} color={colors.muted}>
                  {order.productName}
                </Text>
              </>
            ) : (
              <View style={{ alignItems: 'center', gap: 8, padding: 24 }}>
                <Text weight="bold" size={16}>
                  Belum ada invoice
                </Text>
                <Text color={colors.muted} style={{ textAlign: 'center' }}>
                  {order.status === 'pending' || order.status === 'negotiation'
                    ? 'Menunggu jastiper menerima request.'
                    : 'Jastiper sedang membelikan barangmu. Kamu baru bisa membayar setelah jastiper mengunggah invoice.'}
                </Text>
              </View>
            )}
          </ScrollView>
          <View style={{ padding: 20 }}>
            {order.paid ? (
              <Text weight="semibold" color={colors.muted} style={{ textAlign: 'center' }}>
                Pesanan ini sudah dibayar.
              </Text>
            ) : ready ? (
              <Button title="Saya Sudah Bayar" variant="orange" loading={busy} onPress={pay} style={{ borderRadius: 12 }} />
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}
