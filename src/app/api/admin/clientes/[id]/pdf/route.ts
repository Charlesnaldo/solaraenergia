import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';
import { createBoletoPdfBuffer } from '@/lib/billing/pdf';

function parseMoney(value: string | null) {
  const raw = value?.trim().replace(/\./g, '').replace(',', '.') ?? '';
  const parsed = Number(raw || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const url = new URL(req.url);
    const valor = parseMoney(url.searchParams.get('valor'));
    const dueDate = url.searchParams.get('dueDate')?.trim() ?? '';
    const shouldDownload = url.searchParams.get('download') === '1';

    if (!id || valor <= 0 || !dueDate) {
      return NextResponse.json({ error: 'id, valor e dueDate sao obrigatorios.' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj')
      .eq('id', id)
      .single();

    if (error || !cliente) {
      return NextResponse.json({ error: 'Cliente nao encontrado.' }, { status: 404 });
    }

    const { data: ultimoFaturamento } = await supabase
      .from('faturamento')
      .select('id, boleto_url, linha_digitavel, codigo_barras, pix_qr_code, pix_url')
      .eq('cliente_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let faturamento = ultimoFaturamento;

    if (!faturamento) {
      const { data: assinatura } = await supabase
        .from('assinaturas')
        .select('id')
        .eq('cliente_id', id)
        .eq('status', 'ativa')
        .maybeSingle();

      const { data: novoFaturamento, error: novoFaturamentoError } = await supabase
        .from('faturamento')
        .insert({
          cliente_id: id,
          assinatura_id: assinatura?.id ?? null,
          valor,
          data_vencimento: dueDate,
          status: 'gerado',
        })
        .select('id, boleto_url, linha_digitavel, codigo_barras, pix_qr_code, pix_url')
        .single();

      if (novoFaturamentoError || !novoFaturamento) {
        return NextResponse.json({ error: novoFaturamentoError?.message ?? 'Erro ao criar faturamento para PDF.' }, { status: 500 });
      }

      faturamento = novoFaturamento;
    }

    const pdf = createBoletoPdfBuffer({
      clientName: cliente.nome,
      clientDocument: cliente.cpf_cnpj,
      amount: valor,
      dueDate,
      boletoUrl: faturamento.boleto_url ?? null,
      linhaDigitavel: faturamento.linha_digitavel ?? null,
      codigoBarras: faturamento.codigo_barras ?? null,
      pixUrl: faturamento.pix_url ?? null,
      pixQrCode: faturamento.pix_qr_code ?? null,
    });

    const filename = `boleto-${cliente.id}-${dueDate}.pdf`;
    const { error: updateError } = await supabase
      .from('faturamento')
      .update({
        valor,
        data_vencimento: dueDate,
        pdf_base64: pdf.toString('base64'),
        pdf_filename: filename,
        pdf_content_type: 'application/pdf',
        pdf_gerado_em: new Date().toISOString(),
      })
      .eq('id', faturamento.id);

    if (updateError) {
      return NextResponse.json({ error: `Erro ao armazenar PDF: ${updateError.message}` }, { status: 500 });
    }

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${shouldDownload ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar PDF.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
