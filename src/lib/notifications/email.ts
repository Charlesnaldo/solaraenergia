import { Resend } from 'resend';

interface SendBoletoEmailInput {
  to: string;
  clientName: string;
  boletoUrl: string;
  dueDate: string;
  amount: number;
}

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export async function sendBoletoEmail(input: SendBoletoEmailInput) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.BILLING_FROM_EMAIL ?? 'Solara <financeiro@solaraenergia.com.br>';
  const mockMode = process.env.EMAIL_MOCK === 'true';

  const subject = `Boleto Solara - vencimento ${input.dueDate}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h2>Olá, ${input.clientName}</h2>
      <p>Seu boleto do mês já está disponível.</p>
      <p><strong>Valor:</strong> ${money(input.amount)}</p>
      <p><strong>Vencimento:</strong> ${input.dueDate}</p>
      <p><a href="${input.boletoUrl}" target="_blank" rel="noreferrer">Clique aqui para baixar o boleto</a></p>
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
