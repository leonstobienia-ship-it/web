-- V3.3B - Cadastros Mestres Operacionais ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao executa DELETE fisico nem altera dados DEV_LOCAL_V3_3A.

BEGIN;

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS tipo_pessoa text NOT NULL DEFAULT 'juridica',
  ADD COLUMN IF NOT EXISTS endereco text;

ALTER TABLE fornecedores
  ADD COLUMN IF NOT EXISTS tipo_pessoa text NOT NULL DEFAULT 'juridica',
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS endereco text;

ALTER TABLE centros_custo
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'operacional',
  ADD COLUMN IF NOT EXISTS observacoes text;

ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS uf char(2),
  ADD COLUMN IF NOT EXISTS responsavel text,
  ADD COLUMN IF NOT EXISTS valor_previsto numeric(14,2),
  ADD COLUMN IF NOT EXISTS observacoes text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_status_check') THEN
    ALTER TABLE clientes
      ADD CONSTRAINT clientes_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_tipo_pessoa_check') THEN
    ALTER TABLE clientes
      ADD CONSTRAINT clientes_tipo_pessoa_check CHECK (tipo_pessoa IN ('fisica', 'juridica'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fornecedores_status_check') THEN
    ALTER TABLE fornecedores
      ADD CONSTRAINT fornecedores_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fornecedores_tipo_pessoa_check') THEN
    ALTER TABLE fornecedores
      ADD CONSTRAINT fornecedores_tipo_pessoa_check CHECK (tipo_pessoa IN ('fisica', 'juridica'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'centros_custo_status_check') THEN
    ALTER TABLE centros_custo
      ADD CONSTRAINT centros_custo_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'centros_custo_tipo_check') THEN
    ALTER TABLE centros_custo
      ADD CONSTRAINT centros_custo_tipo_check CHECK (tipo IN ('administrativo', 'obra', 'operacional', 'financeiro', 'comercial'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'obras_status_check') THEN
    ALTER TABLE obras
      ADD CONSTRAINT obras_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'obras_uf_check') THEN
    ALTER TABLE obras
      ADD CONSTRAINT obras_uf_check CHECK (uf IS NULL OR uf ~ '^[A-Z]{2}$');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(company_id, status);
CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON fornecedores(company_id, status);
CREATE INDEX IF NOT EXISTS idx_centros_custo_status ON centros_custo(company_id, status);
CREATE INDEX IF NOT EXISTS idx_obras_status ON obras(company_id, status);

COMMIT;
