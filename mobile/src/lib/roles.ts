// Mirrors ../src/lib/roles.ts of the web app. Exactly four core roles; do not add one without explicit approval.
export const APP_ROLES = ['super_admin', 'manager', 'bari_ala', 'varatiye'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const SELF_REGISTER_ROLES = ['bari_ala', 'varatiye'] as const;
export type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];

export type AccountStatus = 'pending' | 'active' | 'suspended';

export const ROLE_HOME: Record<AppRole, '/super-admin' | '/manager' | '/bari-ala' | '/varatiye'> = {
  super_admin: '/super-admin',
  manager: '/manager',
  bari_ala: '/bari-ala',
  varatiye: '/varatiye',
};

export const ROLE_LABEL: Record<AppRole, { bn: string; en: string }> = {
  super_admin: { bn: 'সুপার অ্যাডমিন', en: 'Super Admin' },
  manager: { bn: 'ম্যানেজার', en: 'Manager' },
  bari_ala: { bn: 'বাড়িওয়ালা', en: 'Bari Ala (Landlord)' },
  varatiye: { bn: 'ভাড়াটিয়া', en: 'Varatiye (Tenant)' },
};

export const MANAGER_PERMISSION_KEYS = [
  'users.view',
  'users.support',
  'accounts.review',
  'complaints.escalate',
  'subscriptions.review',
  'payments.review',
  'reports.view',
] as const;

export type Profile = {
  id: string;
  role: AppRole;
  status: AccountStatus;
  full_name: string | null;
  preferred_language: 'bn' | 'en';
};
