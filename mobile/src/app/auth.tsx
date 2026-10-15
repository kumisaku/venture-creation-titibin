import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/lib/alert';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Checkbox, Field, Logo, Row, Screen, SelectField, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { CAMPUSES } from '@/lib/constants';
import { useAsyncAction } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  return (
    <Screen bg={colors.white} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Logo size={52} />
            <Text weight="extrabold" size={18}>
              TitiBin
            </Text>
            <Text weight="medium" size={15} color={colors.textSoft}>
              Binusian P2P Jastip Network
            </Text>
          </View>

          <Row style={{ backgroundColor: colors.primarySoft, borderRadius: radius.pill, padding: 4 }}>
            {(
              [
                ['login', 'Masuk', 'log-in-outline'],
                ['register', 'Daftar Akun', 'person-add-outline'],
              ] as const
            ).map(([key, label, icon]) => (
              <Pressable
                key={key}
                onPress={() => setMode(key)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: radius.pill,
                  backgroundColor: mode === key ? colors.white : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name={icon} size={18} color={mode === key ? colors.primary : colors.textSoft} />
                <Text weight="semibold" color={mode === key ? colors.primary : colors.textSoft}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </Row>

          <Button
            title={mode === 'login' ? 'Lanjutkan dengan Google' : 'Daftar dengan Google'}
            variant="outline"
            icon="logo-google"
            onPress={() => showAlert('Segera hadir', 'Login Google belum tersedia. Gunakan email @binus.ac.id.')}
          />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text weight="semibold" size={11} color={colors.muted}>
              {mode === 'login' ? 'ATAU DENGAN EMAIL BINUS' : 'ATAU ISI DATA MANUAL MAHASISWA'}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </Row>

          {mode === 'login' ? <LoginForm /> : <RegisterForm onSwitch={() => setMode('login')} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const { busy, run } = useAsyncAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  return (
    <View style={{ gap: 16 }}>
      <Field
        label="Email Mahasiswa"
        rightLabel={
          <Text weight="semibold" size={11} color={colors.orangeText}>
            Wajib @binus.ac.id
          </Text>
        }
        icon="at"
        placeholder="nama@binus.ac.id"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="Kata Sandi"
        rightLabel={
          <Pressable onPress={() => showAlert('Lupa Sandi', 'Hubungi admin TitiBin untuk reset kata sandi.')}>
            <Text weight="semibold" size={12} color={colors.primary}>
              Lupa Sandi?
            </Text>
          </Pressable>
        }
        icon="lock-closed-outline"
        placeholder="Masukkan sandi"
        secure
        value={password}
        onChangeText={setPassword}
      />
      <Checkbox checked={remember} onPress={() => setRemember((r) => !r)} label="Ingat saya di perangkat ini" />
      <Button
        title="Masuk ke Akun Binus"
        iconRight="arrow-forward"
        loading={busy}
        onPress={() =>
          run(async () => {
            await login(email, password);
            router.replace('/home');
          })
        }
      />
    </View>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register } = useAuth();
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({ name: '', nim: '', email: '', campus: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(false);
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const submit = () =>
    run(async () => {
      if (form.password !== form.confirm) throw new Error('Konfirmasi kata sandi tidak cocok');
      if (!agree) throw new Error('Setujui Syarat & Ketentuan terlebih dahulu');
      await register({ name: form.name, nim: form.nim, email: form.email, campus: form.campus, password: form.password });
      router.replace('/verified');
    });

  return (
    <View style={{ gap: 16 }}>
      <Field label="Nama Lengkap (Sesuai ID Card)" required icon="id-card-outline" placeholder="cth. Kevin Sanjaya" value={form.name} onChangeText={set('name')} />
      <Field label="Nomor Induk Mahasiswa (NIM)" required icon="keypad-outline" placeholder="NIM" keyboardType="number-pad" value={form.nim} onChangeText={set('nim')} />
      <Field
        label="Email Kampus Binusian"
        required
        icon="at"
        placeholder="nama@binus.ac.id"
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={set('email')}
      />
      <SelectField
        label="Kampus Domisili / Base"
        required
        icon="school-outline"
        placeholder="Pilih Kampus Titik Temu Utama"
        value={form.campus}
        options={CAMPUSES}
        onChange={set('campus')}
      />
      <Field label="Kata Sandi Baru" required icon="lock-closed-outline" placeholder="Min. 8 karakter" secure value={form.password} onChangeText={set('password')} />
      <Field label="Konfirmasi Kata Sandi" required icon="refresh-outline" placeholder="Ulangi kata sandi" secure value={form.confirm} onChangeText={set('confirm')} />
      <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14 }}>
        <Checkbox
          checked={agree}
          onPress={() => setAgree((a) => !a)}
          label={
            <Text size={12} color={colors.textSoft} style={{ flex: 1, lineHeight: 18 }}>
              Saya menyetujui <Text size={12} color={colors.primary}>Syarat & Ketentuan</Text>, Kebijakan Privasi, dan{' '}
              <Text size={12} color={colors.orangeText}>Kode Etik Komunitas Jastip Binus</Text> untuk keamanan transaksi antar mahasiswa.
            </Text>
          }
        />
      </View>
      <Button title="Daftar & Verifikasi Akun Binus" icon="person-add-outline" loading={busy} onPress={submit} />
      <Row style={{ justifyContent: 'center', gap: 4 }}>
        <Text color={colors.textSoft}>Sudah punya akun terdaftar?</Text>
        <Pressable onPress={onSwitch}>
          <Text weight="bold" color={colors.orangeText}>
            Masuk di sini
          </Text>
        </Pressable>
      </Row>
    </View>
  );
}
