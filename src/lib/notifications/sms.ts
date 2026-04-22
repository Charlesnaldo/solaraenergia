interface SendSmsInput {
  to: string;
  message: string;
}

export async function sendSmsMessage(input: SendSmsInput) {
  const mockMode = process.env.SMS_MOCK === 'true';
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;

  if (mockMode || !apiUrl || !apiKey) {
    return {
      ok: true,
      mocked: true,
      reason: !apiUrl || !apiKey ? 'SMS_API_URL ou SMS_API_KEY ausentes. Use SMS_MOCK=true para testes.' : 'SMS_MOCK=true',
    };
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: input.to,
      message: input.message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao enviar SMS: ${response.status}`);
  }

  return { ok: true, mocked: false };
}
