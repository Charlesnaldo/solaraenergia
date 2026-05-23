import { type NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';
import { authorizePdfAccess } from '@/middleware/authorizePdfAccess';
import { getFaturamentoForPdf, isUuid } from '@/services/faturamentoService';
import { createFaturamentoPdf, logPdfGeneration } from '@/services/pdfService';

export const runtime = 'nodejs';

function getRequestIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

export async function GET(_req: NextRequest, context: { params: Promise<{ clienteId: string; faturamentoId: string }> }) {
  const request = _req;

  try {
    const { clienteId, faturamentoId } = await context.params;

    if (!isUuid(clienteId) || !isUuid(faturamentoId)) {
      return NextResponse.json({ error: 'clienteId e faturamentoId devem ser UUIDs validos.' }, { status: 400 });
    }

    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    }

    const faturamento = await getFaturamentoForPdf(faturamentoId);
    if (!faturamento) {
      return NextResponse.json({ error: 'Faturamento nao encontrado.' }, { status: 404 });
    }

    if (faturamento.cliente_id !== clienteId) {
      return NextResponse.json({ error: 'Faturamento nao encontrado para este cliente.' }, { status: 404 });
    }

    if (!authorizePdfAccess(auth, { id: clienteId, email: faturamento.clientes.email })) {
      return NextResponse.json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const amount = Number(faturamento.valor);
    if (!Number.isFinite(amount) || amount <= 0 || !faturamento.data_vencimento) {
      return NextResponse.json({ error: 'Dados do faturamento invalidos.' }, { status: 400 });
    }

    const pdf = await createFaturamentoPdf(faturamento);
    await logPdfGeneration({
      usuarioId: auth.user.id,
      clienteId,
      faturamentoId,
      ip: getRequestIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="boleto-${clienteId}-${faturamento.data_vencimento}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar PDF.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
