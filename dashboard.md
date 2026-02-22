1. Arquitetura do Banco de Dados (Supabase):

Tabela clientes: campos para Nome, CNPJ/CPF, e-mail, telefone, endereço completo e status da assinatura.

Tabela assinaturas: vinculada ao cliente, contendo valor mensal, dia de vencimento, e histórico de consumo de energia (kWh).

Tabela faturamento: para controle de boletos, com campos para id_itau (referência da API), valor, data de vencimento, status (pendente, pago, atrasado) e URL do boleto.

2. Frontend e UI (Tailwind):

Dashboard Principal: Crie um layout com sidebar. O dashboard deve exibir cards de métricas (MRR - Receita Mensal Recorrente, Total de Clientes Ativos, Inadimplência).

Gráficos (usando Recharts ou Shadcn UI): * Um gráfico de barras mostrando o faturamento mensal.

Gestão de Clientes: Uma tabela com filtros e um formulário de cadastro (modal) com validação de campos.

3. Integração e Lógica:

API Itaú: Crie uma Route Handler no Next.js (/api/boletos) que receba os dados do cliente e valor, faça a autenticação mútua (mTLS) ou OAuth2 conforme o padrão do Itaú, e retorne os dados do boleto para salvar no Supabase.

Fluxo de Faturamento: Um botão "Gerar Faturamento do Mês" que percorra os clientes ativos e dispare a criação dos boletos, o valor dos boletos vai ser digitado para cada cliente 

Utilize Supabase Auth para proteger as rotas do dashboard.

acesso aos dados dos inversores, um indicador de "Saúde da Usina" ou "Geração em Tempo Real" traz muita credibilidade.

Automatize o envio de e-mails/WhatsApp via Supabase Edge Functions 3 dias antes do vencimento do boleto gerado pelo Itaú.


Área do Cliente: Além do admin, crie uma rota simples para o cliente final baixar o boleto e ver o histórico de consumo sem precisar de login complexo (usando apenas o CPF/CNPJ e um token por e-mail).