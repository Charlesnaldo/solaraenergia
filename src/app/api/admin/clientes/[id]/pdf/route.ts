import { NextRequest, NextResponse } from 'next/server';
import { isUuid } from '@/services/faturamentoService';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const faturamentoId = url.searchParams.get('faturamentoId')?.trim() ?? '';

  if (!isUuid(id) || !isUuid(faturamentoId)) {
    return NextResponse.json({ error: 'Use /api/clientes/:clienteId/faturamentos/:faturamentoId/pdf.' }, { status: 400 });
  }

  return NextResponse.redirect(new URL(`/api/clientes/${id}/faturamentos/${faturamentoId}/pdf`, req.url), 307);
}
