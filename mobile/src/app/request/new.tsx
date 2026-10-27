import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/lib/alert';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { TripCapacity } from '@/components/app';
import { Button, Card, Field, MoneyField, MultiPhotoPicker, Row, Screen, ScreenHeader, SelectField, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { APP_FEE_RATE, HANDOVER_POINTS, JASTIP_FEE_RATE } from '@/lib/constants';
import { plain, rupiah, tripTitle } from '@/lib/format';
import { useApi, useAsyncAction, type PickedImage } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Order, Trip } from '@/lib/types';

type Params = {
  tripId?: string;
  productName?: string;
  quantity?: string;
  purchaseLocation?: string;
  store?: string;
  weightKg?: string;
  unitPrice?: string;
};

const tripOption = (t: Trip) =>
  `${t.jastiper.name} • ${tripTitle(t.destination, t.country)} (sisa ${t.remainingKg} kg${
    t.remainingBudget != null ? `, budget ${rupiah(t.remainingBudget)}` : ''
  })`;

export default function ItemRequestScreen() {
  const params = useLocalSearchParams<Params>();
  const { data: trips } = useApi<Trip[]>('/trips');
  const { busy, run } = useAsyncAction();

  const [tripId, setTripId] = useState<number | null>(params.tripId ? Number(params.tripId) : null);
  const [productName, setProductName] = useState(params.productName ?? '');
  const [quantity, setQuantity] = useState(Number(params.quantity) || 1);
  const [location, setLocation] = useState(params.purchaseLocation ?? '');
  const [store, setStore] = useState(params.store ?? '');
  const [weight, setWeight] = useState(params.weightKg ?? '');
  const [price, setPrice] = useState(params.unitPrice ?? '');
  const [photos, setPhotos] = useState<PickedImage[]>([]);
  const [handover, setHandover] = useState('');

  const trip = trips?.find((t) => t.id === tripId) ?? null;

  // Prefill from the chosen trip.
  useEffect(() => {
    if (!trip) return;
    setLocation((l) => l || tripTitle(trip.destination, trip.country));
    setHandover((h) => h || trip.dropPoint);
  }, [trip]);

  // The price field holds the price of ONE item; everything below is multiplied by the quantity.
  const unitPrice = Number(price) || 0;
  const subtotal = unitPrice * quantity;
  const jastipFee = Math.round(subtotal * JASTIP_FEE_RATE);
  const appFee = Math.round(subtotal * APP_FEE_RATE);
  const total = subtotal + jastipFee + appFee;
  const overBudget = Boolean(trip?.maxBudget) && subtotal > (trip?.remainingBudget ?? 0);

  const submit = () =>
    run(async () => {
      if (!tripId) throw new Error('Pilih trip jastiper terlebih dahulu');
      const w = Number(weight.replace(',', '.'));
      if (trip && w > trip.remainingKg) throw new Error(`Sisa bagasi jastiper hanya ${trip.remainingKg} kg`);
      if (overBudget && trip && !trip.holdOverBudget) {
        throw new Error(`Sisa budget jastiper hanya ${rupiah(trip.remainingBudget ?? 0)}. Kurangi jumlah atau harga barang.`);
      }
      const order = await api<Order>('/orders', {
        body: {
          tripId,
          productName,
          quantity,
          purchaseLocation: location,
          store,
          weightKg: w,
          unitPrice,
          handoverPoint: handover,
          photos: photos.map((p) => p.dataUrl),
        },
      });
      if (order.status === 'negotiation') {
        showAlert('Request masuk negosiasi', `Pesanan #${order.code} melebihi budget jastiper, jadi ditahan sampai jastiper memutuskan.`);
      } else {
        showAlert('Request terkirim', `Pesanan #${order.code} sedang ditinjau jastiper.`);
      }
      router.replace('/orders');
    });

  const handoverOptions = trip && !HANDOVER_POINTS.includes(trip.dropPoint) ? [trip.dropPoint, ...HANDOVER_POINTS] : HANDOVER_POINTS;

  return (
    <Screen>
      <ScreenHeader title="Item Request" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Card style={{ gap: 14 }}>
            <Text weight="bold" size={16}>
              Pilih Trip Jastiper
            </Text>
            <SelectField
              placeholder="Pilih trip yang sesuai"
              icon="airplane-outline"
              value={trip ? tripOption(trip) : ''}
              options={(trips ?? []).map(tripOption)}
              onChange={(label) => setTripId(trips?.find((t) => tripOption(t) === label)?.id ?? null)}
            />
            {trip && (
              <>
                <Text size={12} color={colors.muted}>
                  Target belanja: {trip.stores || '-'}
                </Text>
                <TripCapacity trip={trip} />
              </>
            )}
          </Card>

          <Card style={{ gap: 14 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text weight="bold" size={18}>
                Informasi Barang
              </Text>
              <Text weight="bold" size={10} color={colors.orangeText}>
                *WAJIB DIISI
              </Text>
            </Row>
            <Field
              label="Nama Produk"
              required
              rightLabel="Maks. 80 Karakter"
              placeholder="cth. Blindbox Pop Mart"
              maxLength={80}
              value={productName}
              onChangeText={setProductName}
            />
            <View style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text weight="semibold" size={13}>
                  Kuantitas (Jumlah)<Text color={colors.red}> *</Text>
                </Text>
                <Text size={11} color={colors.muted}>
                  Satuan: Pcs
                </Text>
              </Row>
              <Row style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 6, justifyContent: 'space-between' }}>
                <Stepper icon="remove" onPress={() => setQuantity((q) => Math.max(1, q - 1))} />
                <Text weight="bold" size={18}>
                  {quantity} <Text size={12}>pcs</Text>
                </Text>
                <Stepper icon="add" onPress={() => setQuantity((q) => Math.min(99, q + 1))} />
              </Row>
            </View>
            <Field label="Lokasi Pembelian / Kota Asal" required placeholder="cth. Bandung" value={location} onChangeText={setLocation} />
            <Field
              label="Nama Toko Cabang / Area Spesifik"
              rightLabel="Detail lokasi"
              placeholder="cth. Pop Mart Shibuya Parco"
              hint="Sebutkan nama mall, cabang, atau booth event jika spesifik."
              value={store}
              onChangeText={setStore}
            />
            <Field
              label="Estimasi Berat Barang (total)"
              required
              placeholder="0.4"
              keyboardType="decimal-pad"
              suffix="kg"
              value={weight}
              onChangeText={setWeight}
            />
          </Card>

          <Card style={{ gap: 14 }}>
            <Text weight="bold" size={18}>
              Foto Referensi Produk
            </Text>
            <MultiPhotoPicker value={photos} onChange={setPhotos} max={5} />
          </Card>

          <Card style={{ gap: 14 }}>
            <Text weight="bold" size={18}>
              Estimasi Biaya & Fee Jastip
            </Text>
            <MoneyField
              label="Estimasi Harga Barang Asli (per item)"
              required
              rightLabel="Konversi IDR"
              placeholder="0"
              hint={quantity > 1 ? `Dikali ${quantity} pcs = ${rupiah(subtotal)}` : undefined}
              value={price}
              onChangeValue={setPrice}
              inputStyle={{ fontSize: 18 }}
            />
            <Field label="Fee Jastip (20%)" prefix="Rp" editable={false} value={plain(jastipFee)} inputStyle={{ fontSize: 18 }} />
            <Field label="Fee Aplikasi (10%)" prefix="Rp" editable={false} value={plain(appFee)} inputStyle={{ fontSize: 18 }} />
          </Card>

          <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 16, gap: 10 }}>
            <Text weight="bold" size={15}>
              Ringkasan Estimasi Biaya
            </Text>
            {(
              [
                [quantity > 1 ? `Harga Barang (${quantity} x ${plain(unitPrice)})` : 'Harga Barang', subtotal],
                ['Fee Traveler (Jastip)', jastipFee],
                ['Fee Aplikasi', appFee],
              ] as const
            ).map(([label, value]) => (
              <Row key={label} style={{ justifyContent: 'space-between' }}>
                <Text size={13} color={colors.muted}>
                  {label}
                </Text>
                <Text weight="semibold" size={13}>
                  {rupiah(value)}
                </Text>
              </Row>
            ))}
            <View style={{ height: 1, backgroundColor: colors.primaryTint, marginVertical: 4 }} />
            <Text weight="bold" size={11} color={colors.muted}>
              TOTAL ESTIMASI BUDGET
            </Text>
            <Text weight="extrabold" size={24} color={colors.orangeText}>
              {rupiah(total)}
            </Text>
            {overBudget && trip?.holdOverBudget && (
              <View style={{ backgroundColor: colors.amberSoft, borderRadius: radius.sm, padding: 12, gap: 4 }}>
                <Text weight="bold" size={12} color={colors.amber}>
                  Melebihi sisa budget jastiper
                </Text>
                <Text size={12} color={colors.amber}>
                  Request akan masuk status Negosiasi sampai jastiper menambah modal atau menolaknya.
                </Text>
              </View>
            )}
            {overBudget && trip && !trip.holdOverBudget && (
              <View style={{ backgroundColor: colors.redSoft, borderRadius: radius.sm, padding: 12, gap: 4 }}>
                <Text weight="bold" size={12} color={colors.red}>
                  Melebihi sisa budget jastiper
                </Text>
                <Text size={12} color={colors.red}>
                  Sisa budget hanya {rupiah(trip.remainingBudget ?? 0)}. Kurangi jumlah atau harga barang.
                </Text>
              </View>
            )}
            <View style={{ backgroundColor: colors.white, borderRadius: radius.sm, padding: 12, gap: 4 }}>
              <Text weight="bold" size={12}>
                Bayar setelah invoice
              </Text>
              <Text size={12} color={colors.textSoft}>
                Kamu belum perlu membayar sekarang. Jastiper membelikan dulu, lalu mengunggah invoice dan QR pembayaran — baru setelah itu kamu membayar.
              </Text>
            </View>
          </View>

          <Card style={{ gap: 12 }}>
            <SelectField
              label="Rencana Serah Terima di Kampus"
              required
              placeholder="Pilih titik serah terima"
              value={handover}
              options={handoverOptions}
              onChange={setHandover}
            />
          </Card>

          <Button title="Simpan & Ajukan Titipan" variant="orange" loading={busy} onPress={submit} />
          <Text size={12} color={colors.muted} style={{ textAlign: 'center' }}>
            Dengan mengajukan, kamu setuju dengan aturan keamanan komunitas TitiBin BINUS.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Stepper({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}
