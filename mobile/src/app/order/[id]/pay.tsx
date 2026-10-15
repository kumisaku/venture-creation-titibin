import { router, useLocalSearchParams } from 'expo-router';
import { showAlert } from '@/lib/alert';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, ErrorState, Loading, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { plain } from '@/lib/format';
import { useApi, useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Order } from '@/lib/types';

const METHODS = [
  { key: 'qris', code: 'QR', label: 'QRIS' },
  { key: 'va', code: 'VA', label: 'BCA/Mandiri' },
  { key: 'binuspay', code: 'BIN', label: 'Binus Pay' },
];

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error, loading, reload } = useApi<Order>(`/orders/${id}`);
  const [method, setMethod] = useState('qris');
  const { busy, run } = useAsyncAction();

  const pay = () =>
    run(async () => {
      await api(`/orders/${id}/pay`, { body: { method } });
      showAlert('Pembayaran berhasil', 'Dana kamu aman tertahan di escrow kampus sampai barang diterima.');
      router.replace(`/order/${id}/track`);
    });

  return (
    <Screen bg={colors.white} edges={['top', 'bottom']}>
      <ScreenHeader title="Campus Escrow Payment" />
      {loading ? (
        <Loading />
      ) : error || !order ? (
        <ErrorState message={error ?? 'Tidak ditemukan'} onRetry={reload} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <Text weight="medium" size={13} color={colors.textSoft}>
              Select Method
            </Text>
            <Row style={{ gap: 10 }}>
              {METHODS.map((m) => {
                const on = m.key === method;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMethod(m.key)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 16,
                      borderRadius: radius.md,
                      borderWidth: on ? 2 : 1,
                      borderColor: on ? colors.orange : colors.border,
                      backgroundColor: on ? colors.orangeSoft : colors.bg,
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: on ? '#FDBA8C' : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                      <Text weight="bold" size={13} color={on ? colors.orangeText : colors.muted}>
                        {m.code}
                      </Text>
                    </View>
                    <Text weight="medium" size={12} color={on ? colors.orangeText : colors.textSoft}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </Row>

            <View style={{ backgroundColor: colors.bg, borderRadius: radius.md, padding: 16, gap: 14, borderWidth: 1, borderColor: colors.border }}>
              <Text weight="bold" size={13}>
                Cost Summary
              </Text>
              {(
                [
                  ['Items Total', order.itemPrice],
                  ['Jastiper Fee (20%)', order.jastipFee],
                  ['Platform Fee (10%)', order.appFee],
                ] as const
              ).map(([label, value]) => (
                <Row key={label} style={{ justifyContent: 'space-between' }}>
                  <Text size={13} color={colors.muted}>
                    {label}
                  </Text>
                  <Text weight="bold" size={13}>
                    {plain(value)}
                  </Text>
                </Row>
              ))}
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <Row style={{ justifyContent: 'space-between' }}>
                <Text weight="bold">Total Due</Text>
                <Text weight="extrabold" size={16}>
                  {plain(order.total)}
                </Text>
              </Row>
            </View>
            <Text size={12} color={colors.muted}>
              Pesanan #{order.code} • {order.productName}
            </Text>
          </ScrollView>
          <View style={{ padding: 20 }}>
            {order.status === 'accepted' ? (
              <Button title="Confirm & Pay (Safe Escrow)" variant="orange" loading={busy} onPress={pay} style={{ borderRadius: 12 }} />
            ) : (
              <Text weight="semibold" color={colors.muted} style={{ textAlign: 'center' }}>
                {order.status === 'pending' ? 'Menunggu jastiper menerima request.' : 'Pesanan ini sudah dibayar.'}
              </Text>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
