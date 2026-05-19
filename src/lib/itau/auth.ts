import crypto from 'node:crypto';
import { requestItauJson } from '@/lib/itau/http';

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface ItauTokenResponse {
  access_token?: string;
  expires_in?: number;
}

const TOKEN_RENEWAL_SKEW_MS = 30_000;

let cache: TokenCache | null = null;
let pendingTokenRequest: Promise<string> | null = null;

function getTokenUrl() {
  return process.env.ITAU_AUTH_URL?.trim() || process.env.ITAU_TOKEN_URL?.trim() || 'https://sts.itau.com.br/api/oauth/token';
}

function getValidCachedToken() {
  if (cache && Date.now() < cache.expiresAt - TOKEN_RENEWAL_SKEW_MS) {
    return cache.token;
  }

  return null;
}

async function requestNewAccessToken() {
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
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-itau-correlationID': crypto.randomUUID(),
      'x-itau-flowID': crypto.randomUUID(),
    },
    body,
  });

  if (response.status < 200 || response.status >= 300 || !response.data.access_token) {
    throw new Error(`Erro ao obter token Itau: HTTP ${response.status}.`);
  }

  const expiresInMs = Number(response.data.expires_in ?? 300) * 1000;
  cache = {
    token: response.data.access_token,
    expiresAt: Date.now() + expiresInMs,
  };

  return cache.token;
}

export function clearItauAccessTokenCache() {
  cache = null;
  pendingTokenRequest = null;
}

export function getItauCachedTokenExpiresIn() {
  if (!cache) {
    return 0;
  }

  return Math.max(0, Math.floor((cache.expiresAt - Date.now()) / 1000));
}

export async function getItauAccessToken(options: { forceRefresh?: boolean } = {}) {
  if (!options.forceRefresh) {
    const cachedToken = getValidCachedToken();
    if (cachedToken) {
      return cachedToken;
    }

    if (pendingTokenRequest) {
      return pendingTokenRequest;
    }
  }

  pendingTokenRequest = requestNewAccessToken().finally(() => {
    pendingTokenRequest = null;
  });

  return pendingTokenRequest;
}
