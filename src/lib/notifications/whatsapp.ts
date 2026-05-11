interface SendWhatsappInput {
  to: string;
  message: string;
}

export async function sendWhatsappMessage(input: SendWhatsappInput) {
  const mockMode = process.env.WHATSAPP_MOCK === 'true';
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (mockMode || !apiUrl || !apiKey) {
    return {
      ok: true,
      mocked: true,
      reason: !apiUrl || !apiKey ? 'WHATSAPP_API_URL ou WHATSAPP_API_KEY ausentes. Use WHATSAPP_MOCK=true para testes.' : 'WHATSAPP_MOCK=true',
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
    throw new Error(`Falha ao enviar WhatsApp: ${response.status}`);
  }

  return { ok: true, mocked: false };
}
