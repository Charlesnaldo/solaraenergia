import { NextResponse } from 'next/server';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { FaturamentoStatus } from '@/lib/dashboard/types';

const allowedStatuses: FaturamentoStatus[] = ['gerado', 'pago', 'nao_pago'];

export async function PATCH(req: Request) {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { faturamentoId?: string; status?: FaturamentoStatus };
    const faturamentoId = body.faturamentoId?.trim();
    const status = body.status;

    if (!faturamentoId || !status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'faturamentoId e status valido sao obrigatorios.' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from('faturamento')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', faturamentoId)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Erro ao atualizar status.' }, { status: 500 });
    }

    return NextResponse.json({ faturamento: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
