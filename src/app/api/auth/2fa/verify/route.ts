import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { createTwoFactorCookieValue } from '@/lib/auth/two-factor';

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function isAdminUser(user: Awaited<ReturnType<typeof getSupabaseUser>>) {
  const role = user?.app_metadata?.role;
  return role === 'admin' || role === 'service_role';
}

async function getSupabaseUser(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    const body = (await req.json()) as { challengeId?: string; code?: string };
    const challengeId = body.challengeId?.trim();
    const code = body.code?.trim();

    if (!challengeId || !code) {
      return NextResponse.json({ error: 'challengeId and code are required.' }, { status: 400 });
    }

    const user = await getSupabaseUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createSupabaseServiceClient();
    const { data: challenge, error } = await service
      .from('auth_challenges')
      .select('id, code_hash, expira_em, usado, user_id')
      .eq('id', challengeId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !challenge || challenge.usado || new Date(challenge.expira_em) < new Date()) {
      return NextResponse.json({ error: 'Code invalid or expired.' }, { status: 401 });
    }

    if (hashCode(code) !== challenge.code_hash) {
      return NextResponse.json({ error: 'Code invalid or expired.' }, { status: 401 });
    }

    const { error: updateError } = await service
      .from('auth_challenges')
      .update({ usado: true })
      .eq('id', challenge.id)
      .eq('usado', false);

    if (updateError) {
      return NextResponse.json({ error: 'Code invalid or expired.' }, { status: 401 });
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
    return NextResponse.json({ error: 'Error validating 2FA.' }, { status: 500 });
  }
}
