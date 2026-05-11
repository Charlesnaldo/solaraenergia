import { requestItauJson } from '@/lib/itau/http';

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface ItauTokenResponse {
  access_token?: string;
  expires_in?: number;
}

let cache: TokenCache | null = null;

function getTokenUrl() {
  return process.env.ITAU_AUTH_URL?.trim() || process.env.ITAU_TOKEN_URL?.trim() || 'https://sts.itau.com.br/api/oauth/token';
}

export async function getItauAccessToken() {
  if (cache && Date.now() < cache.expiresAt - 30_000) {
    return cache.token;
  }

  const clientId = process.env.ITAU_CLIENT_ID?.trim();
  const clientSecret = process.env.ITAU_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('Configure ITAU_CLIENT_ID e ITAU_CLIENT_SECRET.');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  const response = await requestItauJson<ItauTokenResponse>(getTokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (response.status < 200 || response.status >= 300 || !response.data.access_token) {
    throw new Error(`Erro ao obter token Itau: ${response.status} ${response.text}`);
  }

  const expiresInMs = Number(response.data.expires_in ?? 300) * 1000;
  cache = {
    token: response.data.access_token,
    expiresAt: Date.now() + expiresInMs,
  };

  return cache.token;
}
