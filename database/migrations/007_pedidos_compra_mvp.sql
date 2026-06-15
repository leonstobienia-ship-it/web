-- V3.4C - Pedido de Compra MVP ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao implementa nota fiscal, financeiro, contas a pagar, programacao bancaria, pagamento, SharePoint, Entra, automacoes ou DELETE fisico.

BEGIN;

ALTER TABLE pedidos_compra
  ADD COLUMN IF NOT EXISTS solicitacao_id uuid REFERENCES solicitacoes_compra(id),
  ADD COLUMN IF NOT EXISTS codigo text,
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS data_entrega_prevista date,
  ADD COLUMN IF NOT EXISTS condicao_pagamento text,
  ADD COLUMN IF NOT EXISTS observacoes text;

UPDATE pedidos_compra
SET
  solicitacao_id = COALESCE(solicitacao_id, solicitacao_compra_id),
  codigo = COALESCE(codigo, numero, 'PC-MIGRADO-' || upper(substr(id::text, 1, 8))),
  titulo = COALESCE(titulo, 'Pedido de Compra ' || COALESCE(numero, upper(substr(id::text, 1, 8)))),
  status = CASE lower(status)
    WHEN 'rascunho' THEN 'RASCUNHO'
    WHEN 'emitido' THEN 'EMITIDO'
    WHEN 'enviado_fornecedor' THEN 'ENVIADO_FORNECEDOR'
    WHEN 'enviado fornecedor' THEN 'ENVIADO_FORNECEDOR'
    WHEN 'confirmado' THEN 'CONFIRMADO'
    WHEN 'parcialmente_recebido' THEN 'PARCIALMENTE_RECEBIDO'
    WHEN 'parcialmente recebido' THEN 'PARCIALMENTE_RECEBIDO'
    WHEN 'recebido' THEN 'RECEBIDO'
    WHEN 'cancelado' THEN 'CANCELADO'
    ELSE 'RASCUNHO'
  END;

ALTER TABLE pedidos_compra
  ALTER COLUMN codigo SET NOT NULL,
  ALTER COLUMN titulo SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'RASCUNHO';

CREATE TABLE IF NOT EXISTS pedidos_compra_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES pedidos_compra(id),
  solicitacao_item_id uuid REFERENCES solicitacoes_compra_itens(id),
  cotacao_item_id uuid REFERENCES cotacoes_itens(id),
  descricao text NOT NULL,
  unidade text NOT NULL,
  quantidade numeric(14,4) NOT NULL,
  valor_unitario numeric(14,2) NOT NULL DEFAULT 0,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  observacoes text,
  ordem integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_compra_status_check') THEN
    ALTER TABLE pedidos_compra
      ADD CONSTRAINT pedidos_compra_status_check
      CHECK (status IN (
        'RASCUNHO',
        'EMITIDO',
        'ENVIADO_FORNECEDOR',
        'CONFIRMADO',
        'PARCIALMENTE_RECEBIDO',
        'RECEBIDO',
        'CANCELADO'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_compra_valor_total_check') THEN
    ALTER TABLE pedidos_compra
      ADD CONSTRAINT pedidos_compra_valor_total_check
      CHECK (valor_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_compra_itens_quantidade_check') THEN
    ALTER TABLE pedidos_compra_itens
      ADD CONSTRAINT pedidos_compra_itens_quantidade_check
      CHECK (quantidade > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_compra_itens_valor_unitario_check') THEN
    ALTER TABLE pedidos_compra_itens
      ADD CONSTRAINT pedidos_compra_itens_valor_unitario_check
      CHECK (valor_unitario >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_compra_itens_valor_total_check') THEN
    ALTER TABLE pedidos_compra_itens
      ADD CONSTRAINT pedidos_compra_itens_valor_total_check
      CHECK (valor_total >= 0);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_compra_company_codigo
  ON pedidos_compra(company_id, codigo);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_company_status
  ON pedidos_compra(company_id, status);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_company_fornecedor
  ON pedidos_compra(company_id, fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_company_obra
  ON pedidos_compra(company_id, obra_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_company_centro_custo
  ON pedidos_compra(company_id, centro_custo_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_solicitacao_id_v34c
  ON pedidos_compra(solicitacao_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_cotacao_status
  ON pedidos_compra(cotacao_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_compra_cotacao_ativo
  ON pedidos_compra(cotacao_id)
  WHERE cotacao_id IS NOT NULL AND status <> 'CANCELADO';

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_itens_pedido
  ON pedidos_compra_itens(pedido_id, ordem);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_itens_solicitacao_item
  ON pedidos_compra_itens(solicitacao_item_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_itens_cotacao_item
  ON pedidos_compra_itens(cotacao_item_id);

COMMIT;
