import { SELF_REGISTER_ROLES, type SelfRegisterRole } from './roles';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(email: string, password: string) {
  const e = email.trim().toLowerCase();
  return EMAIL.test(e) && password.length > 0 && password.length <= 128 ? { email: e, password } : null;
}

export function validateRegister(input: { fullName: string; email: string; password: string; role: string | null }) {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const role = input.role as SelfRegisterRole | null;
  if (!role || !(SELF_REGISTER_ROLES as readonly string[]).includes(role)) return null;
  if (!fullName || fullName.length > 120 || !EMAIL.test(email) || email.length > 254) return null;
  if (input.password.length < 10 || input.password.length > 128) return null;
  return { email, fullName, password: input.password, role };
}
