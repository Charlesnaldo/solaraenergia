import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sendSmsMessage } from '@/lib/notifications/sms';

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
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
    const user = await getSupabaseUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = user.phone || user.user_metadata?.phone || user.app_metadata?.phone;
    if (!phone) {
      return NextResponse.json({ error: 'User without phone number for SMS.' }, { status: 400 });
    }

    const code = String(crypto.randomInt(100000, 999999));
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
      return NextResponse.json({ error: 'Error creating 2FA challenge.' }, { status: 500 });
    }

    const smsResult = await sendSmsMessage({
      to: phone,
      message: `Your Solara code is ${code}. It expires in 10 minutes.`,
    });

    return NextResponse.json({ challengeId: challenge.id, smsResult });
  } catch {
    return NextResponse.json({ error: 'Error starting 2FA.' }, { status: 500 });
  }
}
