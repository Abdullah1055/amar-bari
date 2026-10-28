import { useState } from 'react';
import { Link } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '@/lib/auth';
import { isConfigured } from '@/lib/supabase';
import { validateLogin } from '@/lib/validation';
import { Body, Button, Field, Notice, Screen, Title, colors } from '@/components/ui';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const input = validateLogin(email, password);
    if (!input) return setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
    setBusy(true);
    setError(null);
    const ok = await signIn(input.email, input.password);
    setBusy(false);
    if (!ok) setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়।'); // same message for every failure: no account enumeration
  }

  return (
    <Screen>
      <Title>লগইন</Title>
      {!isConfigured && <Notice kind="error">Supabase কনফিগার করা হয়নি (.env দেখুন)।</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      <Field label="ইমেইল" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Field label="পাসওয়ার্ড" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" />
      <Button title={busy ? 'অপেক্ষা করুন…' : 'লগইন'} onPress={submit} disabled={busy || !isConfigured} />
      <Body muted>
        {'\n'}নতুন?{' '}
        <Link href="/register"><Text style={{ color: colors.brand, textDecorationLine: 'underline' }}>নিবন্ধন করুন</Text></Link>
      </Body>
    </Screen>
  );
}
