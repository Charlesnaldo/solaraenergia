const encoder = new TextEncoder();

function getTwoFactorSecret() {
  return process.env.ADMIN_2FA_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

async function signTwoFactorPayload(payload: string) {
  const secret = getTwoFactorSecret();
  if (!secret) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toHex(signature);
}

export async function createTwoFactorCookieValue(userId: string) {
  const signature = await signTwoFactorPayload(userId);
  if (!signature) {
    throw new Error('Missing ADMIN_2FA_SECRET or SUPABASE_SERVICE_ROLE_KEY for 2FA cookie signing.');
  }

  return `${userId}.${signature}`;
}

export async function isTwoFactorCookieValid(cookieValue: string | undefined, userId: string | undefined) {
  if (!cookieValue || !userId) {
    return false;
  }

  const separatorIndex = cookieValue.lastIndexOf('.');
  if (separatorIndex <= 0) {
    return false;
  }

  const cookieUserId = cookieValue.slice(0, separatorIndex);
  const cookieSignature = cookieValue.slice(separatorIndex + 1);

  if (cookieUserId !== userId || !/^[a-f0-9]{64}$/i.test(cookieSignature)) {
    return false;
  }

  const expectedSignature = await signTwoFactorPayload(userId);
  return expectedSignature ? constantTimeEqual(cookieSignature, expectedSignature) : false;
}
