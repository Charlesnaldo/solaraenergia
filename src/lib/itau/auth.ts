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

interface JwtClaims {
  aud?: string | string[];
  env?: string;
  exp?: number;
  iss?: string;
  scope?: string;
  sub?: string;
  [key: string]: unknown;
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

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');

  return Buffer.from(base64, 'base64').toString('utf8');
}

function decodeJwtClaims(token: string): JwtClaims | null {
  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as JwtClaims;
  } catch {
    return null;
  }
}

function maskScope(scope: string) {
  return scope.startsWith('appid-') ? 'appid-***' : scope;
}

export function getItauCachedTokenDiagnostics() {
  if (!cache) {
    return {
      scope_count: 0,
      scopes: [] as string[],
      has_emissao_cobranca_scope: false,
      has_qrcode_scope: false,
      issuer: null as string | null,
      audience: null as string | string[] | null,
      token_env: null as string | null,
      subject_matches_client_id: null as boolean | null,
    };
  }

  const claims = decodeJwtClaims(cache.token);
  const scopes = (claims?.scope ?? '')
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  return {
    scope_count: scopes.length,
    scopes: scopes.map(maskScope),
    has_emissao_cobranca_scope: scopes.includes('cash_management/emissaocobranca.write'),
    has_qrcode_scope:
      scopes.includes('cash-management/receipts/qrcode.post') ||
      scopes.includes('cash-management/receipts/qrcode') ||
      scopes.includes('cob.write') ||
      scopes.includes('cobv.write'),
    issuer: claims?.iss ?? null,
    audience: claims?.aud ?? null,
    token_env: claims?.env ?? null,
    subject_matches_client_id: claims?.sub && process.env.ITAU_CLIENT_ID ? claims.sub === process.env.ITAU_CLIENT_ID.trim() : null,
  };
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
