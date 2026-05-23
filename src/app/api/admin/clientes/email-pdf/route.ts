import { NextResponse } from 'next/server';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';
import { sendBoletoPdfEmail } from '@/lib/notifications/email';
import { getFaturamentoForPdf, isUuid } from '@/services/faturamentoService';
import { createFaturamentoPdf, logPdfGeneration } from '@/services/pdfService';

function getRequestIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null
  );
}

export async function POST(req: Request) {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { faturamentoId?: string };
    const faturamentoId = body.faturamentoId?.trim() ?? '';

    if (!isUuid(faturamentoId)) {
      return NextResponse.json({ error: 'faturamentoId valido e obrigatorio.' }, { status: 400 });
    }

    const faturamento = await getFaturamentoForPdf(faturamentoId);
    if (!faturamento) {
      return NextResponse.json({ error: 'Faturamento nao encontrado.' }, { status: 404 });
    }

    if (!faturamento.clientes.email) {
      return NextResponse.json({ error: 'Cliente nao possui e-mail valido.' }, { status: 400 });
    }

    const amount = Number(faturamento.valor);
    if (!Number.isFinite(amount) || amount <= 0 || !faturamento.data_vencimento) {
      return NextResponse.json({ error: 'Dados do faturamento invalidos.' }, { status: 400 });
    }

    const pdf = createFaturamentoPdf(faturamento);
    await logPdfGeneration({
      usuarioId: adminUser.id,
      clienteId: faturamento.cliente_id,
      faturamentoId: faturamento.id,
      ip: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    const emailResult = await sendBoletoPdfEmail({
      to: faturamento.clientes.email,
      clientName: faturamento.clientes.nome,
      dueDate: faturamento.data_vencimento,
      amount,
      pdfBuffer: pdf,
    });

    return NextResponse.json({ ok: true, emailResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar e-mail.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
