import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Loading, Text, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

const TAB_META: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  home: { label: 'Beranda', icon: 'home-outline', activeIcon: 'home' },
  orders: { label: 'Pesanan', icon: 'chatbox-outline', activeIcon: 'chatbox' },
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isJastiper = user?.role === 'jastiper';

  const tab = (index: number) => {
    const route = state.routes[index]!;
    const meta = TAB_META[route.name]!;
    const focused = state.index === index;
    const color = focused ? colors.orangeText : colors.text;
    return (
      <Pressable
        key={route.key}
        onPress={() => navigation.navigate(route.name)}
        style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 10 }}
      >
        <Ionicons name={focused ? meta.activeIcon : meta.icon} size={22} color={color} />
        <Text weight="bold" size={11} color={color}>
          {meta.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      {tab(0)}
      <Pressable
        onPress={() => router.push(isJastiper ? '/trip/new' : '/request/new')}
        style={{ flex: 1, alignItems: 'center', gap: 4 }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.orange,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -22,
            borderWidth: 4,
            borderColor: colors.white,
            elevation: 4,
            shadowColor: colors.orange,
            shadowOpacity: 0.35,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </View>
        <Text weight="semibold" size={11}>
          {isJastiper ? 'Create Trip' : 'Titip'}
        </Text>
      </Pressable>
      {tab(1)}
    </View>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/auth" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="orders" />
    </Tabs>
  );
}
