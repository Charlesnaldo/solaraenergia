import { NextResponse } from 'next/server';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';
import { getItauAccessToken, getItauCachedTokenDiagnostics, getItauCachedTokenExpiresIn } from '@/lib/itau/auth';
import { describeBolecodeEndpoint } from '@/lib/itau/bolecode';
import { getItauMtlsStatus } from '@/lib/itau/http';
import { hasConfiguredItauWebhookSecret } from '@/lib/itau/webhook';

export const runtime = 'nodejs';

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function isValidUrl(value: string | undefined) {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function maskUrl(value: string | undefined) {
  if (!value?.trim()) {
    return '';
  }

  try {
    const url = new URL(value);
    const pathPrefix = url.pathname === '/' ? '' : url.pathname.split('/').filter(Boolean).slice(0, 2).join('/');
    return `${url.protocol}//${url.hostname}${pathPrefix ? `/${pathPrefix}/...` : ''}`;
  } catch {
    return 'invalid_url';
  }
}

export async function GET() {
  const adminUser = await getAuthenticatedAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mtls = getItauMtlsStatus();
  const idBeneficiarioOk = hasEnv('ITAU_ID_BENEFICIARIO');
  const webhookUrlConfigured = isValidUrl(process.env.ITAU_BOLETOS_NOTIFICACOES_URL);
  const webhookSecretConfigured = hasConfiguredItauWebhookSecret();
  const apiUrlOk = isValidUrl(process.env.ITAU_API_URL);
  const boletoUrlOk = isValidUrl(process.env.ITAU_BOLETO_URL);
  const authEnvOk =
    hasEnv('ITAU_CLIENT_ID') &&
    hasEnv('ITAU_CLIENT_SECRET') &&
    isValidUrl(process.env.ITAU_AUTH_URL) &&
    mtls.pfxLoaded &&
    !mtls.mtlsDisabled &&
    process.env.ITAU_MOCK !== 'true';
  const envOk =
    authEnvOk &&
    (apiUrlOk || boletoUrlOk) &&
    idBeneficiarioOk &&
    webhookUrlConfigured &&
    webhookSecretConfigured;

  let tokenOk = false;
  let tokenExpiresIn = 0;
  let tokenDiagnostics = getItauCachedTokenDiagnostics();

  if (authEnvOk) {
    try {
      await getItauAccessToken();
      tokenExpiresIn = getItauCachedTokenExpiresIn();
      tokenDiagnostics = getItauCachedTokenDiagnostics();
      tokenOk = tokenExpiresIn > 0;
    } catch {
      tokenOk = false;
      tokenExpiresIn = 0;
    }
  }

  return NextResponse.json(
    {
      env_ok: envOk,
      pfx_loaded: mtls.pfxLoaded,
      token_ok: tokenOk,
      token_expires_in: tokenExpiresIn,
      token_diagnostics: tokenDiagnostics,
      api_base_url: maskUrl(process.env.ITAU_API_URL),
      boleto_url: maskUrl(process.env.ITAU_BOLETO_URL),
      bolecode_endpoint: describeBolecodeEndpoint(),
      id_beneficiario_ok: idBeneficiarioOk,
      webhook_url_configured: webhookUrlConfigured,
      webhook_secret_configured: webhookSecretConfigured,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
