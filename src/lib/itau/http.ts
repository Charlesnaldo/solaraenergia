import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

type RequestBody = string | Buffer | undefined;

export interface ItauRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: RequestBody;
  mtls?: boolean;
}

export interface ItauHttpResponse<T> {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  data: T;
  text: string;
}

let mtlsAgent: https.Agent | undefined;

function normalizePem(value: string | undefined) {
  return value?.trim().replace(/\\n/g, '\n');
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Configure ${name}.`);
  }

  return value;
}

function readPfxFromEnv() {
  const pfxBase64 = process.env.ITAU_PFX_BASE64?.trim();
  const pfxPath = process.env.ITAU_PFX_PATH?.trim();

  if (pfxBase64) {
    const passphrase = requireEnv('ITAU_PFX_PASSPHRASE');

    return {
      pfx: Buffer.from(pfxBase64, 'base64'),
      passphrase,
    };
  }

  if (!pfxPath) {
    return null;
  }

  const passphrase = requireEnv('ITAU_PFX_PASSPHRASE');
  const resolvedPath = path.isAbsolute(pfxPath)
    ? pfxPath
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), pfxPath);

  return {
    pfx: fs.readFileSync(resolvedPath),
    passphrase,
  };
}

function createMtlsAgent() {
  if (process.env.ITAU_MTLS_DISABLED === 'true') {
    return undefined;
  }

  if (mtlsAgent) {
    return mtlsAgent;
  }

  const pfxConfig = readPfxFromEnv();
  if (pfxConfig) {
    mtlsAgent = new https.Agent({
      ...pfxConfig,
      keepAlive: true,
      rejectUnauthorized: true,
    });

    return mtlsAgent;
  }

  const cert = normalizePem(process.env.ITAU_CERT);
  const key = normalizePem(process.env.ITAU_KEY);
  const ca = normalizePem(process.env.ITAU_CA);

  if (!cert || !key) {
    throw new Error('Configure ITAU_PFX_PATH e ITAU_PFX_PASSPHRASE, ou ITAU_CERT e ITAU_KEY, para chamadas mTLS do Itau.');
  }

  mtlsAgent = new https.Agent({
    cert,
    key,
    ca,
    keepAlive: true,
    rejectUnauthorized: true,
  });

  return mtlsAgent;
}

function parseJson<T>(text: string): T {
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export async function requestItauJson<T>(url: string, options: ItauRequestOptions): Promise<ItauHttpResponse<T>> {
  const parsedUrl = new URL(url);
  const body = options.body;
  const agent = options.mtls === false ? undefined : createMtlsAgent();

  return new Promise((resolve, reject) => {
    const req = https.request(
      parsedUrl,
      {
        method: options.method,
        headers: {
          ...options.headers,
          ...(body ? { 'Content-Length': String(Buffer.byteLength(body)) } : {}),
        },
        agent,
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');

          try {
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              data: parseJson<T>(text),
              text,
            });
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}
