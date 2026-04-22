import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

function sanitizeDocument(value: string) {
  return value.replace(/\D/g, '');
}

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Portal indisponível: Supabase não configurado.' }, { status: 501 });
    }

    const body = (await req.json()) as {
      cpfCnpj?: string;
      token?: string;
    };

    const cpfCnpj = sanitizeDocument(body.cpfCnpj ?? '');
    const token = body.token?.trim();

    if (cpfCnpj.length < 11 || !token) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    const supabase = createSupabaseServiceClient();

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj')
      .eq('cpf_cnpj', cpfCnpj)
      .single();

    if (!cliente) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    const { data: tokenRow } = await supabase
      .from('cliente_tokens')
      .select('id')
      .eq('cliente_id', cliente.id)
      .eq('token', token)
      .eq('usado', false)
      .gte('expira_em', new Date().toISOString())
      .maybeSingle();

    if (!tokenRow) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const assinaturaId = assinatura?.id ?? null;

    const [consumoResult, faturamentoResult] = await Promise.all([
      assinaturaId
        ? supabase
            .from('consumo_energia')
            .select('*')
            .eq('assinatura_id', assinaturaId)
            .order('referencia', { ascending: false })
            .limit(12)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('faturamento')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('data_vencimento', { ascending: false })
        .limit(12),
    ]);

    const { error: markUsedError } = await supabase
      .from('cliente_tokens')
      .update({ usado: true })
      .eq('id', tokenRow.id)
      .eq('usado', false);

    if (markUsedError) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    return NextResponse.json({
      cliente,
      assinatura,
      historicoConsumo: consumoResult.data ?? [],
      boletos: faturamentoResult.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }
}
