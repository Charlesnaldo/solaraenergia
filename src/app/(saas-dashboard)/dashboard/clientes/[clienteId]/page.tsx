import { ClientDetailPageContent } from '@/components/dashboard/client-panels';

export default async function ClienteDetalhePage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = await params;

  return <ClientDetailPageContent clientId={clienteId} />;
}
