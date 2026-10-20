import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, ErrorState, Field, Loading, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { showAlert } from '@/lib/alert';
import { useApi, useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Order } from '@/lib/types';

// Jastiper side: scan the QR on the buyer's tracking screen to hand the item over.
export default function HandoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error, loading, reload } = useApi<Order>(`/orders/${id}`);
  const [permission, requestPermission] = useCameraPermissions();
  const { busy, run } = useAsyncAction();
  const [manual, setManual] = useState('');
  const scanning = useRef(false);

  const submit = (code: string) =>
    run(async () => {
      try {
        await api(`/orders/${id}/handover`, { body: { code } });
      } finally {
        scanning.current = false;
      }
      showAlert('Serah terima selesai', 'Barang sudah diserahkan ke buyer.');
      router.replace('/orders');
    });

  const onScanned = ({ data }: { data: string }) => {
    if (scanning.current || busy) return;
    scanning.current = true;
    void submit(data);
  };

  const unpaid = order ? !order.paid : false;

  return (
    <Screen bg={colors.white} edges={['top', 'bottom']}>
      <ScreenHeader title="Serah Terima Barang" subtitle={order ? `Pesanan #${order.code} • ${order.buyer.name}` : undefined} />
      {loading ? (
        <Loading />
      ) : error || !order ? (
        <ErrorState message={error ?? 'Tidak ditemukan'} onRetry={reload} />
      ) : (
        <View style={{ flex: 1, padding: 20, gap: 16 }}>
          {unpaid && (
            <View style={{ backgroundColor: colors.amberSoft, borderRadius: radius.md, padding: 14, gap: 4 }}>
              <Text weight="bold" size={13} color={colors.amber}>
                Buyer belum membayar
              </Text>
              <Text size={12} color={colors.amber}>
                Serah terima baru bisa diselesaikan setelah buyer membayar ke QR kamu. Ingatkan lewat chat.
              </Text>
            </View>
          )}

          <Text size={13} color={colors.textSoft}>
            Minta buyer membuka halaman “Order Tracking”, lalu arahkan kamera ke QR Handover miliknya.
          </Text>

          <View style={{ height: 300, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
            {!permission ? (
              <Loading />
            ) : permission.granted ? (
              <>
                <CameraView
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={unpaid ? undefined : onScanned}
                />
                <View style={{ width: 190, height: 190, borderRadius: 24, borderWidth: 3, borderColor: colors.orange }} />
              </>
            ) : (
              <View style={{ alignItems: 'center', gap: 10, padding: 24 }}>
                <Text weight="semibold" color={colors.white} style={{ textAlign: 'center' }}>
                  Izinkan akses kamera untuk memindai QR buyer.
                </Text>
                <Button title="Izinkan Kamera" variant="orange" size="md" onPress={requestPermission} />
              </View>
            )}
          </View>

          <Card style={{ gap: 10 }}>
            <Text weight="bold" size={13}>
              Tidak bisa scan? Masukkan kode pesanan
            </Text>
            <Row style={{ gap: 10, alignItems: 'flex-start' }}>
              <Field
                placeholder="TB-0000-BIN"
                autoCapitalize="characters"
                value={manual}
                onChangeText={setManual}
                style={{ flex: 1 }}
              />
              <Button title="Selesai" size="md" disabled={unpaid || !manual.trim()} loading={busy} onPress={() => submit(manual)} style={{ height: 50 }} />
            </Row>
          </Card>
        </View>
      )}
    </Screen>
  );
}
