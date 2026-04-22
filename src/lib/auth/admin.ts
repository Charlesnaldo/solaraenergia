import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

  const role = user?.app_metadata?.role;
  const isAdmin = role === 'admin' || role === 'service_role';
  const isTwoFactorValid = twoFactorCookie?.value === user?.id;

  return isAdmin && isTwoFactorValid ? user : null;
}
