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
      return NextResponse.json({ error: 'CPF/CNPJ e token sao obrigatórios.' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();

    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('cpf_cnpj', cpfCnpj)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const { data: tokenRow, error: tokenError } = await supabase
      .from('cliente_tokens')
      .select('*')
      .eq('cliente_id', cliente.id)
      .eq('token', token)
      .eq('usado', false)
      .gte('expira_em', new Date().toISOString())
      .maybeSingle();

    if (tokenError || !tokenRow) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const [consumoResult, faturamentoResult] = await Promise.all([
      assinatura?.id
        ? supabase
            .from('consumo_energia')
            .select('*')
            .eq('assinatura_id', assinatura.id)
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

    return NextResponse.json({
      cliente,
      assinatura,
      historicoConsumo: consumoResult.data ?? [],
      boletos: faturamentoResult.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao consultar dados do cliente.' }, { status: 500 });
  }
}

