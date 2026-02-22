import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sendBoletoEmail } from '@/lib/notifications/email';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { faturamentoId?: string };
    const faturamentoId = body.faturamentoId?.trim();

    if (!faturamentoId) {
      return NextResponse.json({ error: 'faturamentoId é obrigatório.' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from('faturamento')
      .select('id, valor, data_vencimento, boleto_url, clientes!inner(nome, email)')
      .eq('id', faturamentoId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Faturamento não encontrado.' }, { status: 404 });
    }

    if (!data.boleto_url) {
      return NextResponse.json({ error: 'Este faturamento não possui URL de boleto.' }, { status: 400 });
    }

    const clienteInfo = Array.isArray(data.clientes) ? data.clientes[0] : data.clientes;
    if (!clienteInfo?.email || !clienteInfo?.nome) {
      return NextResponse.json({ error: 'Cliente vinculado ao faturamento não possui e-mail válido.' }, { status: 400 });
    }

    const emailResult = await sendBoletoEmail({
      to: clienteInfo.email,
      clientName: clienteInfo.nome,
      boletoUrl: data.boleto_url,
      dueDate: data.data_vencimento,
      amount: Number(data.valor),
    });

    return NextResponse.json({ ok: true, emailResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar e-mail.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
