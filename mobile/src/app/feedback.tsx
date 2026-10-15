import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/lib/alert';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { Badge, Button, Card, Chip, IconButton, Row, Screen, Stars, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { useAsyncAction } from '@/lib/hooks';
import { colors, fonts, radius } from '@/lib/theme';

const LIKES = ['🛡️ Rekber Kampus Aman (Escrow)', '📍 Fitur Handover QR Code', '⏱️ Tracking Cepat & Akurat', '🤝 Komunitas Binusian Terpercaya', '📱 Tampilan Mudah Dipahami'];
const LABELS = ['', 'Kurang', 'Cukup', 'Lumayan', 'Suka', 'Suka Banget Aplikasinya! 🎉'];

export default function AppFeedbackScreen() {
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const { busy, run } = useAsyncAction();
  const done = () => router.replace('/orders');

  const submit = () =>
    run(async () => {
      await api('/feedback', { body: { rating, tags, text } });
      showAlert('Terima kasih!', 'Masukanmu membantu TitiBin jadi lebih baik.');
      done();
    });

  return (
    <Screen edges={['top', 'bottom']}>
      <Row style={{ paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'space-between' }}>
        <IconButton icon="arrow-back" color={colors.text} bg="transparent" onPress={done} />
        <Text weight="bold" size={18}>
          Review & Rating
        </Text>
        <IconButton icon="close" color={colors.text} bg="transparent" onPress={done} />
      </Row>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bag-handle-outline" size={32} color={colors.white} />
            </View>
            <Text weight="extrabold" size={20}>
              Bantu TitiBin Jadi Lebih Baik!
            </Text>
            <Text size={14} color={colors.textSoft} style={{ textAlign: 'center', lineHeight: 21 }}>
              Bagaimana kemudahan pengalaman transaksi & rekber jastip kamu di kampus hari ini?
            </Text>
            <Stars value={rating} onChange={setRating} />
            <Badge label={`${rating}/5 • ${LABELS[rating]}`} tone="orange" />
          </Card>

          <Card style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text weight="bold" size={15}>
                Apa yang paling kamu sukai?
              </Text>
              <Text size={11} color={colors.muted}>
                Bisa pilih &gt;1
              </Text>
            </Row>
            <View style={{ gap: 8, alignItems: 'flex-start' }}>
              {LIKES.map((l) => (
                <Chip key={l} label={l} selected={tags.includes(l)} onPress={() => setTags((ts) => (ts.includes(l) ? ts.filter((x) => x !== l) : [...ts, l]))} />
              ))}
            </View>
          </Card>

          <Card style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row style={{ gap: 8 }}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text weight="bold" size={15}>
                  Saran & Masukan Fitur Baru
                </Text>
              </Row>
              <Text size={11} color={colors.muted}>
                {text.length}/300
              </Text>
            </Row>
            <TextInput
              multiline
              maxLength={300}
              value={text}
              onChangeText={setText}
              placeholder="Fitur apa yang ingin kamu lihat di TitiBin?"
              placeholderTextColor={colors.faint}
              style={{ minHeight: 90, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontFamily: fonts.regular, fontSize: 14, textAlignVertical: 'top', color: colors.text }}
            />
          </Card>

          <Button title="Kirim Ulasan & Selesaikan Transaksi" variant="orange" iconRight="checkmark-circle-outline" loading={busy} onPress={submit} style={{ borderRadius: 14 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
