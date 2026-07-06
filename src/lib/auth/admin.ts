import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { isTwoFactorCookieValid } from '@/lib/auth/two-factor';

function readUserRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null | undefined) {
  const role = user?.app_metadata?.role ?? user?.user_metadata?.role;
  return typeof role === 'string' ? role : null;
}
export async function getAuthenticatedAdminUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();
  const twoFactorCookie = cookieStore.get('solara_admin_2fa');

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = readUserRole(user);
  const isAdmin = role === 'admin' || role === 'service_role';
  const isTwoFactorValid = await isTwoFactorCookieValid(twoFactorCookie?.value, user?.id);

  return isAdmin && isTwoFactorValid ? user : null;
}

export async function verifyAdminPassword(password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminUser = await getAuthenticatedAdminUser();

  if (!url || !anonKey || !adminUser?.email) {
    return false;
  }

  const authClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await authClient.auth.signInWithPassword({
    email: adminUser.email,
    password,
  });

  return !error;
}
