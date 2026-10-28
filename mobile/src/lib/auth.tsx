import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile, SelfRegisterRole } from './roles';

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (a: { email: string; password: string; fullName: string; role: SelfRegisterRole }) => Promise<'signed-in' | 'confirm-email' | 'error'>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, role, status, full_name, preferred_language')
    .eq('id', userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    const apply = async (s: Session | null) => {
      const p = s ? await fetchProfile(s.user.id) : null;
      if (!active) return;
      setSession(s);
      setProfile(p);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer: calling supabase inside this callback can deadlock the auth client.
      setTimeout(() => apply(s), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }, []);

  const signUp = useCallback<AuthState['signUp']>(async ({ email, password, fullName, role }) => {
    // user_metadata is client-controlled; the database trigger only accepts bari_ala / varatiye.
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role, full_name: fullName } } });
    if (error) return 'error';
    return data.session ? 'signed-in' : 'confirm-email';
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(() => ({ loading, session, profile, signIn, signUp, signOut }), [loading, session, profile, signIn, signUp, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
