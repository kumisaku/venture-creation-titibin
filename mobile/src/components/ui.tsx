import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PickedImage } from '@/lib/hooks';
import { pickImage, pickImages } from '@/lib/hooks';
import { initials, longDate, plain, toIso, todayIso } from '@/lib/format';
import { colors, fonts, radius, shadow } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type Weight = keyof typeof fonts;

export function Text({
  weight = 'regular',
  size = 14,
  color = colors.text,
  style,
  ...rest
}: TextProps & { weight?: Weight; size?: number; color?: string }) {
  return <RNText {...rest} style={[{ fontFamily: fonts[weight], fontSize: size, color }, style]} />;
}

type ButtonVariant = 'primary' | 'orange' | 'outline' | 'soft' | 'danger-soft';

const BUTTON_STYLES: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: colors.white },
  orange: { bg: colors.orange, fg: colors.white },
  outline: { bg: colors.white, fg: colors.textSoft, border: colors.border },
  soft: { bg: colors.primarySoft, fg: colors.primary },
  'danger-soft': { bg: colors.primarySoft, fg: colors.text },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  loading,
  disabled,
  size = 'lg',
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const v = BUTTON_STYLES[variant];
  const height = { sm: 38, md: 46, lg: 54 }[size];
  const fontSize = { sm: 13, md: 14, lg: 15 }[size];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height,
          borderRadius: radius.pill,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 18,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={fontSize + 4} color={v.fg} />}
          <Text weight="bold" size={fontSize} color={v.fg}>
            {title}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={fontSize + 4} color={v.fg} />}
        </>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow }, style]}>{children}</View>
  );
}

export function Screen({
  children,
  bg = colors.bg,
  edges = ['top'],
}: {
  children: ReactNode;
  bg?: string;
  edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg }}>
      {children}
    </SafeAreaView>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.primary,
  bg = colors.primarySoft,
  size = 40,
}: {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2.8,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </Pressable>
  );
}

export function ScreenHeader({ title, subtitle, right, onBack }: { title: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
      <IconButton icon="arrow-back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} />
      <View style={{ flex: 1 }}>
        <Text weight="bold" size={18}>
          {title}
        </Text>
        {subtitle ? (
          <Text size={12} color={colors.muted}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.26,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadow,
        }}
      >
        <Ionicons name="bag-handle-outline" size={size * 0.48} color={colors.white} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: -size * 0.04,
          right: -size * 0.04,
          width: size * 0.2,
          height: size * 0.2,
          borderRadius: size,
          backgroundColor: colors.orange,
          borderWidth: 2,
          borderColor: colors.white,
        }}
      />
    </View>
  );
}

export function Avatar({ name, size = 40, tone = 'blue' }: { name: string; size?: number; tone?: 'blue' | 'orange' }) {
  const bg = tone === 'orange' ? colors.orangeSoft : colors.primarySoft;
  const fg = tone === 'orange' ? colors.orange : colors.primary;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text weight="bold" size={size * 0.36} color={fg}>
        {initials(name)}
      </Text>
    </View>
  );
}

const BADGE_TONES = {
  blue: { bg: colors.primarySoft, fg: colors.primary },
  orange: { bg: colors.orangeSoft, fg: colors.orangeText },
  green: { bg: colors.greenSoft, fg: colors.green },
  red: { bg: colors.redSoft, fg: colors.red },
  amber: { bg: colors.amberSoft, fg: colors.amber },
  solidOrange: { bg: colors.orange, fg: colors.white },
  gray: { bg: colors.surface, fg: colors.muted },
};

export function Badge({ label, tone = 'blue', icon }: { label: string; tone?: keyof typeof BADGE_TONES; icon?: IconName }) {
  const t = BADGE_TONES[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: t.bg,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
      }}
    >
      {icon && <Ionicons name={icon} size={12} color={t.fg} />}
      <Text weight="bold" size={11} color={t.fg}>
        {label}
      </Text>
    </View>
  );
}

export function Field({
  label,
  required,
  hint,
  rightLabel,
  icon,
  prefix,
  suffix,
  secure,
  error,
  style,
  inputStyle,
  ...input
}: TextInputProps & {
  label?: string;
  required?: boolean;
  hint?: string;
  rightLabel?: ReactNode;
  icon?: IconName;
  prefix?: string;
  suffix?: string;
  secure?: boolean;
  error?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={[{ gap: 6 }, style]}>
      {(label || rightLabel) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text weight="semibold" size={13}>
            {label}
            {required ? <Text color={colors.red}> *</Text> : null}
          </Text>
          {typeof rightLabel === 'string' ? (
            <Text size={11} color={colors.muted}>
              {rightLabel}
            </Text>
          ) : (
            rightLabel
          )}
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? colors.red : colors.border,
          paddingHorizontal: 14,
          minHeight: 50,
          gap: 10,
        }}
      >
        {icon && <Ionicons name={icon} size={18} color={colors.muted} />}
        {prefix && (
          <Text weight="semibold" color={colors.muted}>
            {prefix}
          </Text>
        )}
        <TextInput
          placeholderTextColor={colors.faint}
          secureTextEntry={secure && hidden}
          {...input}
          style={[{ flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.text, paddingVertical: 12 }, inputStyle]}
        />
        {suffix && (
          <Text weight="semibold" color={colors.muted}>
            {suffix}
          </Text>
        )}
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text size={11} color={colors.red}>
          {error}
        </Text>
      ) : hint ? (
        <Text size={11} color={colors.muted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function SelectField({
  label,
  required,
  icon,
  placeholder,
  value,
  options,
  onChange,
}: {
  label?: string;
  required?: boolean;
  icon?: IconName;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text weight="semibold" size={13}>
          {label}
          {required ? <Text color={colors.red}> *</Text> : null}
        </Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          minHeight: 50,
          gap: 10,
        }}
      >
        {icon && <Ionicons name={icon} size={18} color={colors.muted} />}
        <Text weight="medium" color={value ? colors.text : colors.faint} style={{ flex: 1 }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 4 }}>
            <Text weight="bold" size={16} style={{ marginBottom: 8 }}>
              {label ?? placeholder}
            </Text>
            {options.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: radius.sm,
                  backgroundColor: opt === value ? colors.primarySoft : 'transparent',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Text weight={opt === value ? 'bold' : 'medium'} color={opt === value ? colors.primary : colors.text}>
                  {opt}
                </Text>
                {opt === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </Pressable>
            ))}
            <View style={{ height: 16 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  tone = 'orange',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: 'orange' | 'blue';
}) {
  const activeBg = tone === 'orange' ? colors.orange : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: radius.pill,
        backgroundColor: selected ? activeBg : colors.surface,
      }}
    >
      {icon && <Ionicons name={icon} size={16} color={selected ? colors.white : colors.text} />}
      <Text weight="semibold" size={13} color={selected ? colors.white : colors.textSoft}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Checkbox({ checked, onPress, label }: { checked: boolean; onPress: () => void; label?: ReactNode }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} hitSlop={6}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: checked ? colors.primary : colors.faint,
          backgroundColor: checked ? colors.primary : colors.white,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Ionicons name="checkmark" size={15} color={colors.white} />}
      </View>
      {typeof label === 'string' ? <Text color={colors.textSoft}>{label}</Text> : label}
    </Pressable>
  );
}

export function Stars({ value, onChange, size = 36 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange?.(n)} disabled={!onChange} hitSlop={4}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={colors.star} />
        </Pressable>
      ))}
    </View>
  );
}

export function UploadBox({
  title = 'Unggah Foto Referensi Produk',
  value,
  onChange,
}: {
  title?: string;
  value: PickedImage | null;
  onChange: (v: PickedImage | null) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={async () => {
          const img = await pickImage();
          if (img) onChange(img);
        }}
        style={{
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: '#B9C6DD',
          borderRadius: radius.lg,
          backgroundColor: '#F4F7FD',
          paddingVertical: 24,
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
        </View>
        <Text weight="bold">{title}</Text>
        <Text size={12} color={colors.muted}>
          Format JPG, PNG maks. 5MB.
        </Text>
      </Pressable>
      {value && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 10,
            borderRadius: radius.md,
            backgroundColor: '#F4F7FD',
            borderWidth: 1,
            borderColor: colors.primaryTint,
          }}
        >
          <Image source={{ uri: value.uri }} style={{ width: 44, height: 44, borderRadius: 10 }} />
          <View style={{ flex: 1 }}>
            <Text weight="semibold" numberOfLines={1}>
              {value.name}
            </Text>
            <Text size={12} color={colors.green}>
              ● Terunggah • {Math.round(value.size / 1024)} KB
            </Text>
          </View>
          <IconButton icon="trash-outline" color={colors.textSoft} bg={colors.white} size={36} onPress={() => onChange(null)} />
        </View>
      )}
    </View>
  );
}

/** Rupiah input that shows thousands separators ("1.250.000") while typing. `value` holds digits only. */
export function MoneyField({
  value,
  onChangeValue,
  ...rest
}: Omit<ComponentProps<typeof Field>, 'value' | 'onChangeText' | 'prefix' | 'keyboardType'> & {
  value: string;
  onChangeValue: (digits: string) => void;
}) {
  const digits = value.replace(/\D/g, '');
  return (
    <Field
      prefix="Rp"
      keyboardType="number-pad"
      {...rest}
      value={digits ? plain(Number(digits)) : ''}
      onChangeText={(text) => onChangeValue(text.replace(/\D/g, '').replace(/^0+/, '').slice(0, 12))}
    />
  );
}

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** Date input that opens a calendar. `value`/`min` are "yyyy-mm-dd". */
export function DateField({
  label,
  required,
  value,
  min,
  placeholder = 'Pilih tanggal',
  onChange,
  style,
}: {
  label?: string;
  required?: boolean;
  value: string;
  min?: string;
  placeholder?: string;
  onChange: (iso: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ year: 2000, month: 0 });

  const show = () => {
    const start = value || min || todayIso();
    const d = new Date(`${start}T00:00:00`);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setOpen(true);
  };
  const shift = (delta: number) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = todayIso();

  return (
    <View style={[{ gap: 6 }, style]}>
      {label && (
        <Text weight="semibold" size={13}>
          {label}
          {required ? <Text color={colors.red}> *</Text> : null}
        </Text>
      )}
      <Pressable
        onPress={show}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          minHeight: 50,
          gap: 10,
        }}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
        <Text weight="medium" color={value ? colors.text : colors.faint} style={{ flex: 1 }} numberOfLines={1}>
          {value ? longDate(value) : placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 }}>
          <Pressable style={{ backgroundColor: colors.white, borderRadius: 24, padding: 16, gap: 12, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <IconButton icon="chevron-back" size={36} onPress={() => shift(-1)} />
              <Text weight="bold" size={16}>
                {MONTH_NAMES[view.month]} {view.year}
              </Text>
              <IconButton icon="chevron-forward" size={36} onPress={() => shift(1)} />
            </View>
            <View style={{ flexDirection: 'row' }}>
              {WEEKDAYS.map((d) => (
                <Text key={d} weight="semibold" size={11} color={colors.muted} style={{ width: `${100 / 7}%`, textAlign: 'center' }}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`blank-${i}`} style={{ width: `${100 / 7}%`, height: 42 }} />;
                const iso = toIso(new Date(view.year, view.month, day));
                const disabled = Boolean(min) && iso < min!;
                const selected = iso === value;
                return (
                  <View key={iso} style={{ width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                    <Pressable
                      disabled={disabled}
                      onPress={() => {
                        onChange(iso);
                        setOpen(false);
                      }}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? colors.primary : 'transparent',
                        borderWidth: iso === today && !selected ? 1.5 : 0,
                        borderColor: colors.orange,
                      }}
                    >
                      <Text weight={selected ? 'bold' : 'medium'} color={selected ? colors.white : disabled ? colors.faint : colors.text}>
                        {day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <Button title="Tutup" variant="outline" size="md" onPress={() => setOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Grid of up to `max` reference photos with remove buttons and an add tile. */
export function MultiPhotoPicker({ value, onChange, max = 5 }: { value: PickedImage[]; onChange: (v: PickedImage[]) => void; max?: number }) {
  const add = async () => {
    const picked = await pickImages(max - value.length);
    if (picked.length) onChange([...value, ...picked].slice(0, max));
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {value.map((img, i) => (
          <View key={`${img.uri}-${i}`} style={{ width: 84, height: 84, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surface }}>
            <Image source={{ uri: img.uri }} style={{ width: 84, height: 84 }} />
            <Pressable
              onPress={() => onChange(value.filter((_, j) => j !== i))}
              hitSlop={6}
              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#000A', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={14} color={colors.white} />
            </Pressable>
          </View>
        ))}
        {value.length < max && (
          <Pressable
            onPress={add}
            style={{
              width: 84,
              height: 84,
              borderRadius: 14,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#B9C6DD',
              backgroundColor: '#F4F7FD',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="add" size={26} color={colors.primary} />
            <Text size={10} weight="semibold" color={colors.primary}>
              Tambah
            </Text>
          </Pressable>
        )}
      </View>
      <Text size={12} color={colors.muted}>
        {value.length}/{max} foto • JPG, PNG maks. 5MB per foto.
      </Text>
    </View>
  );
}

/** One progress bar with a label row, used for luggage weight and spending budget. */
export function CapacityBar({
  icon,
  label,
  used,
  total,
  format,
  tone = 'primary',
}: {
  icon: IconName;
  label: string;
  used: number;
  total: number;
  format: (n: number) => string;
  tone?: 'primary' | 'orange';
}) {
  const pct = total > 0 ? Math.min(1, used / total) : 0;
  const full = total > 0 && used >= total;
  const fill = full ? colors.red : tone === 'orange' ? colors.orange : colors.primary;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={icon} size={16} color={fill} />
          <Text weight="semibold" size={13}>
            {label}
          </Text>
        </View>
        <Text weight="bold" size={12} color={fill} style={{ flexShrink: 1, textAlign: 'right' }}>
          {format(used)} / {format(total)}{' '}
          <Text size={11} color={colors.muted}>
            (sisa {format(Math.max(0, total - used))})
          </Text>
        </Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.primaryTint }}>
        <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: fill }} />
      </View>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 12 }}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.faint} />
      <Text color={colors.muted} style={{ textAlign: 'center' }}>
        {message}
      </Text>
      <Button title="Coba lagi" variant="soft" size="sm" onPress={onRetry} />
    </View>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body?: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 8 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text weight="bold" size={15}>
        {title}
      </Text>
      {body && (
        <Text color={colors.muted} style={{ textAlign: 'center' }}>
          {body}
        </Text>
      )}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}
