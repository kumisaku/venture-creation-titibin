import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, View } from 'react-native';
import { fileUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { rupiah, STATUS_META } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { Order, OrderStatus } from '@/lib/types';
import { Avatar, Badge, Divider, Logo, Row, Text } from './ui';

export function AppTopBar({ greeting = true }: { greeting?: boolean }) {
  const { user } = useAuth();
  return (
    <Row style={{ paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'space-between' }}>
      <Row style={{ gap: 10 }}>
        <Logo size={30} />
        <Text weight="extrabold" size={19} color={colors.primary}>
          TitiBin
        </Text>
      </Row>
      <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
        <Row style={{ gap: 10 }}>
          {greeting && user && (
            <Text weight="semibold" size={13} color={colors.textSoft}>
              Halo, {user.name.split(' ')[0]}
            </Text>
          )}
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person-outline" size={19} color={colors.primary} />
          </View>
        </Row>
      </Pressable>
    </Row>
  );
}

// Destination artwork stand-in: a gradient tinted per country.
const GRADIENTS: Record<string, [string, string]> = {
  Jepang: ['#1E1B4B', '#BE185D'],
  Malaysia: ['#0F172A', '#1D4ED8'],
  Singapura: ['#134E4A', '#0EA5E9'],
};

export function DestinationBanner({ country, stores, photo }: { country: string; stores: string; photo?: string | null }) {
  const [from, to] = GRADIENTS[country] ?? ['#0B4F9C', '#F97316'];
  return (
    <View style={{ height: 128, borderRadius: radius.md, overflow: 'hidden' }}>
      {photo ? (
        <Image source={{ uri: fileUrl(photo) }} style={{ position: 'absolute', width: '100%', height: '100%' }} />
      ) : (
        <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }}>
          <Ionicons name="business" size={110} color="#FFFFFF22" style={{ position: 'absolute', right: -6, bottom: -18 }} />
          <Ionicons name="airplane" size={34} color="#FFFFFF55" style={{ position: 'absolute', left: 16, top: 14 }} />
        </LinearGradient>
      )}
      <LinearGradient colors={['transparent', '#000A']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, paddingTop: 30 }}>
        <Row style={{ gap: 6, alignItems: 'flex-start' }}>
          <Ionicons name="bag-handle-outline" size={13} color={colors.white} style={{ marginTop: 1 }} />
          <Text weight="semibold" size={11} color={colors.white} style={{ flex: 1 }} numberOfLines={2}>
            Target belanja: {stores || '-'}
          </Text>
        </Row>
      </LinearGradient>
    </View>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  const tone = { pending: 'amber', accepted: 'green', rejected: 'red', done: 'blue' } as const;
  const icon = { pending: 'time-outline', accepted: 'checkmark-circle-outline', rejected: 'close-circle-outline', done: 'ribbon-outline' } as const;
  return <Badge label={meta.label} tone={tone[meta.tone]} icon={icon[meta.tone]} />;
}

export function SegmentProgress({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <Row style={{ gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 5,
            borderRadius: 3,
            backgroundColor: i < step - 1 ? colors.primary : i === step - 1 ? colors.orange : colors.primaryTint,
          }}
        />
      ))}
    </Row>
  );
}

export function ProductThumb({ photo, size = 56 }: { photo?: string | null; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {photo ? (
        <Image source={{ uri: fileUrl(photo) }} style={{ width: size, height: size }} />
      ) : (
        <Ionicons name="bag-handle-outline" size={size * 0.45} color={colors.primary} />
      )}
    </View>
  );
}

export function CostSummary({ order, title = 'Ringkasan Biaya' }: { order: Pick<Order, 'itemPrice' | 'jastipFee' | 'appFee' | 'quantity'>; title?: string }) {
  const rows: [string, number][] = [
    [`Harga Barang (${order.quantity}x)`, order.itemPrice],
    ['Fee Jastiper (20%)', order.jastipFee],
    ['Fee Aplikasi (10%)', order.appFee],
  ];
  return (
    <View style={{ gap: 10 }}>
      <Text weight="bold">{title}</Text>
      {rows.map(([label, value]) => (
        <Row key={label} style={{ justifyContent: 'space-between' }}>
          <Text size={13} color={colors.muted}>
            {label}
          </Text>
          <Text weight="semibold" size={13}>
            {rupiah(value)}
          </Text>
        </Row>
      ))}
      <Divider />
      <Row style={{ justifyContent: 'space-between' }}>
        <Text weight="bold">Total</Text>
        <Text weight="extrabold" size={16} color={colors.primary}>
          {rupiah(order.itemPrice + order.jastipFee + order.appFee)}
        </Text>
      </Row>
    </View>
  );
}

export function PersonRow({ name, subtitle, size = 34 }: { name: string; subtitle?: string; size?: number }) {
  return (
    <Row style={{ gap: 10 }}>
      <Avatar name={name} size={size} />
      <View>
        <Text weight="bold" size={13}>
          {name}
        </Text>
        {subtitle && (
          <Text size={11} color={colors.muted}>
            {subtitle}
          </Text>
        )}
      </View>
    </Row>
  );
}

export const ratingText = (rating: number | null, count: number, unit: string) =>
  rating ? `★ ${rating.toFixed(1)} (${count} ${unit})` : 'Jastiper baru';
