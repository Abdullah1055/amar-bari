import { useCallback, useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { RoleGate } from '@/components/role-gate';
import { Body, Button, Notice, Screen, Title, colors } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { MANAGER_PERMISSION_KEYS, type AccountStatus } from '@/lib/roles';

type Manager = { id: string; full_name: string | null; status: AccountStatus };
const STATUS_BN: Record<AccountStatus, string> = { pending: 'অনুমোদনের অপেক্ষায়', active: 'সক্রিয়', suspended: 'স্থগিত' };

function ManagersList() {
  const [managers, setManagers] = useState<Manager[] | null>(null);
  const [perms, setPerms] = useState<Record<string, Set<string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [m, p] = await Promise.all([
      supabase.from('profiles').select('id, full_name, status').eq('role', 'manager').order('created_at', { ascending: false }),
      supabase.from('manager_permissions').select('manager_id, permission_key'),
    ]);
    if (m.error || p.error) return setError('তালিকা লোড করা যায়নি।');
    const map: Record<string, Set<string>> = {};
    for (const r of p.data ?? []) (map[r.manager_id] ??= new Set()).add(r.permission_key);
    setPerms(map);
    setManagers((m.data ?? []) as Manager[]);
    setError(null);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    setBusyId(id);
    const { error: e } = await supabase.rpc('approve_manager', { p_manager_id: id });
    setBusyId(null);
    if (e) setError('অনুমোদন দেওয়া যায়নি।');
    await load();
  }

  async function toggle(id: string, key: string, on: boolean) {
    setBusyId(id);
    const { error: e } = on
      ? await supabase.rpc('grant_manager_permission', { p_manager_id: id, p_key: key, p_reason: null })
      : await supabase.rpc('revoke_manager_permission', { p_manager_id: id, p_key: key, p_reason: null });
    setBusyId(null);
    if (e) setError('পারমিশন পরিবর্তন করা যায়নি।');
    await load();
  }

  return (
    <>
      <Notice kind="info">নতুন ম্যানেজার যোগ করা (সার্ভার-সাইড কাজ) আপাতত ওয়েব পোর্টাল থেকে হবে। মোবাইল অ্যাপে সার্ভিস-রোল কী রাখা হয় না।</Notice>
      {error && <Notice kind="error">{error}</Notice>}
      {managers === null && !error && <Body muted>লোড হচ্ছে…</Body>}
      {managers?.length === 0 && <Body muted>এখনো কোনো ম্যানেজার নেই।</Body>}
      {managers?.map((m) => (
        <View key={m.id} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 14, marginBottom: 14 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{m.full_name ?? 'নামহীন'}</Text>
          <Text style={{ fontSize: 14, color: colors.ink, opacity: 0.7, marginBottom: 8 }}>{STATUS_BN[m.status]}</Text>
          {m.status === 'pending' && <Button title="অনুমোদন দিন" onPress={() => approve(m.id)} disabled={busyId === m.id} />}
          {MANAGER_PERMISSION_KEYS.map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
              <Text style={{ fontSize: 14, fontFamily: 'monospace', color: colors.ink, flexShrink: 1 }}>{k}</Text>
              <Switch
                accessibilityLabel={`${k} পারমিশন`}
                value={perms[m.id]?.has(k) ?? false}
                disabled={busyId === m.id}
                onValueChange={(on) => toggle(m.id, k, on)}
                trackColor={{ true: colors.brand, false: colors.line }}
              />
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

export default function ManagersScreen() {
  return (
    <RoleGate allow={['super_admin']}>
      <Screen>
        <Title>ম্যানেজার ও পারমিশন</Title>
        <ManagersList />
      </Screen>
    </RoleGate>
  );
}
