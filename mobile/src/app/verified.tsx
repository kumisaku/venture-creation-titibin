import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Logo, Screen, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/lib/theme';

export default function VerifiedScreen() {
  const { user } = useAuth();
  return (
    <Screen bg={colors.white} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        <Logo size={80} />
        <Text weight="extrabold" size={22}>
          TitiBin
        </Text>
        <Text weight="semibold" size={13} color={colors.orange}>
          BINUSIAN P2P JASTIP
        </Text>
        <View
          style={{
            marginTop: 24,
            width: '100%',
            borderRadius: radius.lg,
            backgroundColor: colors.bg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 24,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={20} color={colors.green} />
          </View>
          <Text weight="semibold">Binus Student Verified</Text>
          {user && (
            <Text size={12} color={colors.muted}>
              {user.name} • {user.nim}
            </Text>
          )}
        </View>
      </View>
      <View style={{ padding: 24 }}>
        <Button title="Enter Your Role" onPress={() => router.replace('/select-role')} />
      </View>
    </Screen>
  );
}
