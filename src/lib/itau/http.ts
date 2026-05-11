import https from 'node:https';

type RequestBody = string | Buffer | undefined;

interface ItauRequestOptions {
  method: 'GET' | 'POST' | 'PATCH';
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

function normalizePem(value: string | undefined) {
  return value?.trim().replace(/\\n/g, '\n');
}

function createMtlsAgent() {
  if (process.env.ITAU_MTLS_DISABLED === 'true') {
    return undefined;
  }

  const cert = normalizePem(process.env.ITAU_CERT);
  const key = normalizePem(process.env.ITAU_KEY);
  const ca = normalizePem(process.env.ITAU_CA);

  if (!cert || !key) {
    throw new Error('Configure ITAU_CERT e ITAU_KEY para chamadas mTLS do Itau.');
  }

  return new https.Agent({
    cert,
    key,
    ca,
    keepAlive: true,
    rejectUnauthorized: true,
  });
}

function parseJson<T>(text: string): T {
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
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
