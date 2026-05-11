// Supabase Edge Function: boleto-reminder
// Deploy: supabase functions deploy boleto-reminder
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('REMINDER_CRON_SECRET');
  const expectedAuthorization = `Bearer ${cronSecret || serviceRoleKey}`;

  if (req.headers.get('Authorization') !== expectedAuthorization) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      headers: { 'content-type': 'application/json' },
      status: 401,
    });
  }

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  const yyyyMmDd = targetDate.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('faturamento')
    .select('id, valor, data_vencimento, boleto_url, clientes!inner(nome, email, telefone)')
    .eq('status', 'pendente')
    .eq('data_vencimento', yyyyMmDd);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  // Hook para integrações reais (SendGrid, Twilio, Z-API etc).
  const reminders = (data ?? []).map((item) => ({
    faturamento_id: item.id,
    canal_email: item.clientes.email,
    canal_whatsapp: item.clientes.telefone,
    mensagem: `Oi ${item.clientes.nome}, seu boleto Solara vence em 3 dias. Valor: R$ ${item.valor}.`,
    boleto_url: item.boleto_url,
  }));

  return new Response(JSON.stringify({ ok: true, reminders }), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
});

