import { NextResponse } from 'next/server';
import { mockOverview } from '@/lib/dashboard/mock';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';
import type { DashboardOverview, MonthlyBillingPoint } from '@/lib/dashboard/types';

function monthLabel(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

export async function GET() {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(mockOverview);
    }

    const supabase = createSupabaseServiceClient();

    const [{ data: clientes }, { data: assinaturas }, { data: faturamento }, { data: usinas }] = await Promise.all([
      supabase.from('clientes').select('*').order('created_at', { ascending: false }),
      supabase.from('assinaturas').select('*'),
      supabase.from('faturamento').select('*').order('created_at', { ascending: false }),
      supabase.from('usinas').select('*').order('updated_at', { ascending: false }).limit(1),
    ]);

    const clientesRows = clientes ?? [];
    const assinaturasRows = assinaturas ?? [];
    const faturamentoRows = faturamento ?? [];

    const mrr = assinaturasRows
      .filter((a) => a.status === 'ativa')
      .reduce((sum, a) => sum + Number(a.valor_mensal ?? 0), 0);

    const clientesAtivos = clientesRows.filter((c) => c.status_assinatura === 'ativa').length;

    const pendentesOuAtrasados = faturamentoRows.filter((f) => f.status === 'pendente' || f.status === 'atrasado');
    const atrasados = pendentesOuAtrasados.filter((f) => f.status === 'atrasado').length;
    const inadimplenciaPercentual = pendentesOuAtrasados.length
      ? Number(((atrasados / pendentesOuAtrasados.length) * 100).toFixed(1))
      : 0;

    const monthlyMap = new Map<string, number>();
    faturamentoRows.forEach((f) => {
      if (!f.data_vencimento) {
        return;
      }
      const key = String(f.data_vencimento).slice(0, 7);
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(f.valor ?? 0));
    });

    const monthlyBilling: MonthlyBillingPoint[] = [...monthlyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([mes, total]) => ({ mes: monthLabel(`${mes}-01`), total }));

    const overview: DashboardOverview = {
      mrr,
      clientesAtivos,
      inadimplenciaPercentual,
      saudeUsinaPercentual: Number(usinas?.[0]?.saude_percentual ?? 0),
      geracaoTempoRealKw: Number(usinas?.[0]?.geracao_tempo_real_kw ?? 0),
      monthlyBilling,
      clientes: clientesRows.map((cliente) => {
        const assinatura = assinaturasRows.find((a) => a.cliente_id === cliente.id && a.status === 'ativa') ?? null;
        const ultimoFaturamento = faturamentoRows.find((f) => f.cliente_id === cliente.id) ?? null;
        return {
          ...cliente,
          assinatura,
          ultimoFaturamento,
        };
      }),
    };

    return NextResponse.json(overview);
  } catch {
    return NextResponse.json(mockOverview);
  }
}
