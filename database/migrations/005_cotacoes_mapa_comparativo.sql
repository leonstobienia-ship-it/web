-- V3.4B - Cotacao e Mapa Comparativo ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao implementa pedido de compra, nota fiscal, financeiro, aprovacao por alcada ou DELETE fisico.

BEGIN;

ALTER TABLE cotacoes
  ADD COLUMN IF NOT EXISTS codigo text,
  ADD COLUMN IF NOT EXISTS data_recebimento date,
  ADD COLUMN IF NOT EXISTS validade_proposta date,
  ADD COLUMN IF NOT EXISTS prazo_entrega_dias integer,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS motivo_desclassificacao text,
  ADD COLUMN IF NOT EXISTS selecionada_em timestamptz;

UPDATE cotacoes
SET
  codigo = COALESCE(codigo, 'COT-MIGRADA-' || upper(substr(id::text, 1, 8))),
  data_recebimento = COALESCE(data_recebimento, current_date),
  status = CASE lower(status)
    WHEN 'rascunho' THEN 'RASCUNHO'
    WHEN 'recebida' THEN 'RECEBIDA'
    WHEN 'desclassificada' THEN 'DESCLASSIFICADA'
    WHEN 'selecionada' THEN 'SELECIONADA'
    WHEN 'cancelada' THEN 'CANCELADA'
    ELSE 'RECEBIDA'
  END;

ALTER TABLE cotacoes
  ALTER COLUMN codigo SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'RECEBIDA',
  ALTER COLUMN data_recebimento SET NOT NULL;

CREATE TABLE IF NOT EXISTS cotacoes_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id uuid NOT NULL REFERENCES cotacoes(id),
  solicitacao_item_id uuid NOT NULL REFERENCES solicitacoes_compra_itens(id),
  descricao text NOT NULL,
  unidade text NOT NULL,
  quantidade numeric(14,4) NOT NULL,
  valor_unitario numeric(14,2) NOT NULL DEFAULT 0,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  observacoes text,
  ordem integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'ATIVO',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_status_check') THEN
    ALTER TABLE cotacoes
      ADD CONSTRAINT cotacoes_status_check
      CHECK (status IN ('RASCUNHO', 'RECEBIDA', 'DESCLASSIFICADA', 'SELECIONADA', 'CANCELADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_valor_total_check') THEN
    ALTER TABLE cotacoes
      ADD CONSTRAINT cotacoes_valor_total_check
      CHECK (valor_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_prazo_entrega_dias_check') THEN
    ALTER TABLE cotacoes
      ADD CONSTRAINT cotacoes_prazo_entrega_dias_check
      CHECK (prazo_entrega_dias IS NULL OR prazo_entrega_dias >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_itens_quantidade_check') THEN
    ALTER TABLE cotacoes_itens
      ADD CONSTRAINT cotacoes_itens_quantidade_check
      CHECK (quantidade > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_itens_valor_unitario_check') THEN
    ALTER TABLE cotacoes_itens
      ADD CONSTRAINT cotacoes_itens_valor_unitario_check
      CHECK (valor_unitario >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_itens_valor_total_check') THEN
    ALTER TABLE cotacoes_itens
      ADD CONSTRAINT cotacoes_itens_valor_total_check
      CHECK (valor_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_itens_status_check') THEN
    ALTER TABLE cotacoes_itens
      ADD CONSTRAINT cotacoes_itens_status_check
      CHECK (status IN ('ATIVO', 'SUBSTITUIDO'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cotacoes_company_codigo
  ON cotacoes(company_id, codigo);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cotacoes_solicitacao_fornecedor
  ON cotacoes(solicitacao_compra_id, fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_cotacoes_company_status
  ON cotacoes(company_id, status);

CREATE INDEX IF NOT EXISTS idx_cotacoes_company_solicitacao
  ON cotacoes(company_id, solicitacao_compra_id);

CREATE INDEX IF NOT EXISTS idx_cotacoes_itens_cotacao
  ON cotacoes_itens(cotacao_id, status, ordem);

CREATE INDEX IF NOT EXISTS idx_cotacoes_itens_solicitacao_item
  ON cotacoes_itens(solicitacao_item_id);

COMMIT;
