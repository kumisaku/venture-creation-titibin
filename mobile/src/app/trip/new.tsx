import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/lib/alert';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Field, Row, Screen, ScreenHeader, Text, UploadBox } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORIES } from '@/lib/constants';
import { maskDate, toIsoDate } from '@/lib/format';
import { useAsyncAction, type PickedImage } from '@/lib/hooks';
import { colors, radius, shadow } from '@/lib/theme';
import type { Trip } from '@/lib/types';

export default function CreateTripScreen() {
  const { user } = useAuth();
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({
    origin: user?.campus ?? '',
    destination: '',
    stores: '',
    depart: '',
    ret: '',
    capacity: '',
    maxBudget: '',
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<PickedImage | null>(null);
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const filled = [form.origin, form.destination, form.stores, form.depart, form.ret, form.capacity, categories.length ? 'x' : '', form.maxBudget].filter(Boolean).length;

  const submit = () =>
    run(async () => {
      const departDate = toIsoDate(form.depart);
      const returnDate = toIsoDate(form.ret);
      if (!departDate || !returnDate) throw new Error('Isi tanggal dengan format dd/mm/yyyy');
      if (!form.destination.includes(',')) throw new Error('Tulis tujuan sebagai "Kota, Negara", cth. Tokyo, Jepang');
      const trip = await api<Trip>('/trips', {
        body: {
          origin: form.origin,
          destination: form.destination,
          stores: form.stores,
          departDate,
          returnDate,
          capacityKg: Number(form.capacity.replace(',', '.')),
          categories,
          maxBudget: Number(form.maxBudget.replace(/\D/g, '')) || null,
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
            <View style={{ width: `${(filled / 8) * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
          </View>
          <Text size={12} color={colors.muted}>
            Bagikan detail perjalananmu kepada Buyer.
          </Text>

          <Field label="Asal kampus / kota" placeholder="Contoh: Kemanggisan" value={form.origin} onChangeText={set('origin')} />
          <Field label="Negara / kota tujuan" placeholder="Contoh: Tokyo, Jepang" value={form.destination} onChangeText={set('destination')} />
          <Field label="Toko yang akan dikunjungi" placeholder="Contoh: Toko A, Toko B" value={form.stores} onChangeText={set('stores')} />
          <Row style={{ gap: 12 }}>
            <Field
              label="Berangkat"
              placeholder="dd/mm/yyyy"
              keyboardType="number-pad"
              value={form.depart}
              onChangeText={(v) => set('depart')(maskDate(v))}
              style={{ flex: 1 }}
            />
            <Field
              label="Kembali"
              placeholder="dd/mm/yyyy"
              keyboardType="number-pad"
              value={form.ret}
              onChangeText={(v) => set('ret')(maskDate(v))}
              style={{ flex: 1 }}
            />
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

          <Field label="Max Budget" prefix="Rp" placeholder="Contoh: 50000" keyboardType="number-pad" value={form.maxBudget} onChangeText={set('maxBudget')} />

          <Button title="CREATE TRIP" iconRight="arrow-forward" loading={busy} onPress={submit} style={{ borderRadius: radius.md, marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
