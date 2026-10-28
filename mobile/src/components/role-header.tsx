import { Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/roles';
import { Button, colors } from './ui';

export function RoleHeader() {
  const { profile, signOut } = useAuth();
  if (!profile) return null;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, color: colors.ink, opacity: 0.7 }}>
        {profile.full_name ?? ''} · {ROLE_LABEL[profile.role].bn} ({ROLE_LABEL[profile.role].en})
      </Text>
      <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
        <Button quiet title="লগ আউট" onPress={signOut} />
      </View>
    </View>
  );
}
