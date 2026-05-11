import { NextResponse } from 'next/server';
import { gerarBoletoParaCliente } from '@/lib/billing/boletos';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';

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
    };

    const clienteId = body.clienteId?.trim();
    const valor = parseMoney(body.valor);
    const dataVencimento = body.dataVencimento?.trim();

    if (!clienteId) {
      return NextResponse.json({ error: 'Cliente obrigatorio para gerar boleto.' }, { status: 400 });
    }

    if (valor <= 0) {
      return NextResponse.json({ error: 'Informe um valor valido para gerar boleto.' }, { status: 400 });
    }

    if (!dataVencimento) {
      return NextResponse.json({ error: 'Informe a data de vencimento para gerar boleto.' }, { status: 400 });
    }

    const faturamento = await gerarBoletoParaCliente({
      clienteId,
      valor,
      dataVencimento,
    });

    return NextResponse.json({ faturamento }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno ao gerar boleto.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
