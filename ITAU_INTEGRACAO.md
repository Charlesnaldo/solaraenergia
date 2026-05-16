# Integracao Itau Bolecode

Este guia descreve o que precisa estar pronto para rodar a integracao de boletos/Bolecode com Itau no projeto Solara.

## Arquivos Envolvidos

- `src/lib/itau/http.ts`: chamada HTTPS com mTLS usando PFX ou PEM.
- `src/lib/itau/auth.ts`: obtencao, cache e renovacao do access token Itau.
- `src/lib/itau/client.ts`: funcao base para chamadas Itau com `Authorization: Bearer`.
- `src/lib/itau/bolecode.ts`: payload de emissao Bolecode.
- `src/lib/billing/boletos.ts`: fluxo do app que busca cliente no Supabase, emite no Itau e salva faturamento.
- `src/app/api/boletos/route.ts`: endpoint admin para gerar boleto de um cliente.
- `src/app/api/faturamento/route.ts`: endpoint admin para gerar faturamento em lote.
- `supabase/migrations/20260511_itau_bolecode_fields.sql`: campos extras de retorno Itau no `faturamento`.

## Pre-requisitos Itau

1. Ter contrato/produto de cobranca/Bolecode liberado pelo Itau.
2. Solicitar `client_id`, `client_secret` ou token temporario conforme o processo do banco.
3. Gerar par de chaves e certificado dinamico conforme a documentacao oficial.
4. Confirmar com o Itau:
   - URL base da API de boletos/Bolecode.
   - URL de token em producao.
   - `id_beneficiario`.
   - `codigo_carteira`.
   - chave Pix, se Bolecode com Pix for usado.
   - se existe exigencia de allowlist de IP.

Documentacao oficial:
- Autenticacao mTLS: https://devportal.itau.com.br/autenticacao-documentacao
- Certificado dinamico: https://devportal.itau.com.br/certificado-dinamico

## Variaveis de Ambiente

Configurar no Vercel em `Production`, `Preview` se necessario, e localmente em `.env.local`.

```env
ITAU_MOCK=false
ITAU_MTLS_DISABLED=false
ITAU_AUTH_URL=https://sts.itau.com.br/api/oauth/token
ITAU_API_URL=
ITAU_BOLETO_URL=
ITAU_BOLETOS_NOTIFICACOES_URL=
ITAU_CLIENT_ID=
ITAU_CLIENT_SECRET=
ITAU_PFX_PATH=
ITAU_PFX_BASE64=
ITAU_PFX_PASSPHRASE=
ITAU_CERT=
ITAU_KEY=
ITAU_CA=
ITAU_ID_BENEFICIARIO=
ITAU_CODIGO_CARTEIRA=109
ITAU_CHAVE_PIX=
```

Observacoes:
- Preferir `ITAU_PFX_PATH` em ambiente local/servidor com arquivo seguro, ou `ITAU_PFX_BASE64` em plataformas que nao aceitam arquivo secreto.
- `ITAU_PFX_PASSPHRASE` deve conter a senha do PFX configurada fora do codigo.
- `ITAU_CERT` e `ITAU_KEY` continuam suportados como alternativa PEM e devem ficar como segredo, nunca no Git.
- Se colar PEM em variavel de ambiente, preserve quebras de linha como `\n`.
- `ITAU_CA` e opcional, mas deve ser usado se o Itau fornecer cadeia CA especifica.
- Para testes sem chamar o banco, use `ITAU_MOCK=true`.
- Nao use `NEXT_PUBLIC_` para nenhum segredo Itau.

Exemplo local usando o PFX gerado:

```env
ITAU_MOCK=false
ITAU_PFX_PATH=itau.pfx
ITAU_PFX_PASSPHRASE=<senha do PFX>
ITAU_CLIENT_ID=<client id>
ITAU_CLIENT_SECRET=<client secret>
```

## Supabase

Aplicar a migration:

```bash
supabase db push
```

Ou executar manualmente no SQL Editor do Supabase:

```sql
alter table public.faturamento
  add column if not exists nosso_numero text,
  add column if not exists codigo_barras text,
  add column if not exists linha_digitavel text,
  add column if not exists pix_qr_code text,
  add column if not exists pix_url text,
  add column if not exists api_response jsonb;

create index if not exists idx_faturamento_nosso_numero on public.faturamento(nosso_numero);
```

## Fluxo de Emissao

1. Admin faz login com Supabase Auth + 2FA.
2. Admin clica em gerar boleto.
3. Frontend chama `POST /api/boletos`.
4. API valida admin com `getAuthenticatedAdminUser()`.
5. App busca dados do cliente no Supabase usando service role no servidor.
6. App obtem token Itau via mTLS.
7. App chama endpoint Bolecode do Itau.
8. App salva retorno em `public.faturamento`.
9. Dashboard exibe URL/linha digitavel quando retornadas.

## Teste Local Seguro

Para testar sem Itau:

```env
ITAU_MOCK=true
```

Depois rode:

```bash
npm run lint
npm run build
npm run dev
```

Teste pelo painel admin, nao chamando a API publica direto sem sessao.

## Teste com Itau

Antes de `ITAU_MOCK=false`:

1. Conferir se `ITAU_PFX_PATH` e `ITAU_PFX_PASSPHRASE` estao corretos, ou se `ITAU_CERT` e `ITAU_KEY` estao corretos.
2. Conferir se `ITAU_CLIENT_ID` e `ITAU_CLIENT_SECRET` pertencem ao mesmo ambiente da URL.
3. Conferir se a URL de token e a URL de boletos sao do mesmo ambiente.
4. Conferir se `ITAU_ID_BENEFICIARIO` foi informado pelo Itau.
5. Emitir um boleto de baixo valor em ambiente homologado/sandbox, se disponivel.
6. Validar no Supabase se `id_itau`, `nosso_numero`, `linha_digitavel` e `api_response` foram salvos.

## Vercel

Configurar as variaveis em:

`Project Settings -> Environment Variables`

Tambem conferir:
- As rotas `/api/boletos` e `/api/faturamento` rodam em `nodejs`, necessario para mTLS via `https.Agent`.
- Se o Itau exigir IP fixo de saida, Vercel padrao pode nao bastar. Nesse caso use recurso de static egress/proxy/gateway aprovado.
- Nao logar `ITAU_CLIENT_SECRET`, certificado, chave privada ou payload completo em erro de producao.

## Webhook Itau

Ainda nao ativar webhook em producao sem uma implementacao dedicada.

O webhook precisa:
- Validar autenticidade conforme fluxo oficial do Itau.
- Nao aceitar payload anonimo.
- Atualizar status por `nosso_numero` ou `id_boleto`.
- Ser idempotente.
- Guardar payload bruto apenas se necessario e com cuidado LGPD.

Se o Itau exigir mTLS de entrada para webhook, uma rota normal na Vercel pode nao ser suficiente. Pode ser necessario API Gateway/proxy que valide certificado de cliente antes de encaminhar para o app.

## Checklist de Producao

- [ ] Migration aplicada no Supabase.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado apenas no servidor/Vercel.
- [ ] `ADMIN_2FA_SECRET` configurado.
- [ ] `ADMIN_2FA_TEST_CODE` removido apos os testes temporarios.
- [ ] `SMS_MOCK=false` em producao.
- [ ] `ITAU_MOCK=false` somente apos teste homologado.
- [ ] `ITAU_PFX_PATH`/`ITAU_PFX_BASE64` e `ITAU_PFX_PASSPHRASE` configurados como segredos, ou `ITAU_CERT` e `ITAU_KEY` configurados como segredos.
- [ ] Certificado dentro da validade.
- [ ] Token Itau validado.
- [ ] Emissao testada com cliente real controlado.
- [ ] Logs revisados para nao expor dados sensiveis.
- [ ] Plano de renovacao do certificado documentado.
