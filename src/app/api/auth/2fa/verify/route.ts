import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function getCookieClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase não configurado.');
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { challengeId?: string; code?: string };
    const challengeId = body.challengeId?.trim();
    const code = body.code?.trim();

    if (!challengeId || !code) {
      return NextResponse.json({ error: 'challengeId e code são obrigatórios.' }, { status: 400 });
    }

    const supabase = getCookieClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
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
      return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 401 });
    }

    if (hashCode(code) !== challenge.code_hash) {
      return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 401 });
    }

    const { error: updateError } = await service
      .from('auth_challenges')
      .update({ usado: true })
      .eq('id', challenge.id)
      .eq('usado', false);

    if (updateError) {
      return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set('solara_admin_2fa', user.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erro ao validar 2FA.' }, { status: 500 });
  }
}

