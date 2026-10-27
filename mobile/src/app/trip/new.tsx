import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/lib/alert';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Checkbox, Chip, DateField, Field, MoneyField, Row, Screen, ScreenHeader, Text, UploadBox } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORIES, REGIONS } from '@/lib/constants';
import { rupiah, todayIso } from '@/lib/format';
import { useAsyncAction, type PickedImage } from '@/lib/hooks';
import { colors, radius, shadow } from '@/lib/theme';
import type { Trip } from '@/lib/types';

export default function CreateTripScreen() {
  const { user } = useAuth();
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({
    origin: user?.campus ?? '',
    region: '',
    destination: '',
    eventName: '',
    stores: '',
    depart: '',
    ret: '',
    capacity: '',
    maxBudget: '',
  });
  const [kind, setKind] = useState<'trip' | 'event'>('trip');
  const [categories, setCategories] = useState<string[]>([]);
  const [holdOverBudget, setHoldOverBudget] = useState(true);
  const [catalog, setCatalog] = useState<PickedImage | null>(null);
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const filled = [form.origin, form.region, form.destination, kind === 'event' ? form.eventName : 'x', form.stores, form.depart, form.ret, form.capacity, categories.length ? 'x' : '', form.maxBudget].filter(Boolean).length;

  const submit = () =>
    run(async () => {
      if (!form.depart || !form.ret) throw new Error('Pilih tanggal mulai dan selesai');
      if (!form.region) throw new Error('Pilih daerah tujuan');
      if (kind === 'event' && !form.eventName.trim()) throw new Error('Isi nama event');
      const trip = await api<Trip>('/trips', {
        body: {
          kind,
          region: form.region,
          eventName: form.eventName,
          origin: form.origin,
          destination: form.destination,
          stores: form.stores,
          departDate: form.depart,
          returnDate: form.ret,
          capacityKg: Number(form.capacity.replace(',', '.')),
          categories,
          maxBudget: Number(form.maxBudget) || null,
          holdOverBudget: holdOverBudget && Number(form.maxBudget) > 0,
          dropPoint: `Kampus ${form.origin}`,
          catalogPhoto: catalog?.dataUrl,
        },
      });
      showAlert('Trip dibuat!', `${trip.origin} → ${trip.destination} sudah tampil untuk buyer.`);
      router.replace('/home');
    });

  return (
    <Screen bg={colors.white}>
      <ScreenHeader title="Create Trip" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surface }}>
            <View style={{ width: `${(filled / 10) * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
          </View>
          <Text size={12} color={colors.muted}>
            Bagikan detail perjalananmu kepada Buyer.
          </Text>

          <Field label="Asal kampus / kota" placeholder="Contoh: Kemanggisan" value={form.origin} onChangeText={set('origin')} />
          <Row style={{ gap: 8 }}>
            <Chip label="Trip biasa" icon="cart-outline" selected={kind === 'trip'} onPress={() => setKind('trip')} />
            <Chip label="Event" icon="ticket-outline" selected={kind === 'event'} onPress={() => setKind('event')} />
          </Row>
          {kind === 'event' && (
            <Field label="Nama event" placeholder="Contoh: Pekan Raya Jakarta" value={form.eventName} onChangeText={set('eventName')} />
          )}
          <Text weight="semibold" size={13}>
            Daerah
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {REGIONS.map((r) => (
              <Chip key={r} label={r} icon="location-outline" selected={form.region === r} onPress={() => set('region')(r)} />
            ))}
          </View>
          <Field
            label={kind === 'event' ? 'Lokasi event' : 'Tempat tujuan'}
            placeholder={kind === 'event' ? 'Contoh: JIEXPO Kemayoran' : 'Contoh: Pasar Baru, Dago'}
            value={form.destination}
            onChangeText={set('destination')}
          />
          <Field label="Toko yang akan dikunjungi" placeholder="Contoh: Toko A, Toko B" value={form.stores} onChangeText={set('stores')} />
          <Row style={{ gap: 12 }}>
            <DateField
              label={kind === 'event' ? 'Mulai' : 'Berangkat'}
              value={form.depart}
              min={todayIso()}
              onChange={(v) => setForm((f) => ({ ...f, depart: v, ret: f.ret && f.ret < v ? '' : f.ret }))}
              style={{ flex: 1 }}
            />
            <DateField label={kind === 'event' ? 'Selesai' : 'Kembali'} value={form.ret} min={form.depart || todayIso()} onChange={set('ret')} style={{ flex: 1 }} />
          </Row>

          <Text weight="semibold" size={13}>
            Katalog Produk
          </Text>
          <UploadBox value={catalog} onChange={setCatalog} />

          <Field label="Kapasitas tersedia (kg)" placeholder="Contoh: 5" keyboardType="decimal-pad" value={form.capacity} onChangeText={set('capacity')} />

          <Row style={{ justifyContent: 'space-between' }}>
            <Text weight="semibold" size={13}>
              Kategori barang
            </Text>
            <Text size={10} color={colors.muted}>
              Pilih minimal 1
            </Text>
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12, borderRadius: radius.lg, backgroundColor: colors.white, ...shadow }}>
            {CATEGORIES.map((c) => {
              const on = categories.includes(c.key);
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setCategories((cs) => (on ? cs.filter((k) => k !== c.key) : [...cs, c.key]))}
                  style={{
                    width: '48%',
                    flexGrow: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    padding: 10,
                    borderRadius: radius.sm,
                    backgroundColor: on ? colors.primaryTint : colors.primarySoft,
                  }}
                >
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={20} color={on ? colors.primary : colors.muted} />
                  <Ionicons name={c.icon} size={18} color={colors.primary} />
                  <Text weight="medium" size={12} style={{ flex: 1 }}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <MoneyField
            label="Max Budget"
            placeholder="Contoh: 500.000"
            hint="Batas total dana yang kamu siapkan untuk membeli titipan semua buyer."
            value={form.maxBudget}
            onChangeValue={set('maxBudget')}
          />
          {Number(form.maxBudget) > 0 && (
            <View style={{ gap: 8, padding: 14, borderRadius: radius.md, backgroundColor: colors.primarySoft }}>
              <Checkbox
                checked={holdOverBudget}
                onPress={() => setHoldOverBudget((h) => !h)}
                label={
                  <Text weight="semibold" size={13} style={{ flex: 1 }}>
                    Tahan request yang melebihi budget ke status Negosiasi
                  </Text>
                }
              />
              <Text size={12} color={colors.textSoft} style={{ lineHeight: 18 }}>
                {holdOverBudget
                  ? `Request di atas sisa budget (total ${rupiah(Number(form.maxBudget))}) tidak langsung ditolak. Kamu bisa menambah modal atau menolaknya selama bagasi masih tersedia.`
                  : 'Request yang melebihi sisa budget akan otomatis ditolak, sama seperti request yang melebihi bagasi.'}
              </Text>
            </View>
          )}

          <Button title="CREATE TRIP" iconRight="arrow-forward" loading={busy} onPress={submit} style={{ borderRadius: radius.md, marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
