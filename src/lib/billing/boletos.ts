import { createSeuNumero, emitirBolecode, isPixPaymentPayload } from '@/lib/itau/bolecode';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function gerarBoletoParaCliente(params: {
  clienteId: string;
  valor: number;
  dataVencimento: string;
  simulacao?: boolean;
}) {
  const supabase = createSupabaseServiceClient();

  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .select('id, nome, cpf_cnpj, email, cep, endereco_completo, rua, numero, bairro, cidade, estado')
    .eq('id', params.clienteId)
    .single();

  if (clienteError || !cliente) {
    throw new Error('Cliente nao encontrado para emissao de boleto.');
  }

  const itau = await emitirBolecode({
    seuNumero: createSeuNumero(),
    valor: params.valor,
    dataVencimento: params.dataVencimento,
    pagador: {
      nome: cliente.nome,
      cpfCnpj: cliente.cpf_cnpj,
      email: cliente.email,
      cep: cliente.cep,
      logradouro: [cliente.rua, cliente.numero].filter(Boolean).join(', ') || cliente.endereco_completo,
      bairro: cliente.bairro,
      cidade: cliente.cidade,
      uf: cliente.estado,
    },
    simulacao: params.simulacao,
  });

  if (params.simulacao) {
    return {
      simulacao: true,
      etapa_processo_boleto: 'Simulacao',
      itau: {
        idBoleto: itau.idBoleto,
        nossoNumero: itau.nossoNumero,
        codigoBarras: itau.codigoBarras,
        linhaDigitavel: itau.linhaDigitavel,
        qrCodePresente: Boolean(itau.qrCode),
        qrCodePagavel: isPixPaymentPayload(itau.qrCode),
        pixUrlPresente: Boolean(itau.pixUrl),
        boletoUrlPresente: Boolean(itau.boletoUrl),
      },
    };
  }

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('id')
    .eq('cliente_id', params.clienteId)
    .eq('status', 'ativa')
    .maybeSingle();

  const { data: faturamento, error: faturamentoError } = await supabase
    .from('faturamento')
    .insert({
      cliente_id: params.clienteId,
      assinatura_id: assinatura?.id ?? null,
      id_itau: itau.idBoleto,
      nosso_numero: itau.nossoNumero || null,
      valor: params.valor,
      data_vencimento: params.dataVencimento,
      status: 'gerado',
      boleto_url: itau.boletoUrl,
      codigo_barras: itau.codigoBarras || null,
      linha_digitavel: itau.linhaDigitavel || null,
      pix_qr_code: itau.qrCode || null,
      pix_url: itau.pixUrl || null,
      api_response: itau.raw,
    })
    .select('*')
    .single();

  if (faturamentoError) {
    if (faturamentoError.message.toLowerCase().includes('permission denied')) {
      throw new Error(
        'Erro ao salvar faturamento: permissao negada no Supabase. Aplique a migration/grants de service_role para a tabela faturamento e confira SUPABASE_SERVICE_ROLE_KEY na Vercel.',
      );
    }

    throw new Error(`Erro ao salvar faturamento: ${faturamentoError.message}`);
  }

  return faturamento;
}
