import { BillingDetailPageContent } from '@/components/dashboard/billing-detail';

export default async function FaturamentoDetalhePage({ params }: { params: Promise<{ faturamentoId: string }> }) {
  const { faturamentoId } = await params;

  return <BillingDetailPageContent faturamentoId={faturamentoId} />;
}
