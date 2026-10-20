import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { CostSummary, ProductThumb } from '@/components/app';
import { Button, Card, ErrorState, Loading, Row, Screen, ScreenHeader, Text, UploadBox } from '@/components/ui';
import { api, fileUrl } from '@/lib/api';
import { showAlert } from '@/lib/alert';
import { useApi, useAsyncAction, type PickedImage } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Order, User } from '@/lib/types';

// Jastiper side: after buying the item with their own money, upload the receipt and the QR the buyer pays to.
export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error, loading, reload } = useApi<Order>(`/orders/${id}`);
  const { data: me } = useApi<User>('/me');
  const { busy, run } = useAsyncAction();
  const [invoice, setInvoice] = useState<PickedImage | null>(null);
  const [qr, setQr] = useState<PickedImage | null>(null);

  const savedQr = me?.paymentQr ?? null;

  const submit = () =>
    run(async () => {
      if (!invoice) throw new Error('Unggah foto bukti pembayaran / invoice dulu');
      if (!qr && !savedQr) throw new Error('Unggah QR pembayaran milikmu agar buyer bisa membayar');
      await api(`/orders/${id}/invoice`, { body: { invoicePhoto: invoice.dataUrl, paymentQr: qr?.dataUrl } });
      showAlert('Invoice terkirim', 'Buyer akan diminta membayar ke QR kamu.');
      router.back();
    });

  return (
    <Screen bg={colors.white} edges={['top', 'bottom']}>
      <ScreenHeader title="Upload Invoice" subtitle={order ? `Pesanan #${order.code}` : undefined} />
      {loading ? (
        <Loading />
      ) : error || !order ? (
        <ErrorState message={error ?? 'Tidak ditemukan'} onRetry={reload} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <Card style={{ gap: 12, borderWidth: 1.5, borderColor: colors.border }}>
              <Row style={{ gap: 12 }}>
                <ProductThumb photo={order.photo} size={52} />
                <View style={{ flex: 1 }}>
                  <Text weight="bold">{order.productName}</Text>
                  <Text size={12} color={colors.muted}>
                    {order.buyer.name} • {order.quantity} pcs
                  </Text>
                </View>
              </Row>
              <CostSummary order={order} title="Yang akan dibayar buyer" />
            </Card>

            <View style={{ gap: 8 }}>
              <Text weight="bold" size={15}>
                1. Bukti pembayaran / invoice
              </Text>
              <Text size={12} color={colors.muted}>
                Foto struk atau invoice pembelian barang. Buyer baru membayar setelah melihat ini.
              </Text>
              <UploadBox title="Unggah Foto Invoice" value={invoice} onChange={setInvoice} />
            </View>

            <View style={{ gap: 8 }}>
              <Text weight="bold" size={15}>
                2. QR pembayaran kamu
              </Text>
              <Text size={12} color={colors.muted}>
                Buyer membayar langsung ke QR ini (QRIS / e-wallet / rekening). QR disimpan agar tidak perlu diunggah lagi.
              </Text>
              {savedQr && !qr && (
                <Row style={{ gap: 12, padding: 10, borderRadius: radius.md, backgroundColor: '#F4F7FD', borderWidth: 1, borderColor: colors.primaryTint }}>
                  <Image source={{ uri: fileUrl(savedQr) }} style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: colors.white }} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text weight="semibold">QR tersimpan dipakai</Text>
                    <Text size={12} color={colors.muted}>
                      Unggah di bawah untuk menggantinya.
                    </Text>
                  </View>
                </Row>
              )}
              <UploadBox title={savedQr ? 'Ganti QR Pembayaran' : 'Unggah QR Pembayaran'} value={qr} onChange={setQr} />
            </View>
          </ScrollView>
          <View style={{ padding: 20 }}>
            <Button title="Kirim Invoice ke Buyer" variant="orange" loading={busy} onPress={submit} style={{ borderRadius: 12 }} />
          </View>
        </>
      )}
    </Screen>
  );
}
