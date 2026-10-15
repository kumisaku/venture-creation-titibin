import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { Avatar, Badge, Button, Card, Chip, ErrorState, Field, IconButton, Loading, Row, Screen, Stars, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { useApi, useAsyncAction } from '@/lib/hooks';
import { colors, fonts, radius } from '@/lib/theme';
import type { Order } from '@/lib/types';

const PRAISE = ['⚡ Tepat Waktu', '💬 Responsif & Ramah', '🍱 Makanan Masih Hangat', '🧾 Struk Lengkap', '✨ Sesuai Pesanan'];
const RATING_LABEL = ['', 'Kurang Memuaskan', 'Cukup', 'Lumayan Baik', 'Memuaskan', 'Sangat Memuaskan & Tepat Waktu!'];
const TIPS = [2000, 5000, 10000];

export default function RateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error, loading, reload } = useApi<Order>(`/orders/${id}`);
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [tip, setTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string | null>(null);
  const { busy, run } = useAsyncAction();

  const submit = () =>
    run(async () => {
      const tipValue = customTip !== null ? Number(customTip.replace(/\D/g, '')) || 0 : tip;
      await api(`/orders/${id}/review`, { body: { rating, tags, text, tip: tipValue } });
      router.replace('/feedback');
    });

  const toggle = (t: string) => setTags((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  return (
    <Screen edges={['top', 'bottom']}>
      <Row style={{ paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'space-between' }}>
        <IconButton icon="arrow-back" color={colors.text} bg="transparent" onPress={() => router.back()} />
        <Text weight="bold" size={18}>
          Review & Rating
        </Text>
        <IconButton icon="close" color={colors.text} bg="transparent" onPress={() => router.replace('/orders')} />
      </Row>
      {loading ? (
        <Loading />
      ) : error || !order || !order.jastiper ? (
        <ErrorState message={error ?? 'Tidak ditemukan'} onRetry={reload} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <Row style={{ backgroundColor: colors.primarySoft, borderRadius: radius.sm, padding: 10, gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' }}>
                <Text weight="bold" size={11} color={colors.white}>
                  1
                </Text>
              </View>
              <Text weight="medium" size={13}>
                Jastiper Review
              </Text>
            </Row>

            <Card style={{ gap: 14 }}>
              <Row style={{ gap: 14 }}>
                <Avatar name={order.jastiper.name} size={60} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text weight="bold" size={17}>
                    {order.jastiper.name}
                  </Text>
                  <Row style={{ gap: 6, flexWrap: 'wrap' }}>
                    <Badge label="Trusted Jastiper" tone="blue" />
                    <Badge label="Binusian Verified" tone="green" icon="checkmark-circle" />
                  </Row>
                </View>
              </Row>
              <View style={{ backgroundColor: colors.surface, borderRadius: radius.sm, padding: 12, gap: 6 }}>
                <Row style={{ gap: 6 }}>
                  <Ionicons name="git-commit-outline" size={14} color={colors.orangeText} />
                  <Text size={13}>{order.purchaseLocation} → </Text>
                  <Text weight="bold" size={13}>
                    {order.handoverPoint.split(' - ')[0]}
                  </Text>
                </Row>
                <Row style={{ gap: 6 }}>
                  <Ionicons name="bag-outline" size={14} color={colors.primary} />
                  <Text size={13} style={{ flex: 1 }}>
                    {order.productName} ({order.quantity} items)
                  </Text>
                </Row>
              </View>
            </Card>

            <Card style={{ alignItems: 'center', gap: 14 }}>
              <Text weight="semibold" size={15}>
                Bagaimana pelayanan Jastiper kamu?
              </Text>
              <Stars value={rating} onChange={setRating} />
              <Badge label={`😊 ${RATING_LABEL[rating]}`} tone="orange" />
            </Card>

            <Card style={{ gap: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text weight="bold" size={15}>
                  Beri Pujian Spesifik
                </Text>
                <Text size={11} color={colors.muted}>
                  Pilih yang sesuai
                </Text>
              </Row>
              <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                {PRAISE.map((p) => (
                  <Chip key={p} label={p} selected={tags.includes(p)} onPress={() => toggle(p)} />
                ))}
              </Row>
            </Card>

            <Card style={{ gap: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text weight="bold" size={15}>
                  Ulasan Pengalaman
                </Text>
                <Text size={11} color={colors.muted}>
                  {text.length}/200 chars
                </Text>
              </Row>
              <TextInput
                multiline
                maxLength={200}
                value={text}
                onChangeText={setText}
                placeholder="Ceritakan pengalamanmu dengan jastiper ini..."
                placeholderTextColor={colors.faint}
                style={{ minHeight: 96, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontFamily: fonts.regular, fontSize: 14, textAlignVertical: 'top', color: colors.text }}
              />
            </Card>

            <Card style={{ gap: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row style={{ gap: 8 }}>
                  <Ionicons name="wallet-outline" size={18} color={colors.orange} />
                  <Text weight="bold" size={15}>
                    Beri tip apresiasi ke Jastiper?
                  </Text>
                </Row>
                <Text size={11} color={colors.muted}>
                  Opsional
                </Text>
              </Row>
              <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                {TIPS.map((t) => (
                  <Chip
                    key={t}
                    label={rupiah(t)}
                    selected={customTip === null && tip === t}
                    onPress={() => {
                      setCustomTip(null);
                      setTip(tip === t ? 0 : t);
                    }}
                  />
                ))}
                <Chip label="Lainnya" selected={customTip !== null} onPress={() => setCustomTip(customTip === null ? '' : null)} />
              </Row>
              {customTip !== null && <Field prefix="Rp" keyboardType="number-pad" placeholder="Jumlah tip" value={customTip} onChangeText={setCustomTip} />}
            </Card>

            <Button title="Submit Review" variant="orange" loading={busy} onPress={submit} style={{ borderRadius: 14 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}
