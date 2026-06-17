-- V3.5F - Conferencia Financeira Final Pre-Baixa ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao executa pagamento, baixa, integracao bancaria, CNAB, SharePoint, Entra, Power Automate ou DELETE fisico.

BEGIN;

ALTER TABLE programacoes_pagamento
  ADD COLUMN IF NOT EXISTS conferencia_status text NOT NULL DEFAULT 'PENDENTE_CONFERENCIA',
  ADD COLUMN IF NOT EXISTS conferido_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS conferido_em timestamptz,
  ADD COLUMN IF NOT EXISTS conferencia_observacoes text,
  ADD COLUMN IF NOT EXISTS conferencia_checklist jsonb,
  ADD COLUMN IF NOT EXISTS conferencia_valor_total numeric(14,2),
  ADD COLUMN IF NOT EXISTS conferencia_quantidade_contas integer,
  ADD COLUMN IF NOT EXISTS conferencia_status_anterior text,
  ADD COLUMN IF NOT EXISTS conferencia_status_novo text,
  ADD COLUMN IF NOT EXISTS bloqueio_conferencia_motivo text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_conferencia_status_check') THEN
    ALTER TABLE programacoes_pagamento
      ADD CONSTRAINT programacoes_pagamento_conferencia_status_check
      CHECK (conferencia_status IN ('PENDENTE_CONFERENCIA', 'CONFERIDA', 'BLOQUEADA_CONFERENCIA', 'DEVOLVIDA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_conferencia_valores_check') THEN
    ALTER TABLE programacoes_pagamento
      ADD CONSTRAINT programacoes_pagamento_conferencia_valores_check
      CHECK (
        conferencia_valor_total IS NULL OR
        (conferencia_valor_total >= 0 AND coalesce(conferencia_quantidade_contas, 0) >= 0)
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS programacoes_pagamento_conferencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programacao_id uuid NOT NULL REFERENCES programacoes_pagamento(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  acao text NOT NULL,
  status_anterior text NOT NULL,
  status_novo text NOT NULL,
  conferencia_status text NOT NULL,
  usuario_id uuid REFERENCES usuarios(id),
  valor_total_conferido numeric(14,2) NOT NULL DEFAULT 0,
  quantidade_contas integer NOT NULL DEFAULT 0,
  checklist jsonb,
  observacoes text,
  resultado text NOT NULL,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_conferencias_status_check') THEN
    ALTER TABLE programacoes_pagamento_conferencias
      ADD CONSTRAINT programacoes_pagamento_conferencias_status_check
      CHECK (conferencia_status IN ('CONFERIDA', 'BLOQUEADA_CONFERENCIA', 'DEVOLVIDA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_conferencias_resultado_check') THEN
    ALTER TABLE programacoes_pagamento_conferencias
      ADD CONSTRAINT programacoes_pagamento_conferencias_resultado_check
      CHECK (resultado IN ('PERMITIDO', 'NEGADO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_conferencias_acao_check') THEN
    ALTER TABLE programacoes_pagamento_conferencias
      ADD CONSTRAINT programacoes_pagamento_conferencias_acao_check
      CHECK (acao IN ('CONFERIR_FINANCEIRO', 'DEVOLVER_CONFERENCIA'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_conferencia_status
  ON programacoes_pagamento(company_id, conferencia_status, conferido_em);

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_conferencias_programacao
  ON programacoes_pagamento_conferencias(programacao_id, created_at DESC);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('programacoes-pagamento', 'conferir_financeiro', 'Conferir financeiramente programacao liberada antes de baixa manual futura'),
    ('programacoes-pagamento', 'devolver_conferencia', 'Devolver conferencia financeira de programacao sem executar pagamento ou baixa')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('FINANCEIRO', 'programacoes-pagamento', 'conferir_financeiro'),
    ('FINANCEIRO', 'programacoes-pagamento', 'devolver_conferencia'),
    ('DIRETORIA', 'programacoes-pagamento', 'conferir_financeiro'),
    ('DIRETORIA', 'programacoes-pagamento', 'devolver_conferencia')
),
empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
)
INSERT INTO perfis_escopos (perfil_id, escopo_id, status)
SELECT p.id, e.id, 'ativo'
FROM perfil_escopo_seed seed
JOIN empresa ON true
JOIN perfis p ON p.company_id = empresa.id AND p.nome = seed.perfil_nome
JOIN escopos_acesso e ON e.company_id = empresa.id AND e.modulo = seed.modulo AND e.acao = seed.acao
ON CONFLICT (perfil_id, escopo_id)
DO UPDATE SET status = 'ativo', updated_at = now();

INSERT INTO auditoria_eventos (company_id, entidade, acao, payload)
SELECT id, 'v3.5f', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_5F', 'escopo', 'conferencia_financeira_pre_baixa')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.5f' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_5F'
  );

COMMIT;
