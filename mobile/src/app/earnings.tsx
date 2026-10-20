import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Badge, Card, Chip, EmptyState, ErrorState, Loading, Row, Screen, ScreenHeader, Stars, Text } from '@/components/ui';
import { plain, rupiah, shortDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Earnings, EarningsBucket, EarningsPeriod, JastiperReview } from '@/lib/types';

const PERIODS: { key: EarningsPeriod; label: string; range: string }[] = [
  { key: 'day', label: 'Harian', range: '14 hari terakhir' },
  { key: 'week', label: 'Mingguan', range: '8 minggu terakhir' },
  { key: 'month', label: 'Bulanan', range: '12 bulan terakhir' },
  { key: 'year', label: 'Tahunan', range: '5 tahun terakhir' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function bucketLabel(key: string, period: EarningsPeriod) {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  if (period === 'year') return String(y);
  if (period === 'month') return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
  return `${d} ${MONTHS[m - 1]}`;
}

export default function EarningsScreen() {
  const [period, setPeriod] = useState<EarningsPeriod>('day');
  const { data, error, loading, reload } = useApi<Earnings>(`/earnings?period=${period}`);
  const reviews = useApi<JastiperReview[]>('/reviews/mine');
  const meta = PERIODS.find((p) => p.key === period)!;

  return (
    <Screen>
      <ScreenHeader title="Pendapatan & Ulasan" />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              void reload();
              void reviews.reload();
            }}
          />
        }
      >
        {!data && loading ? (
          <Loading />
        ) : error || !data ? (
          <ErrorState message={error ?? 'Gagal memuat'} onRetry={reload} />
        ) : (
          <>
            <Card style={{ gap: 6, backgroundColor: colors.primary }}>
              <Text size={12} weight="semibold" color="#DCE8F8">
                TOTAL PENDAPATAN SEJAK JADI JASTIPER
              </Text>
              <Text weight="extrabold" size={28} color={colors.white}>
                {rupiah(data.allTime.total)}
              </Text>
              <Row style={{ gap: 16, flexWrap: 'wrap' }}>
                <Text size={12} color="#DCE8F8">
                  Fee jasa {rupiah(data.allTime.fee)}
                </Text>
                <Text size={12} color="#DCE8F8">
                  Tip {rupiah(data.allTime.tip)}
                </Text>
                <Text size={12} color="#DCE8F8">
                  {data.allTime.orders} pesanan selesai
                </Text>
              </Row>
            </Card>

            {data.pendingFee > 0 && (
              <Row style={{ gap: 8, backgroundColor: colors.amberSoft, borderRadius: radius.sm, padding: 12 }}>
                <Ionicons name="time-outline" size={16} color={colors.amber} />
                <Text size={12} color={colors.amber} style={{ flex: 1 }}>
                  {rupiah(data.pendingFee)} fee masih menunggu serah terima pesanan yang sedang berjalan.
                </Text>
              </Row>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {PERIODS.map((p) => (
                <Chip key={p.key} label={p.label} tone="blue" selected={period === p.key} onPress={() => setPeriod(p.key)} />
              ))}
            </ScrollView>

            <Card style={{ gap: 14 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text weight="bold" size={15}>
                  {meta.label}
                </Text>
                <Text size={12} color={colors.muted}>
                  {meta.range}
                </Text>
              </Row>
              <Row style={{ gap: 10 }}>
                <Stat label="Total" value={rupiah(data.range.total)} accent />
                <Stat label="Fee jasa" value={rupiah(data.range.fee)} />
                <Stat label="Tip / donasi" value={rupiah(data.range.tip)} />
              </Row>
              <Chart series={data.series} period={period} />
              <Row style={{ gap: 14 }}>
                <Legend color={colors.primary} label="Fee jasa" />
                <Legend color={colors.orange} label="Tip dari buyer" />
              </Row>
            </Card>

            <Card style={{ gap: 0, paddingVertical: 8 }}>
              {[...data.series].reverse().map((b) => (
                <Row key={b.key} style={{ justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View>
                    <Text weight="semibold" size={13}>
                      {bucketLabel(b.key, period)}
                    </Text>
                    <Text size={11} color={colors.muted}>
                      {b.orders} pesanan • tip {rupiah(b.tip)}
                    </Text>
                  </View>
                  <Text weight="bold" size={14} color={b.total ? colors.primary : colors.faint}>
                    {rupiah(b.total)}
                  </Text>
                </Row>
              ))}
            </Card>
          </>
        )}

        <Text weight="extrabold" size={17}>
          Ulasan & Tip dari Buyer
        </Text>
        {reviews.data?.length ? (
          reviews.data.map((r) => <ReviewCard key={r.orderId} review={r} />)
        ) : (
          <EmptyState icon="chatbubbles-outline" title="Belum ada ulasan" body="Ulasan dan tip dari buyer akan muncul di sini setelah pesanan selesai." />
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: accent ? colors.primarySoft : colors.surface, borderRadius: radius.sm, padding: 10, gap: 2 }}>
      <Text size={10} color={colors.muted}>
        {label}
      </Text>
      <Text weight="bold" size={12} color={accent ? colors.primary : colors.text}>
        {value}
      </Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row style={{ gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text size={11} color={colors.muted}>
        {label}
      </Text>
    </Row>
  );
}

const CHART_HEIGHT = 120;

function Chart({ series, period }: { series: EarningsBucket[]; period: EarningsPeriod }) {
  const max = Math.max(1, ...series.map((b) => b.total));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT + 22, gap: 3 }}>
      {series.map((b, i) => {
        const feeH = (b.fee / max) * CHART_HEIGHT;
        const tipH = (b.tip / max) * CHART_HEIGHT;
        const showLabel = series.length <= 8 || (series.length - 1 - i) % 2 === 0;
        return (
          <View key={b.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_HEIGHT + 22 }}>
            <View style={{ width: '70%', minHeight: 2, justifyContent: 'flex-end' }}>
              {tipH > 0 && <View style={{ height: tipH, backgroundColor: colors.orange, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />}
              <View style={{ height: Math.max(feeH, b.total ? 0 : 2), backgroundColor: b.fee ? colors.primary : colors.primaryTint, borderTopLeftRadius: tipH ? 0 : 4, borderTopRightRadius: tipH ? 0 : 4 }} />
            </View>
            <Text size={8} color={colors.muted} numberOfLines={1} style={{ marginTop: 4, height: 14, opacity: showLabel ? 1 : 0 }}>
              {period === 'day' ? String(Number(b.key.slice(8))) : bucketLabel(b.key, period).split(' ')[0]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ReviewCard({ review }: { review: JastiperReview }) {
  return (
    <Card style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text weight="bold">{review.buyerName}</Text>
          <Text size={11} color={colors.muted}>
            #{review.code} • {review.productName}
          </Text>
        </View>
        <Stars value={review.rating} size={14} />
      </Row>
      {review.text ? <Text size={13} color={colors.textSoft}>“{review.text}”</Text> : null}
      {review.tags.length > 0 && (
        <Row style={{ gap: 6, flexWrap: 'wrap' }}>
          {review.tags.map((t) => (
            <Badge key={t} label={t} tone="gray" />
          ))}
        </Row>
      )}
      <Row style={{ justifyContent: 'space-between' }}>
        <Text size={11} color={colors.faint}>
          {shortDateTime(review.createdAt)}
        </Text>
        {review.tip > 0 ? <Badge label={`Tip Rp ${plain(review.tip)}`} tone="orange" icon="gift-outline" /> : <Text size={11} color={colors.faint}>Tanpa tip</Text>}
      </Row>
    </Card>
  );
}
