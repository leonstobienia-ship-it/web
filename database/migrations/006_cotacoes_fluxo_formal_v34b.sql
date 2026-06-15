-- V3.4B ajuste incremental - fluxo formal de cotacao e mapa comparativo ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Mantem a migration 005 aplicada e adiciona a estrutura agregada solicitada para cotacoes.
-- Nao implementa pedido de compra, nota fiscal, financeiro, SharePoint, Entra, automacoes ou DELETE fisico.

BEGIN;

ALTER TABLE cotacoes
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS prazo_resposta date;

ALTER TABLE cotacoes
  ALTER COLUMN fornecedor_id DROP NOT NULL,
  ALTER COLUMN status SET DEFAULT 'RASCUNHO';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_status_check') THEN
    ALTER TABLE cotacoes DROP CONSTRAINT cotacoes_status_check;
  END IF;

  ALTER TABLE cotacoes
    ADD CONSTRAINT cotacoes_status_check
    CHECK (
      status IN (
        'RASCUNHO',
        'ENVIADA_FORNECEDORES',
        'RESPOSTAS_RECEBIDAS',
        'MAPA_GERADO',
        'FORNECEDOR_ESCOLHIDO',
        'CANCELADA',
        'RECEBIDA',
        'DESCLASSIFICADA',
        'SELECIONADA',
        'CANCELADA'
      )
    );
END $$;

CREATE TABLE IF NOT EXISTS cotacoes_fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id uuid NOT NULL REFERENCES cotacoes(id),
  fornecedor_id uuid NOT NULL REFERENCES fornecedores(id),
  status text NOT NULL DEFAULT 'CONVIDADO',
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  prazo_entrega_dias integer,
  condicao_pagamento text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cotacao_id, fornecedor_id)
);

ALTER TABLE cotacoes_itens
  ADD COLUMN IF NOT EXISTS cotacao_fornecedor_id uuid REFERENCES cotacoes_fornecedores(id),
  ADD COLUMN IF NOT EXISTS marca_modelo text,
  ADD COLUMN IF NOT EXISTS prazo_entrega_dias integer;

CREATE TABLE IF NOT EXISTS mapa_comparativo_cotacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id uuid NOT NULL UNIQUE REFERENCES cotacoes(id),
  fornecedor_vencedor_id uuid REFERENCES fornecedores(id),
  criterio_decisao text,
  justificativa text,
  valor_vencedor numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'RASCUNHO',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_fornecedores_status_check') THEN
    ALTER TABLE cotacoes_fornecedores
      ADD CONSTRAINT cotacoes_fornecedores_status_check
      CHECK (status IN ('CONVIDADO', 'RESPOSTA_RECEBIDA', 'DESCLASSIFICADO', 'ESCOLHIDO', 'CANCELADO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_fornecedores_valor_total_check') THEN
    ALTER TABLE cotacoes_fornecedores
      ADD CONSTRAINT cotacoes_fornecedores_valor_total_check
      CHECK (valor_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_fornecedores_prazo_entrega_check') THEN
    ALTER TABLE cotacoes_fornecedores
      ADD CONSTRAINT cotacoes_fornecedores_prazo_entrega_check
      CHECK (prazo_entrega_dias IS NULL OR prazo_entrega_dias >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_itens_cotacao_fornecedor_check') THEN
    ALTER TABLE cotacoes_itens
      ADD CONSTRAINT cotacoes_itens_cotacao_fornecedor_check
      CHECK (cotacao_fornecedor_id IS NULL OR cotacao_id IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_itens_prazo_entrega_check') THEN
    ALTER TABLE cotacoes_itens
      ADD CONSTRAINT cotacoes_itens_prazo_entrega_check
      CHECK (prazo_entrega_dias IS NULL OR prazo_entrega_dias >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mapa_comparativo_cotacao_status_check') THEN
    ALTER TABLE mapa_comparativo_cotacao
      ADD CONSTRAINT mapa_comparativo_cotacao_status_check
      CHECK (status IN ('RASCUNHO', 'GERADO', 'FORNECEDOR_ESCOLHIDO', 'CANCELADO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mapa_comparativo_cotacao_valor_check') THEN
    ALTER TABLE mapa_comparativo_cotacao
      ADD CONSTRAINT mapa_comparativo_cotacao_valor_check
      CHECK (valor_vencedor >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cotacoes_formal_company_status
  ON cotacoes(company_id, status)
  WHERE titulo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cotacoes_formal_solicitacao
  ON cotacoes(company_id, solicitacao_compra_id, status)
  WHERE titulo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cotacoes_fornecedores_cotacao
  ON cotacoes_fornecedores(cotacao_id, status);

CREATE INDEX IF NOT EXISTS idx_cotacoes_fornecedores_fornecedor
  ON cotacoes_fornecedores(fornecedor_id, status);

CREATE INDEX IF NOT EXISTS idx_cotacoes_itens_cotacao_fornecedor
  ON cotacoes_itens(cotacao_fornecedor_id, status, ordem);

CREATE INDEX IF NOT EXISTS idx_mapa_comparativo_cotacao_status
  ON mapa_comparativo_cotacao(cotacao_id, status);

COMMIT;
