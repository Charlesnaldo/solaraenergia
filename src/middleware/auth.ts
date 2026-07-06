import { createClient, type User } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';
import { isTwoFactorCookieValid } from '@/lib/auth/two-factor';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AuthContext {
  user: User;
  isAdmin: boolean;
}

function readUserRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null | undefined) {
  const role = user?.app_metadata?.role ?? user?.user_metadata?.role;
  return typeof role === 'string' ? role : null;
}

function readAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedAdminUser(user: { email?: string | null; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null | undefined) {
  const email = user?.email?.trim().toLowerCase() ?? null;
  if (email && readAdminEmails().includes(email)) {
    return true;
  }

  const role = readUserRole(user);
  return role === 'admin' || role === 'service_role';
}
function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? '';
  const [scheme, token] = authorization.split(/\s+/);

  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

async function getUserFromBearerToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  return user;
}

async function getUserFromCookies() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthContext | null> {
  const bearerToken = getBearerToken(request);
  const user = bearerToken ? await getUserFromBearerToken(bearerToken) : await getUserFromCookies();

  if (!user) {
    return null;
  }

  const hasAdminRole = isAllowedAdminUser(user);
  const hasTwoFactor = await isTwoFactorCookieValid(request.cookies.get('solara_admin_2fa')?.value, user.id);

  return {
    user,
    isAdmin: hasAdminRole && hasTwoFactor,
  };
}
