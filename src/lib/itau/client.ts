import crypto from 'node:crypto';
import { clearItauAccessTokenCache, getItauAccessToken } from '@/lib/itau/auth';
import { requestItauJson, type ItauHttpResponse, type ItauRequestOptions } from '@/lib/itau/http';

type AuthenticatedItauRequestOptions = Omit<ItauRequestOptions, 'mtls'>;

function withAuthorization(options: AuthenticatedItauRequestOptions, token: string): ItauRequestOptions {
  const clientId = process.env.ITAU_CLIENT_ID?.trim();

  return {
    ...options,
    headers: {
      ...(clientId ? { 'x-itau-apikey': clientId } : {}),
      'x-itau-correlationID': crypto.randomUUID(),
      'x-itau-flowID': crypto.randomUUID(),
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

function shouldRetryWithFreshToken(status: number) {
  return status === 401 || status === 403;
}

export async function requestItauApiJson<T>(
  url: string,
  options: AuthenticatedItauRequestOptions,
): Promise<ItauHttpResponse<T>> {
  const token = await getItauAccessToken();
  const response = await requestItauJson<T>(url, withAuthorization(options, token));

  if (!shouldRetryWithFreshToken(response.status)) {
    return response;
  }

  clearItauAccessTokenCache();
  const freshToken = await getItauAccessToken({ forceRefresh: true });

  return requestItauJson<T>(url, withAuthorization(options, freshToken));
}
