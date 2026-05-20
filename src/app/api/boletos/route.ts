import { NextResponse } from 'next/server';
import { gerarBoletoParaCliente } from '@/lib/billing/boletos';
import { getAuthenticatedAdminUser, verifyAdminPassword } from '@/lib/auth/admin';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

function parseMoney(value: unknown) {
  const raw = typeof value === 'string' ? value.trim().replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(raw ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(req: Request) {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
      clienteId?: string;
      valor?: string | number;
      dataVencimento?: string;
      simulacao?: boolean;
      etapa_processo_boleto?: string;
    };

    const clienteId = body.clienteId?.trim();
    const valor = parseMoney(body.valor);
    const dataVencimento = body.dataVencimento?.trim();
    const etapaProcessoBoleto = body.etapa_processo_boleto?.trim();
    const simulacao = body.simulacao === true || etapaProcessoBoleto === 'Simulacao';

    if (!clienteId) {
      return NextResponse.json({ error: 'Cliente obrigatorio para gerar boleto.' }, { status: 400 });
    }

    if (valor <= 0) {
      return NextResponse.json({ error: 'Informe um valor valido para gerar boleto.' }, { status: 400 });
    }

    if (!dataVencimento) {
      return NextResponse.json({ error: 'Informe a data de vencimento para gerar boleto.' }, { status: 400 });
    }

    if (etapaProcessoBoleto && etapaProcessoBoleto !== 'Simulacao') {
      return NextResponse.json({ error: 'Para teste seguro, use etapa_processo_boleto: "Simulacao".' }, { status: 400 });
    }

    const faturamento = await gerarBoletoParaCliente({
      clienteId,
      valor,
      dataVencimento,
      simulacao,
    });

    return NextResponse.json({ faturamento }, { status: simulacao ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno ao gerar boleto.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { faturamentoId?: string; adminPassword?: string };
    const faturamentoId = body.faturamentoId?.trim();

    if (!faturamentoId) {
      return NextResponse.json({ error: 'faturamentoId e obrigatorio.' }, { status: 400 });
    }

    if (!body.adminPassword || !(await verifyAdminPassword(body.adminPassword))) {
      return NextResponse.json({ error: 'Senha do administrador invalida.' }, { status: 401 });
    }

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('faturamento').delete().eq('id', faturamentoId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir boleto.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
