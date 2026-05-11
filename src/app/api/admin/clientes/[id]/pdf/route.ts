import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';
import { createBoletoPdfBuffer } from '@/lib/billing/pdf';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const url = new URL(req.url);
    const valor = Number(url.searchParams.get('valor') ?? 0);
    const dueDate = url.searchParams.get('dueDate')?.trim() ?? '';

    if (!id || valor <= 0 || !dueDate) {
      return NextResponse.json({ error: 'id, valor e dueDate são obrigatórios.' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj')
      .eq('id', id)
      .single();

    if (error || !cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const { data: faturamento } = await supabase
      .from('faturamento')
      .select('boleto_url, linha_digitavel, codigo_barras, pix_url')
      .eq('cliente_id', id)
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

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="boleto-${id}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar PDF.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
