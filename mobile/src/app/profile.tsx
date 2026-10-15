import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/lib/alert';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Avatar, Button, Divider, Field, IconButton, Row, Screen, SelectField, Text, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { CAMPUSES } from '@/lib/constants';
import { useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Role } from '@/lib/types';

export default function ProfileScreen() {
  const { user, updateProfile, refresh, logout } = useAuth();
  const { busy, run } = useAsyncAction();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', nim: '', campus: '', about: '' });

  useFocusEffect(
    useCallback(() => {
      void refresh().catch(() => {});
    }, [refresh]),
  );

  if (!user) return null;
  const isJastiper = user.role === 'jastiper';
  const accent = isJastiper ? colors.primary : colors.orange;

  const startEdit = () => {
    setDraft({ name: user.name, nim: user.nim, campus: user.campus, about: user.about });
    setEditing(true);
  };

  const switchRole = (role: Role) => {
    if (role === user.role) return;
    run(async () => {
      await updateProfile({ role });
      router.replace('/home');
    });
  };

  const info: [IconName, string, string][] = [
    ['keypad-outline', 'NIM', user.nim],
    ['school-outline', 'Kampus', user.campus],
    ['person-outline', 'Tentang saya', user.about || '-'],
  ];

  return (
    <Screen bg={colors.white}>
      <Row style={{ paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'space-between' }}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <Text weight="bold" size={17}>
          Profil
        </Text>
        <IconButton icon="create-outline" color={colors.text} bg="transparent" onPress={startEdit} />
      </Row>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <Row style={{ gap: 16 }}>
          <Avatar name={user.name} size={72} tone={isJastiper ? 'blue' : 'orange'} />
          <View style={{ flex: 1 }}>
            <Text weight="bold" size={19}>
              {user.name}
            </Text>
            <Text size={12} color={colors.muted}>
              {user.email}
            </Text>
          </View>
          <Row style={{ backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4 }}>
            {(
              [
                ['buyer', 'Titip'],
                ['jastiper', 'Jastiper'],
              ] as const
            ).map(([role, label]) => {
              const on = user.role === role;
              return (
                <Pressable
                  key={role}
                  disabled={busy}
                  onPress={() => switchRole(role)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: on ? (role === 'buyer' ? colors.orange : colors.primary) : 'transparent' }}
                >
                  <Text weight="semibold" size={12} color={on ? colors.white : colors.textSoft}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </Row>
        </Row>

        <Divider />
        <Row>
          {isJastiper && <StatBlock value={user.stats?.trips ?? 0} label="TRIP" color={accent} />}
          {isJastiper && <View style={{ width: 1, height: 48, backgroundColor: colors.border }} />}
          <StatBlock value={user.stats?.requests ?? 0} label="REQUEST" color={accent} />
        </Row>
        {isJastiper && user.rating != null && (
          <Row style={{ justifyContent: 'center', gap: 6 }}>
            <Ionicons name="star" size={16} color={colors.star} />
            <Text weight="semibold">
              {user.rating.toFixed(1)} • {user.ratingCount} ulasan
            </Text>
          </Row>
        )}
        <Divider />

        <Row style={{ justifyContent: 'space-between' }}>
          <Text weight="bold" size={15}>
            Informasi profil
          </Text>
          {!editing && (
            <Pressable onPress={startEdit}>
              <Text weight="bold" size={13} color={accent}>
                Ubah
              </Text>
            </Pressable>
          )}
        </Row>

        {editing ? (
          <View style={{ gap: 14 }}>
            <Field label="Nama" value={draft.name} onChangeText={(name) => setDraft((d) => ({ ...d, name }))} />
            <Field label="NIM" keyboardType="number-pad" value={draft.nim} onChangeText={(nim) => setDraft((d) => ({ ...d, nim }))} />
            <SelectField label="Kampus" placeholder="Pilih kampus" value={draft.campus} options={CAMPUSES} onChange={(campus) => setDraft((d) => ({ ...d, campus }))} />
            <Field label="Tentang saya" value={draft.about} onChangeText={(about) => setDraft((d) => ({ ...d, about }))} />
            <Row style={{ gap: 10 }}>
              <Button title="Batal" variant="outline" size="md" onPress={() => setEditing(false)} style={{ flex: 1 }} />
              <Button
                title="Simpan"
                size="md"
                loading={busy}
                style={{ flex: 1 }}
                onPress={() =>
                  run(async () => {
                    await updateProfile(draft);
                    setEditing(false);
                  })
                }
              />
            </Row>
          </View>
        ) : (
          info.map(([icon, label, value]) => (
            <View key={label} style={{ gap: 12 }}>
              <Row style={{ gap: 14, alignItems: 'flex-start' }}>
                <Ionicons name={icon} size={20} color={accent} />
                <View>
                  <Text size={12} color={colors.faint}>
                    {label}
                  </Text>
                  <Text weight="bold">{value}</Text>
                </View>
              </Row>
              <Divider />
            </View>
          ))
        )}

        <Button
          title="Keluar"
          variant="outline"
          icon="log-out-outline"
          onPress={() =>
            showAlert('Keluar dari akun?', undefined, [
              { text: 'Batal', style: 'cancel' },
              {
                text: 'Keluar',
                style: 'destructive',
                onPress: async () => {
                  await logout();
                  router.replace('/auth');
                },
              },
            ])
          }
        />
      </ScrollView>
    </Screen>
  );
}

function StatBlock({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <Text weight="semibold" size={24} color={color}>
        {value}
      </Text>
      <Text size={12} color={colors.muted}>
        {label}
      </Text>
    </View>
  );
}
