const WEBHOOK_SECRET_PARAM_NAMES = ['token', 'secret', 'webhook_secret', 'webhookSecret'];

export function getItauWebhookSecretFromUrl() {
  const rawUrl = process.env.ITAU_BOLETOS_NOTIFICACOES_URL?.trim();
  if (!rawUrl) {
    return '';
  }

  try {
    const url = new URL(rawUrl);
    for (const paramName of WEBHOOK_SECRET_PARAM_NAMES) {
      const value = url.searchParams.get(paramName)?.trim();
      if (value) {
        return value;
      }
    }
  } catch {
    return '';
  }

  return '';
}

export function getConfiguredItauWebhookSecret() {
  return (
    process.env.ITAU_WEBHOOK_SECRET?.trim() ||
    process.env.ITAU_WEBHOOK_TOKEN?.trim() ||
    getItauWebhookSecretFromUrl()
  );
}

export function hasConfiguredItauWebhookSecret() {
  return Boolean(getConfiguredItauWebhookSecret());
}
