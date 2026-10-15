import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Screen, ScreenHeader, Text, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';
import type { Role } from '@/lib/types';

const ROLES: { role: Role; title: string; body: string; icon: IconName; tint: string; bg: string }[] = [
  { role: 'buyer', title: 'Buyer', body: 'Cari perjalanan, titip barang, dan pantau pesanan.', icon: 'bag-handle-outline', tint: colors.primary, bg: colors.primarySoft },
  { role: 'jastiper', title: 'Jastiper', body: 'Umumkan trip, terima titipan, dan kelola pesanan.', icon: 'compass-outline', tint: colors.orange, bg: colors.orangeSoft },
];

export default function SelectRoleScreen() {
  const { updateProfile } = useAuth();
  const { busy, run } = useAsyncAction();

  return (
    <Screen bg={colors.white} edges={['top', 'bottom']}>
      <ScreenHeader title="Pilih peran" />
      <View style={{ flex: 1, padding: 24, gap: 14 }}>
        <Text weight="bold" size={12} color={colors.orange}>
          SELAMAT DATANG DI TITIBIN
        </Text>
        <Text weight="extrabold" size={28} style={{ lineHeight: 36 }}>
          Kamu ingin mulai sebagai siapa?
        </Text>
        <Text color={colors.muted}>Pilih pengalaman yang ingin kamu jelajahi.</Text>
        <View style={{ gap: 16, marginTop: 20 }}>
          {ROLES.map((r) => (
            <Pressable
              key={r.role}
              disabled={busy}
              onPress={() =>
                run(async () => {
                  await updateProfile({ role: r.role });
                  router.replace('/home');
                })
              }
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                padding: 20,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: pressed ? colors.bg : colors.white,
              })}
            >
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: r.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={r.icon} size={22} color={r.tint} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text weight="bold" size={16}>
                  {r.title}
                </Text>
                <Text size={13} color={colors.muted} style={{ lineHeight: 19 }}>
                  {r.body}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          ))}
        </View>
      </View>
      <Text size={12} color={colors.muted} style={{ textAlign: 'center', padding: 20 }}>
        Kamu bisa berganti peran melalui halaman Profil.
      </Text>
    </Screen>
  );
}
