import { Resend } from 'resend';

interface SendBoletoEmailInput {
  to: string;
  clientName: string;
  boletoUrl: string;
  dueDate: string;
  amount: number;
}

interface SendBoletoPdfEmailInput {
  to: string;
  clientName: string;
  dueDate: string;
  amount: number;
  pdfBuffer: Buffer;
}

interface SendPaymentConfirmedEmailInput {
  to: string;
  clientName: string;
  dueDate: string;
  amount: number;
  paidAt: string;
  faturamentoId: string;
}

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function requireHttpUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('URL de boleto invalida.');
  }

  return url.toString();
}

function formatDateBR(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export async function sendBoletoEmail(input: SendBoletoEmailInput) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.BILLING_FROM_EMAIL ?? 'Solara <financeiro@solaraenergia.com.br>';
  const mockMode = process.env.EMAIL_MOCK === 'true';
  const boletoUrl = requireHttpUrl(input.boletoUrl);

  const subject = `Boleto Solara - vencimento ${escapeHtml(input.dueDate)}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h2>Olá, ${escapeHtml(input.clientName)}</h2>
      <p>Seu boleto do mês já está disponível.</p>
      <p><strong>Valor:</strong> ${money(input.amount)}</p>
      <p><strong>Vencimento:</strong> ${escapeHtml(input.dueDate)}</p>
      <p><a href="${escapeHtml(boletoUrl)}" target="_blank" rel="noreferrer">Clique aqui para baixar o boleto</a></p>
      <p>Atenciosamente,<br/>Equipe Solara</p>
    </div>
  `;

  if (mockMode || !resendKey) {
    return {
      ok: true,
      mocked: true,
      reason: !resendKey
        ? 'RESEND_API_KEY não configurada. Use EMAIL_MOCK=true para testes explícitos.'
        : 'EMAIL_MOCK=true',
    };
  }

  const resend = new Resend(resendKey);
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Falha ao enviar e-mail: ${error.message}`);
  }

  return { ok: true, id: data?.id, mocked: false };
}

export async function sendPaymentConfirmedEmail(input: SendPaymentConfirmedEmailInput) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.BILLING_FROM_EMAIL ?? 'Solara <financeiro@solaraenergia.com.br>';
  const mockMode = process.env.EMAIL_MOCK === 'true';

  const subject = `Pagamento confirmado - Solara`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h2>Pagamento confirmado</h2>
      <p>Olá, ${escapeHtml(input.clientName)}.</p>
      <p>Recebemos a confirmação de pagamento do seu boleto Solara.</p>
      <p><strong>Valor:</strong> ${money(input.amount)}</p>
      <p><strong>Vencimento:</strong> ${escapeHtml(input.dueDate)}</p>
      <p><strong>Confirmado em:</strong> ${escapeHtml(formatDateBR(input.paidAt))}</p>
      <p><strong>Faturamento:</strong> ${escapeHtml(input.faturamentoId)}</p>
      <p>Obrigado por escolher a Solara Energia.</p>
      <p>Atenciosamente,<br/>Equipe Solara</p>
    </div>
  `;

  if (mockMode || !resendKey) {
    return {
      ok: true,
      mocked: true,
      reason: !resendKey
        ? 'RESEND_API_KEY não configurada. Use EMAIL_MOCK=true para testes explícitos.'
        : 'EMAIL_MOCK=true',
    };
  }

  const resend = new Resend(resendKey);
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Falha ao enviar e-mail de pagamento confirmado: ${error.message}`);
  }

  return { ok: true, id: data?.id, mocked: false };
}

export async function sendBoletoPdfEmail(input: SendBoletoPdfEmailInput) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.BILLING_FROM_EMAIL ?? 'Solara <financeiro@solaraenergia.com.br>';
  const mockMode = process.env.EMAIL_MOCK === 'true';

  const subject = `Boleto PDF Solara - vencimento ${escapeHtml(input.dueDate)}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h2>Olá, ${escapeHtml(input.clientName)}</h2>
      <p>Segue o boleto em PDF em anexo.</p>
      <p><strong>Valor:</strong> ${money(input.amount)}</p>
      <p><strong>Vencimento:</strong> ${escapeHtml(input.dueDate)}</p>
      <p>Atenciosamente,<br/>Equipe Solara</p>
    </div>
  `;

  if (mockMode || !resendKey) {
    return {
      ok: true,
      mocked: true,
      reason: !resendKey
        ? 'RESEND_API_KEY não configurada. Use EMAIL_MOCK=true para testes explícitos.'
        : 'EMAIL_MOCK=true',
    };
  }

  const resend = new Resend(resendKey);
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject,
    html,
    attachments: [
      {
        filename: 'boleto-solara.pdf',
        content: input.pdfBuffer.toString('base64'),
      },
    ],
  });

  if (error) {
    throw new Error(`Falha ao enviar e-mail: ${error.message}`);
  }

  return { ok: true, id: data?.id, mocked: false };
}
