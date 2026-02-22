import { NextResponse } from 'next/server';
import { gerarBoletoParaCliente } from '@/lib/billing/boletos';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      clienteId?: string;
      valor?: number;
      dataVencimento?: string;
    };

    const clienteId = body.clienteId?.trim();
    const valor = Number(body.valor ?? 0);
    const dataVencimento = body.dataVencimento?.trim();

    if (!clienteId || valor <= 0 || !dataVencimento) {
      return NextResponse.json({ error: 'clienteId, valor e dataVencimento são obrigatórios.' }, { status: 400 });
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

