import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Avatar, Badge, IconButton, Loading, Row, Screen, Text } from '@/components/ui';
import { api, fileUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { clock, progressLabel } from '@/lib/format';
import { pickImage, useApi } from '@/lib/hooks';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import type { Message, Order } from '@/lib/types';

const QUICK_REPLIES = {
  buyer: ['Sudah di lokasi', 'Berapa lama lagi?', 'Minta foto'],
  jastiper: ['Barang sudah dibeli', 'Otw ke kampus', 'Sudah di lokasi'],
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: order } = useApi<Order>(`/orders/${id}`);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api<Message[]>(`/orders/${id}/messages`)
        .then((m) => alive && setMessages(m))
        .catch(() => {});
    load();
    const timer = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [id]);

  const send = async (body: { text?: string; photo?: string }) => {
    if (sending) return;
    setSending(true);
    try {
      await api(`/orders/${id}/messages`, { body });
      setText('');
      setMessages(await api<Message[]>(`/orders/${id}/messages`));
    } finally {
      setSending(false);
    }
  };

  if (!order || !user) return <Loading />;
  const isBuyer = order.buyer.id === user.id;
  const other = isBuyer ? order.jastiper : order.buyer;
  const live = order.status === 'on_the_way';

  return (
    <Screen edges={['top', 'bottom']}>
      <Row style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 12, backgroundColor: colors.white }}>
        <IconButton icon="chevron-back" color={colors.text} bg={colors.surface} onPress={() => router.back()} />
        <Avatar name={other?.name ?? '?'} size={42} tone="orange" />
        <View style={{ flex: 1 }}>
          <Row style={{ gap: 6 }}>
            <Text weight="bold" size={16}>
              {other?.name}
            </Text>
            {other && <Badge label={`Binus ${other.campus}`} tone="orange" />}
          </Row>
          <Text size={12} color={colors.muted}>
            {isBuyer ? 'Jastiper' : 'Buyer'}
          </Text>
        </View>
      </Row>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={{ padding: 16, gap: 10 }}
        >
          <Pressable
            onPress={() => isBuyer && router.push(`/order/${order.id}/track`)}
            style={{ backgroundColor: colors.white, borderRadius: radius.md, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center', ...shadow }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bag-handle-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Row style={{ gap: 6 }}>
                <Text weight="bold" size={13}>
                  #{order.code}
                </Text>
                {live && <Badge label="LIVE" tone="solidOrange" />}
              </Row>
              <Text size={12} color={colors.textSoft} numberOfLines={1}>
                {order.productName}
              </Text>
              <Text size={11} color={colors.orangeText}>
                {progressLabel(order.status, order.trip?.country ?? '') || 'Menunggu pembayaran'}
              </Text>
            </View>
            {isBuyer && (
              <Text weight="bold" size={12} color={colors.orangeText}>
                Lacak ›
              </Text>
            )}
          </Pressable>

          <Row style={{ backgroundColor: colors.greenSoft, borderRadius: radius.sm, padding: 10, gap: 8 }}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.green} />
            <Text size={12} color={colors.green} style={{ flex: 1 }}>
              Chat dilindungi escrow TitiBin. Jangan transfer atau bayar di luar aplikasi.
            </Text>
          </Row>

          {messages === null ? (
            <Loading />
          ) : (
            messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <View
                  key={m.id}
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                    backgroundColor: mine ? colors.primaryDark : colors.white,
                    borderRadius: 16,
                    borderBottomRightRadius: mine ? 4 : 16,
                    borderBottomLeftRadius: mine ? 16 : 4,
                    padding: 12,
                    gap: 6,
                    ...shadow,
                  }}
                >
                  {m.photo && <Image source={{ uri: fileUrl(m.photo) }} style={{ width: 220, height: 160, borderRadius: 10 }} />}
                  {m.text ? (
                    <Text size={14} color={mine ? colors.white : colors.text} style={{ lineHeight: 20 }}>
                      {m.text}
                    </Text>
                  ) : null}
                  <Row style={{ alignSelf: 'flex-end', gap: 4 }}>
                    <Text size={10} color={mine ? '#BFD3F2' : colors.faint}>
                      {clock(m.createdAt)}
                    </Text>
                    {mine && <Ionicons name="checkmark-done" size={13} color="#7DD3FC" />}
                  </Row>
                </View>
              );
            })
          )}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }} style={{ flexGrow: 0 }}>
          {QUICK_REPLIES[isBuyer ? 'buyer' : 'jastiper'].map((q) => (
            <Pressable
              key={q}
              onPress={() => send({ text: q })}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }}
            >
              <Text weight="medium" size={13}>
                {q}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Row style={{ gap: 10, padding: 12, backgroundColor: colors.white }}>
          <IconButton
            icon="add"
            onPress={async () => {
              const img = await pickImage();
              if (img) await send({ photo: img.dataUrl });
            }}
          />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Tulis pesan..."
            placeholderTextColor={colors.faint}
            style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 16, height: 44, fontFamily: fonts.medium, color: colors.text }}
            onSubmitEditing={() => text.trim() && send({ text: text.trim() })}
            returnKeyType="send"
          />
          <IconButton icon="send" color={colors.white} bg={colors.orange} size={44} onPress={() => text.trim() && send({ text: text.trim() })} />
        </Row>
      </KeyboardAvoidingView>
    </Screen>
  );
}
