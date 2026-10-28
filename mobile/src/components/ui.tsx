import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = { paper: '#f4f6f5', ink: '#16201d', brand: '#0e5a4d', danger: '#a4281c', line: '#c5cdc9', white: '#ffffff', marigold: '#e0a100' };

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={s.screen} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export const Title = ({ children }: { children: ReactNode }) => <Text accessibilityRole="header" style={s.title}>{children}</Text>;
export const Body = ({ children, muted }: { children: ReactNode; muted?: boolean }) => <Text style={[s.body, muted && { opacity: 0.7 }]}>{children}</Text>;

export function Notice({ kind, children }: { kind: 'error' | 'info'; children: ReactNode }) {
  const color = kind === 'error' ? colors.danger : colors.brand;
  return (
    <View accessibilityRole={kind === 'error' ? 'alert' : undefined} style={[s.notice, { borderColor: color }]}>
      <Text style={{ color, fontSize: 15 }}>{children}</Text>
    </View>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor="#7a8581" style={s.input} {...props} />
    </View>
  );
}

export function Button({ title, onPress, disabled, quiet }: { title: string; onPress: () => void; disabled?: boolean; quiet?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.btn, quiet && s.btnQuiet, disabled && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}
    >
      <Text style={[s.btnText, quiet && { color: colors.ink }]}>{title}</Text>
    </Pressable>
  );
}

export const Loading = () => (
  <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
    <ActivityIndicator size="large" color={colors.brand} accessibilityLabel="লোড হচ্ছে" />
  </View>
);

export function PendingPhase({ items }: { items: { phase: string; text: string }[] }) {
  return (
    <View style={s.pending}>
      <Text style={[s.body, { fontWeight: '700', marginBottom: 6 }]}>এই অংশগুলো এখনো তৈরি হয়নি (পরবর্তী ধাপে আসছে)</Text>
      {items.map((i) => (
        <Text key={i.phase} style={[s.body, { fontSize: 14 }]}>
          <Text style={{ fontWeight: '600' }}>{i.phase}: </Text>
          {i.text}
        </Text>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 26, color: colors.ink },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 6, backgroundColor: colors.white, paddingHorizontal: 12, minHeight: 48, fontSize: 16, color: colors.ink },
  btn: { backgroundColor: colors.brand, borderRadius: 6, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  btnQuiet: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  notice: { borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 14, backgroundColor: colors.white },
  pending: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, borderRadius: 8, padding: 16, marginTop: 16 },
});
