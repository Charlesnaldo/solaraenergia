import type { AuthContext } from '@/middleware/auth';

export interface ClienteAccessRecord {
  id: string;
  email: string | null;
}

function readMetadataClienteId(auth: AuthContext) {
  const candidates = [
    auth.user.app_metadata?.cliente_id,
    auth.user.app_metadata?.clienteId,
  ];

  return candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? null;
}

export function authorizePdfAccess(auth: AuthContext, cliente: ClienteAccessRecord) {
  if (auth.isAdmin) {
    return true;
  }

  const metadataClienteId = readMetadataClienteId(auth);
  if (metadataClienteId && metadataClienteId === cliente.id) {
    return true;
  }

  const userEmail = auth.user.email?.trim().toLowerCase();
  const clienteEmail = cliente.email?.trim().toLowerCase();

  return Boolean(userEmail && clienteEmail && userEmail === clienteEmail);
}
