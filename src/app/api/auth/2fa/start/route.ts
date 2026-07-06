import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sendSmsMessage } from '@/lib/notifications/sms';

function readUserRole(user: { app_metadata?: { role?: string }; user_metadata?: { role?: string } } | null | undefined) {
  return user?.app_metadata?.role ?? user?.user_metadata?.role ?? null;
}

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function getTemporaryTestCode() {
  const code = process.env.ADMIN_2FA_TEST_CODE?.trim();
  return code && /^\d{6}$/.test(code) ? code : null;
}

function isAdminUser(user: Awaited<ReturnType<typeof getSupabaseUser>>) {
  const role = readUserRole(user);
  return role === 'admin' || role === 'service_role';
}

function getRoleError(user: Awaited<ReturnType<typeof getSupabaseUser>>) {
  const role = readUserRole(user);

  if (!role) {
    return 'User without admin role.';
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

    const phone = user.phone || user.user_metadata?.phone || user.app_metadata?.phone;
    if (!phone) {
      return NextResponse.json({ error: 'User without phone number for SMS.' }, { status: 400 });
    }

    const temporaryTestCode = getTemporaryTestCode();
    if (process.env.NODE_ENV === 'production' && process.env.SMS_MOCK === 'true' && !temporaryTestCode) {
      return NextResponse.json({ error: 'SMS mock cannot be enabled in production.' }, { status: 500 });
    }

    const code = temporaryTestCode ?? generateOtpCode();
    const codeHash = hashCode(code);
    const expireAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const service = createSupabaseServiceClient();
    const { data: challenge, error } = await service
      .from('auth_challenges')
      .insert({
        user_id: user.id,
        phone,
        code_hash: codeHash,
        expira_em: expireAt,
        usado: false,
      })
      .select('id')
      .single();

    if (error || !challenge) {
      console.error('2FA challenge insert failed', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });

      return NextResponse.json(
        {
          error: error?.message ?? 'Error creating 2FA challenge.',
          details: error?.details ?? null,
          hint: error?.hint ?? null,
          code: error?.code ?? null,
        },
        { status: 500 },
      );
    }

    const smsResult = temporaryTestCode
      ? { ok: true, mocked: true, reason: 'Temporary ADMIN_2FA_TEST_CODE enabled.' }
      : await sendSmsMessage({
          to: phone,
          message: `Seu codigo Solara Admin e ${code}. Ele expira em 10 minutos.`,
        });

    return NextResponse.json({
      challengeId: challenge.id,
      smsResult,
      ...(process.env.NODE_ENV !== 'production' && smsResult.mocked ? { devCode: code } : {}),
    });
  } catch {
    return NextResponse.json({ error: 'Error starting 2FA.' }, { status: 500 });
  }
}







