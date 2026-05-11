import { NextResponse } from 'next/server';
import { gerarBoletoParaCliente } from '@/lib/billing/boletos';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
      itens?: Array<{
        clienteId: string;
        valor: number;
        dataVencimento: string;
      }>;
    };

    const itens = body.itens ?? [];
    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'Envie ao menos um item para faturamento.' }, { status: 400 });
    }

    const resultados = await Promise.allSettled(
      itens.map((item) =>
        gerarBoletoParaCliente({
          clienteId: item.clienteId,
          valor: Number(item.valor),
          dataVencimento: item.dataVencimento,
        })
      )
    );

    const sucesso = resultados
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof gerarBoletoParaCliente>>> => r.status === 'fulfilled')
      .map((r) => r.value);

    const falhas = resultados
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => (r.reason instanceof Error ? r.reason.message : 'Falha desconhecida'));

    return NextResponse.json({
      total: itens.length,
      sucesso: sucesso.length,
      falhas,
      faturamentos: sucesso,
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar faturamento do mês.' }, { status: 500 });
  }
}
