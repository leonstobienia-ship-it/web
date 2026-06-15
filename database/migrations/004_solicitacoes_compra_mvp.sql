-- V3.4A - Solicitacao de Compra MVP ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao implementa cotacao, pedido, nota fiscal, financeiro, aprovacao por alcada ou DELETE fisico.

BEGIN;

ALTER TABLE solicitacoes_compra
  ADD COLUMN IF NOT EXISTS codigo text,
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS data_necessidade date,
  ADD COLUMN IF NOT EXISTS valor_estimado_total numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacoes text;

UPDATE solicitacoes_compra
SET
  codigo = COALESCE(codigo, 'SC-MIGRADA-' || upper(substr(id::text, 1, 8))),
  titulo = COALESCE(titulo, left(descricao, 160)),
  data_necessidade = COALESCE(data_necessidade, data_necessaria, current_date),
  prioridade = CASE lower(prioridade)
    WHEN 'baixa' THEN 'BAIXA'
    WHEN 'normal' THEN 'NORMAL'
    WHEN 'alta' THEN 'ALTA'
    WHEN 'urgente' THEN 'URGENTE'
    WHEN 'emergencial' THEN 'URGENTE'
    ELSE 'NORMAL'
  END,
  status = CASE lower(status)
    WHEN 'rascunho' THEN 'RASCUNHO'
    WHEN 'enviada' THEN 'ENVIADA'
    WHEN 'em_analise' THEN 'EM_ANALISE'
    WHEN 'em analise' THEN 'EM_ANALISE'
    WHEN 'aprovada_para_cotacao' THEN 'APROVADA_PARA_COTACAO'
    WHEN 'devolvida' THEN 'DEVOLVIDA'
    WHEN 'cancelada' THEN 'CANCELADA'
    ELSE 'RASCUNHO'
  END;

ALTER TABLE solicitacoes_compra
  ALTER COLUMN codigo SET NOT NULL,
  ALTER COLUMN titulo SET NOT NULL,
  ALTER COLUMN prioridade SET DEFAULT 'NORMAL',
  ALTER COLUMN data_necessidade SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'RASCUNHO';

CREATE TABLE IF NOT EXISTS solicitacoes_compra_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES solicitacoes_compra(id),
  descricao text NOT NULL,
  unidade text NOT NULL,
  quantidade numeric(14,4) NOT NULL,
  valor_estimado_unitario numeric(14,2) NOT NULL DEFAULT 0,
  valor_estimado_total numeric(14,2) NOT NULL DEFAULT 0,
  observacoes text,
  ordem integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'ATIVO',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_compra_status_check') THEN
    ALTER TABLE solicitacoes_compra
      ADD CONSTRAINT solicitacoes_compra_status_check
      CHECK (status IN ('RASCUNHO', 'ENVIADA', 'EM_ANALISE', 'APROVADA_PARA_COTACAO', 'DEVOLVIDA', 'CANCELADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_compra_prioridade_check') THEN
    ALTER TABLE solicitacoes_compra
      ADD CONSTRAINT solicitacoes_compra_prioridade_check
      CHECK (prioridade IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_compra_valor_total_check') THEN
    ALTER TABLE solicitacoes_compra
      ADD CONSTRAINT solicitacoes_compra_valor_total_check
      CHECK (valor_estimado_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_compra_itens_quantidade_check') THEN
    ALTER TABLE solicitacoes_compra_itens
      ADD CONSTRAINT solicitacoes_compra_itens_quantidade_check
      CHECK (quantidade > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_compra_itens_valor_unitario_check') THEN
    ALTER TABLE solicitacoes_compra_itens
      ADD CONSTRAINT solicitacoes_compra_itens_valor_unitario_check
      CHECK (valor_estimado_unitario >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_compra_itens_valor_total_check') THEN
    ALTER TABLE solicitacoes_compra_itens
      ADD CONSTRAINT solicitacoes_compra_itens_valor_total_check
      CHECK (valor_estimado_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_compra_itens_status_check') THEN
    ALTER TABLE solicitacoes_compra_itens
      ADD CONSTRAINT solicitacoes_compra_itens_status_check
      CHECK (status IN ('ATIVO', 'SUBSTITUIDO'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_solicitacoes_compra_company_codigo
  ON solicitacoes_compra(company_id, codigo);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_compra_company_status
  ON solicitacoes_compra(company_id, status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_compra_company_obra
  ON solicitacoes_compra(company_id, obra_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_compra_company_centro_custo
  ON solicitacoes_compra(company_id, centro_custo_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_compra_itens_solicitacao
  ON solicitacoes_compra_itens(solicitacao_id, status, ordem);

COMMIT;
