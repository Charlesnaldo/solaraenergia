import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createTwoFactorCookieValue } from '@/lib/auth/two-factor';

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

function isAdminUser(user: Awaited<ReturnType<typeof getSupabaseUser>>) {
  return isAllowedAdminUser(user);
}

function getRoleError(user: Awaited<ReturnType<typeof getSupabaseUser>>) {
  const email = user?.email?.trim().toLowerCase() ?? '';

  if (email && readAdminEmails().includes(email)) {
    return 'User is allowed by ADMIN_EMAILS.';
  }

  const role = readUserRole(user);

  if (!role) {
    return 'User without admin role. Set ADMIN_EMAILS or add role=admin.';
  }

  return `User role "${role}" is not allowed.`;
}

async function getSupabaseUser(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error('Supabase not configured.');
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: auth } = await client.auth.getUser(token);
    return auth.user;
  }

  const cookieStore = await cookies();
  const serverClient = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  const { data: auth } = await serverClient.auth.getUser();
  return auth.user;
}

export async function POST(req: Request) {
  try {
    const user = await getSupabaseUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: getRoleError(user) }, { status: 403 });
    }

    const twoFactorCookieValue = await createTwoFactorCookieValue(user.id);
    const response = NextResponse.json({ ok: true });
    response.cookies.set('solara_admin_2fa', twoFactorCookieValue, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Error starting 2FA.' }, { status: 500 });
  }
}
