import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { SELF_REGISTER_ROLES, ROLE_LABEL, type SelfRegisterRole } from '@/lib/roles';
import { isConfigured } from '@/lib/supabase';
import { validateRegister } from '@/lib/validation';
import { Body, Button, Field, Notice, Screen, Title, colors } from '@/components/ui';

export default function Register() {
  const { signUp } = useAuth();
  const [role, setRole] = useState<SelfRegisterRole | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const input = validateRegister({ fullName, email, password, role });
    if (!input) return setError('তথ্য সঠিক নয়। ভূমিকা বাছুন এবং পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের দিন।');
    setBusy(true);
    setError(null);
    const result = await signUp(input);
    setBusy(false);
    if (result === 'error') return setError('নিবন্ধন করা যায়নি। পরে আবার চেষ্টা করুন।');
    if (result === 'confirm-email') {
      setInfo('নিবন্ধন সম্পন্ন। ইমেইল যাচাই করে লগইন করুন।');
      router.replace('/login');
    }
  }

  return (
    <Screen>
      <Title>নিবন্ধন</Title>
      <Body muted>আপনি কে হিসেবে যোগ দিচ্ছেন?</Body>
      {error && <Notice kind="error">{error}</Notice>}
      {info && <Notice kind="info">{info}</Notice>}
      <View accessibilityRole="radiogroup" style={{ marginVertical: 12, gap: 8 }}>
        {SELF_REGISTER_ROLES.map((r) => (
          <Pressable
            key={r}
            accessibilityRole="radio"
            accessibilityState={{ checked: role === r }}
            onPress={() => setRole(r)}
            style={{ minHeight: 48, borderWidth: 2, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#fff', borderColor: role === r ? colors.brand : colors.line }}
          >
            <Text style={{ fontSize: 16, color: colors.ink, fontWeight: role === r ? '700' : '400' }}>{ROLE_LABEL[r].bn} ({ROLE_LABEL[r].en})</Text>
          </Pressable>
        ))}
      </View>
      <Field label="পূর্ণ নাম" value={fullName} onChangeText={setFullName} autoComplete="name" maxLength={120} />
      <Field label="ইমেইল" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <Button title={busy ? 'অপেক্ষা করুন…' : 'নিবন্ধন করুন'} onPress={submit} disabled={busy || !isConfigured} />
      <Body muted>
        {'\n'}অ্যাকাউন্ট আছে?{' '}
        <Link href="/login"><Text style={{ color: colors.brand, textDecorationLine: 'underline' }}>লগইন</Text></Link>
      </Body>
    </Screen>
  );
}
