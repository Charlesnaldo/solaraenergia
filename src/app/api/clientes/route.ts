import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';

function sanitizeDocument(value: string) {
  return value.replace(/\D/g, '');
}

async function requireAdmin() {
  return getAuthenticatedAdminUser();
}

export async function GET() {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ items: [] });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Supabase não configurado para escrita.' }, { status: 501 });
    }

    const body = (await req.json()) as {
      nome?: string;
      cpf_cnpj?: string;
      email?: string;
      telefone?: string;
      endereco_completo?: string;
      status_assinatura?: 'ativa' | 'inativa' | 'cancelada';
      valor_mensal?: number;
      dia_vencimento?: number;
    };

    const nome = body.nome?.trim();
    const cpfCnpj = sanitizeDocument(body.cpf_cnpj ?? '');
    const email = body.email?.trim();

    if (!nome || cpfCnpj.length < 11 || !email) {
      return NextResponse.json({ error: 'Dados obrigatórios inválidos.' }, { status: 400 });
    }

    const valorMensal = Number(body.valor_mensal ?? 0);
    const diaVencimento = Number(body.dia_vencimento ?? 10);
    if (valorMensal <= 0 || diaVencimento < 1 || diaVencimento > 31) {
      return NextResponse.json({ error: 'Valor mensal ou dia de vencimento inválido.' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();

    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .insert({
        nome,
        cpf_cnpj: cpfCnpj,
        email,
        telefone: body.telefone?.trim() || null,
        endereco_completo: body.endereco_completo?.trim() || null,
        status_assinatura: body.status_assinatura ?? 'ativa',
      })
      .select('*')
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json({ error: clienteError?.message ?? 'Erro ao criar cliente.' }, { status: 500 });
    }

    const { error: assinaturaError } = await supabase.from('assinaturas').insert({
      cliente_id: cliente.id,
      valor_mensal: valorMensal,
      dia_vencimento: diaVencimento,
      status: 'ativa',
    });

    if (assinaturaError) {
      return NextResponse.json({ error: assinaturaError.message }, { status: 500 });
    }

    return NextResponse.json({ cliente }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }
}
