import { z } from 'zod';
import { SELF_REGISTER_ROLES } from '@/lib/roles';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(10, 'weak').max(128);

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });

export const registerSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email,
  password,
  // Only the two public roles are accepted; anything else fails validation here AND in the database trigger.
  role: z.enum(SELF_REGISTER_ROLES),
});

export const setPasswordSchema = z.object({ password });
export const inviteManagerSchema = z.object({ full_name: z.string().trim().min(1).max(120), email });
