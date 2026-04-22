import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sendSmsMessage } from '@/lib/notifications/sms';

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function getCookieClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase not configured.');
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}

export async function POST() {
  try {
    const supabase = await getCookieClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

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
