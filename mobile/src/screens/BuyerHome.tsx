import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { AppTopBar, DestinationBanner, ratingText } from '@/components/app';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Loading, Row, Screen, Text, type IconName } from '@/components/ui';
import { POPULAR_COUNTRIES } from '@/lib/constants';
import { departLabel, tripTitle } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { colors, fonts, radius } from '@/lib/theme';
import type { Trip } from '@/lib/types';

export function BuyerHome() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const path = `/trips?q=${encodeURIComponent(query)}&country=${encodeURIComponent(country)}`;
  const { data: trips, error, loading, reload } = useApi<Trip[]>(path);

  return (
    <Screen>
      <AppTopBar />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={[colors.primary, '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.lg, padding: 18, gap: 10, overflow: 'hidden' }}>
          <Ionicons name="briefcase-outline" size={90} color="#FFFFFF1A" style={{ position: 'absolute', right: -8, bottom: -10 }} />
          <Badge label="100% Binusian Escrow Guaranteed" tone="green" icon="shield-checkmark" />
          <Text weight="extrabold" size={21} color={colors.white} style={{ lineHeight: 28 }}>
            Mau titip apa hari ini dari luar negeri?
          </Text>
          <Text size={13} color="#DCE8F8" style={{ lineHeight: 20 }}>
            Belanja aman lewat teman satu kampus. Biaya transparan, dana tertahan di rekening bersama kampus sampai pesanan tiba.
          </Text>
        </LinearGradient>

        <Row style={{ gap: 10 }}>
          <Row style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 16, height: 48, gap: 10 }}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Mau cari apa hari ini?"
              placeholderTextColor={colors.faint}
              style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.text }}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.faint} />
              </Pressable>
            ) : null}
          </Row>
        </Row>

        <View style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text weight="bold" size={15}>
              Destinasi Populer
            </Text>
            <Pressable onPress={() => setCountry('')}>
              <Text weight="semibold" size={13} color={colors.orangeText}>
                Lihat Semua
              </Text>
            </Pressable>
          </Row>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {POPULAR_COUNTRIES.map((c) => (
              <Chip key={c} label={c} icon="location-outline" selected={country === c} onPress={() => setCountry(country === c ? '' : c)} />
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : trips?.length ? (
          trips.map((t) => <TripCard key={t.id} trip={t} />)
        ) : (
          <EmptyState icon="airplane-outline" title="Belum ada trip" body="Belum ada jastiper ke destinasi ini. Coba buat request titipan." />
        )}

        <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 16, gap: 12 }}>
          <Row style={{ gap: 12, alignItems: 'flex-start' }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="document-text-outline" size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold" size={15}>
                Tidak menemukan rute yang pas?
              </Text>
              <Text size={12} color={colors.textSoft}>
                Tulis wishlist belanjaanmu, biarkan jastiper yang sedang bepergian menghubungimu langsung.
              </Text>
            </View>
          </Row>
          <Button title="Buat Request Titipan Baru" variant="orange" icon="add-circle-outline" onPress={() => router.push('/request/new')} />
        </View>

        <View style={{ gap: 10 }}>
          <Text weight="bold" size={15}>
            Cara Kerja Titibin Escrow
          </Text>
          <Row style={{ gap: 8, alignItems: 'stretch' }}>
            {(
              [
                ['checkmark-done-outline', '1. Request', 'Pilih trip & rincian pesanan'],
                ['wallet-outline', '2. Escrow', 'Dana aman tertahan di kampus'],
                ['qr-code-outline', '3. Serah Terima', 'Scan QR di Binus & dana cair'],
              ] as [IconName, string, string][]
            ).map(([icon, title, body]) => (
              <Card key={title} style={{ flex: 1, padding: 12, alignItems: 'center', gap: 6 }}>
                <Ionicons name={icon} size={22} color={colors.orange} />
                <Text weight="bold" size={12}>
                  {title}
                </Text>
                <Text size={11} color={colors.muted} style={{ textAlign: 'center' }}>
                  {body}
                </Text>
              </Card>
            ))}
          </Row>
        </View>
      </ScrollView>
    </Screen>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const label = departLabel(trip.departDate, trip.returnDate);
  return (
    <Card style={{ gap: 14 }}>
      <Row style={{ gap: 12, alignItems: 'flex-start' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="airplane" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Row style={{ justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <Text weight="bold" size={17} style={{ flexShrink: 1 }}>
              {trip.origin} →
            </Text>
            <Badge label={label} tone={label === 'Hari ini' ? 'orange' : 'blue'} />
          </Row>
          <Text weight="extrabold" size={19} color={colors.primary}>
            {tripTitle(trip.destination, trip.country)}
          </Text>
          <Text size={12} color={colors.muted}>
            Drop point: {trip.dropPoint}
          </Text>
        </View>
      </Row>
      <DestinationBanner country={trip.country} stores={trip.stores} photo={trip.catalogPhoto} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
          </View>
          <View>
            <Row style={{ gap: 4 }}>
              <Text weight="bold" size={13}>
                {trip.jastiper.name}
              </Text>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
            </Row>
            <Text size={11} color={colors.muted}>
              {ratingText(trip.jastiper.rating, trip.jastiper.ratingCount, 'titipan')}
            </Text>
          </View>
        </Row>
        <Row style={{ gap: 6 }}>
          <Badge label={`Sisa: ${trip.remainingKg} kg`} tone="gray" icon="bag-outline" />
          {trip.slotsLeft != null && <Badge label={`${trip.slotsLeft} slot`} tone="orange" />}
        </Row>
      </Row>
      <Button
        title="Titip Barang"
        variant="orange"
        icon="cart-outline"
        disabled={trip.remainingKg <= 0 || trip.slotsLeft === 0}
        onPress={() => router.push({ pathname: '/request/new', params: { tripId: String(trip.id) } })}
      />
    </Card>
  );
}
