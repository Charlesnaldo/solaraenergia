import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';

function sanitizeDocument(value: string) {
  return value.replace(/\D/g, '');
}

async function verifyAdminPassword(password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminUser = await getAuthenticatedAdminUser();

  if (!url || !anonKey || !adminUser?.email) {
    return false;
  }

  const authClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await authClient.auth.signInWithPassword({
    email: adminUser.email,
    password,
  });

  return !error;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAuthenticatedAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    adminPassword?: string;
    nome?: string;
    cpf_cnpj?: string;
    email?: string;
    telefone?: string;
    whatsapp?: string;
    endereco_completo?: string;
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    complemento?: string;
    responsavel?: string;
    cargo_responsavel?: string;
    observacoes?: string;
    status_assinatura?: 'ativa' | 'inativa' | 'cancelada';
  };

  if (!body.adminPassword || !(await verifyAdminPassword(body.adminPassword))) {
    return NextResponse.json({ error: 'Senha do administrador inválida.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const payload = {
    nome: body.nome?.trim(),
    cpf_cnpj: body.cpf_cnpj ? sanitizeDocument(body.cpf_cnpj) : undefined,
    email: body.email?.trim() || null,
    telefone: body.telefone?.trim() || null,
    whatsapp: body.whatsapp?.trim() || null,
    endereco_completo: body.endereco_completo?.trim() || null,
    rua: body.rua?.trim() || null,
    numero: body.numero?.trim() || null,
    bairro: body.bairro?.trim() || null,
    cidade: body.cidade?.trim() || null,
    estado: body.estado?.trim() || null,
    cep: body.cep?.trim() || null,
    complemento: body.complemento?.trim() || null,
    responsavel: body.responsavel?.trim() || null,
    cargo_responsavel: body.cargo_responsavel?.trim() || null,
    observacoes: body.observacoes?.trim() || null,
    status_assinatura: body.status_assinatura,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao atualizar cliente.' }, { status: 500 });
  }

  return NextResponse.json({ cliente: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAuthenticatedAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { adminPassword?: string };
  if (!body.adminPassword || !(await verifyAdminPassword(body.adminPassword))) {
    return NextResponse.json({ error: 'Senha do administrador inválida.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
