import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';
import { createBoletoPdfBuffer } from '@/lib/billing/pdf';
import { sendBoletoPdfEmail } from '@/lib/notifications/email';

export async function POST(req: Request) {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { clienteId?: string; valor?: number; dueDate?: string };
    const clienteId = body.clienteId?.trim();
    const valor = Number(body.valor ?? 0);
    const dueDate = body.dueDate?.trim();

    if (!clienteId || valor <= 0 || !dueDate) {
      return NextResponse.json({ error: 'clienteId, valor e dueDate são obrigatórios.' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj, email')
      .eq('id', clienteId)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    if (!cliente.email) {
      return NextResponse.json({ error: 'Cliente não possui e-mail válido.' }, { status: 400 });
    }

    const { data: faturamento } = await supabase
      .from('faturamento')
      .select('boleto_url, linha_digitavel, codigo_barras, pix_url')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const pdf = createBoletoPdfBuffer({
      clientName: cliente.nome,
      clientDocument: cliente.cpf_cnpj,
      amount: valor,
      dueDate,
      boletoUrl: faturamento?.boleto_url ?? null,
      linhaDigitavel: faturamento?.linha_digitavel ?? null,
      codigoBarras: faturamento?.codigo_barras ?? null,
      pixUrl: faturamento?.pix_url ?? null,
    });

    const emailResult = await sendBoletoPdfEmail({
      to: cliente.email,
      clientName: cliente.nome,
      dueDate,
      amount: valor,
      pdfBuffer: pdf,
    });

    return NextResponse.json({ ok: true, emailResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar e-mail.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
