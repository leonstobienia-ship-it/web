# Contas a Pagar ERP ENAC

## Papel no ERP

Conta a Pagar representa a obrigacao financeira inicial gerada a partir de Nota Fiscal de Entrada aprovada. Na V3.5A, a conta e provisionada. Na V3.5C, pode ser aprovada internamente por alçada. Na V3.5D, pode ser vinculada a uma Programacao de Pagamento local. Na V3.5G, pode receber baixa manual administrativa controlada apos programacao liberada e conferida. Nao ha programacao bancaria real, pagamento bancario, conciliacao ou integracao bancaria real.

## Entidade `contas_pagar`

A tabela nasceu na fundacao V3.2 e foi ajustada incrementalmente. O vinculo operacional com Nota Fiscal de Entrada usa `nota_entrada_id`, porque `nota_fiscal_id` ja existia apontando para a tabela generica `notas_fiscais`.

Campos principais do fluxo V3.5A:

- `company_id`
- `nota_entrada_id`
- `pedido_id`
- `fornecedor_id`
- `obra_id`
- `centro_custo_id`
- `numero_documento`
- `parcela`
- `total_parcelas`
- `data_emissao`
- `data_vencimento`
- `valor_original`
- `valor_aberto`
- `status`
- `ativo`
- `divergencia_pendente`
- `baixa_status`
- `baixado_manual_por`
- `baixado_manual_em`
- `baixa_manual_data`
- `baixa_manual_valor`
- `baixa_manual_forma_pagamento`
- `baixa_manual_observacoes`
- `baixa_manual_referencia_anexo`
- `baixa_status_anterior`
- `baixa_status_novo`
- `bloqueio_baixa_motivo`
- `forma_pagamento_prevista`
- `observacoes`

## Status

```text
PROVISIONADA
APROVADA
AGUARDANDO_PROGRAMACAO
PROGRAMADA
BAIXADA_MANUAL
PAGA
CANCELADA
```

Status de baixa manual da V3.5G:

```text
BAIXA_PENDENTE
BAIXADA_MANUAL
BAIXA_ESTORNADA
BLOQUEADA_BAIXA
```

Na V3.5C, `APROVADA` passa a representar aprovacao interna por alcada. Na V3.5D, a programacao ativa e controlada por `programacoes_pagamento_itens`, sem depender de alterar a conta para `PAGA`. Na V3.5G, `BAIXADA_MANUAL` representa registro administrativo local, nao liquidacao bancaria. `PAGA` continua fora do escopo operacional.

## Historico `contas_pagar_baixas`

A V3.5G adiciona historico append-only para tentativas de baixa manual e estorno:

- conta a pagar;
- empresa;
- programacao vinculada;
- acao (`BAIXAR_MANUAL` ou `ESTORNAR_BAIXA`);
- status anterior e novo;
- status de baixa;
- usuario;
- valor baixado;
- data efetiva;
- forma manual;
- observacoes;
- referencia futura de anexo;
- resultado (`PERMITIDO` ou `NEGADO`);
- motivo;
- data/hora.

## Regras

- Conta nasce de NF de entrada `APROVADA`.
- Provisao pela NF muda a NF para `PROVISIONADA`.
- Empresa, fornecedor, pedido, obra, centro de custo, numero, emissao e valor sao herdados da NF.
- V3.5A permite apenas parcela unica.
- `valor_aberto` inicia igual a `valor_original`.
- Duplicidade ativa por NF/parcela retorna `409`.
- Conta so entra em Programacao de Pagamento quando esta ativa, aprovada, sem divergencia pendente e sem programacao ativa.
- A aprovacao da Programacao de Pagamento nao altera `valor_aberto`.
- Baixa manual exige conta `APROVADA`, aprovacao interna concluida, conta ativa, sem divergencia pendente, programacao ativa `LIBERADA`, liberacao `LIBERADA` e conferencia `CONFERIDA`.
- Baixa parcial ou valor diferente do saldo aberto e bloqueado na V3.5G.
- Baixa manual muda status para `BAIXADA_MANUAL`, zera `valor_aberto` e `saldo`, mas nao marca `PAGA`.
- Estorno controlado retorna a conta para `APROVADA`, registra `BAIXA_ESTORNADA` e preserva historico.
- Nao ha pagamento bancario real.
- Nao ha programacao bancaria real.
- Nao ha conciliacao.
- Nao ha CNAB.
- Nao ha integracao bancaria.
- Nao ha `DELETE` fisico.

## Endpoints

```text
GET    /contas-pagar
GET    /contas-pagar/:id
POST   /contas-pagar/provisionar-da-nota
PATCH  /contas-pagar/:id/aprovar-tecnico
PATCH  /contas-pagar/:id/aprovar-diretoria
PATCH  /contas-pagar/:id/baixar-manual
PATCH  /contas-pagar/:id/estornar-baixa
GET    /contas-pagar/:id/baixas
```

Alias local preservado:

```text
POST   /contas-pagar/gerar-da-nota
```

O fluxo preferencial da V3.5A e:

```text
PATCH /notas-fiscais-entrada/:id/provisionar-conta-pagar
```

## Smoke

```powershell
cd server
npm.cmd run smoke:notas
```

`smoke:notas` valida a conta provisionada. `smoke:contas-pagar` permanece como smoke auxiliar de leitura e duplicidade. `smoke:programacoes-pagamento` valida a programacao local sem pagamento bancario.

Na V3.5G:

```powershell
cd server
npm.cmd run smoke:baixa-manual
```

`smoke:baixa-manual` valida bloqueios, baixa manual elegivel, alçada acima de R$ 20.000, estorno, historico, auditoria, rotas proibidas e ausencia de `DELETE` fisico.
