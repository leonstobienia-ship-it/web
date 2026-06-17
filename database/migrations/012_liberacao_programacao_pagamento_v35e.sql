-- V3.5E - Liberacao da Programacao de Pagamento ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao executa pagamento, baixa, integracao bancaria, CNAB, SharePoint, Entra, Power Automate ou DELETE fisico.

BEGIN;

ALTER TABLE programacoes_pagamento
  DROP CONSTRAINT IF EXISTS programacoes_pagamento_status_check;

ALTER TABLE programacoes_pagamento
  ADD CONSTRAINT programacoes_pagamento_status_check
  CHECK (status IN ('RASCUNHO', 'SUBMETIDA', 'APROVADA', 'LIBERADA', 'REPROVADA', 'CANCELADA'));

ALTER TABLE programacoes_pagamento
  ADD COLUMN IF NOT EXISTS liberacao_status text NOT NULL DEFAULT 'PENDENTE_LIBERACAO',
  ADD COLUMN IF NOT EXISTS liberado_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS liberado_em timestamptz,
  ADD COLUMN IF NOT EXISTS liberacao_justificativa text,
  ADD COLUMN IF NOT EXISTS liberacao_valor_total numeric(14,2),
  ADD COLUMN IF NOT EXISTS liberacao_quantidade_contas integer,
  ADD COLUMN IF NOT EXISTS liberacao_alcada_origem text,
  ADD COLUMN IF NOT EXISTS liberacao_status_anterior text,
  ADD COLUMN IF NOT EXISTS bloqueio_liberacao_motivo text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_liberacao_status_check') THEN
    ALTER TABLE programacoes_pagamento
      ADD CONSTRAINT programacoes_pagamento_liberacao_status_check
      CHECK (liberacao_status IN ('PENDENTE_LIBERACAO', 'LIBERADA', 'BLOQUEADA_LIBERACAO', 'CANCELADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_liberacao_valores_check') THEN
    ALTER TABLE programacoes_pagamento
      ADD CONSTRAINT programacoes_pagamento_liberacao_valores_check
      CHECK (
        liberacao_valor_total IS NULL OR
        (liberacao_valor_total >= 0 AND coalesce(liberacao_quantidade_contas, 0) >= 0)
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS programacoes_pagamento_liberacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programacao_id uuid NOT NULL REFERENCES programacoes_pagamento(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  status_anterior text NOT NULL,
  status_novo text NOT NULL,
  liberacao_status text NOT NULL,
  usuario_id uuid REFERENCES usuarios(id),
  valor_total_liberado numeric(14,2) NOT NULL DEFAULT 0,
  quantidade_contas integer NOT NULL DEFAULT 0,
  origem_alcada text,
  justificativa text,
  resultado text NOT NULL,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_liberacoes_status_check') THEN
    ALTER TABLE programacoes_pagamento_liberacoes
      ADD CONSTRAINT programacoes_pagamento_liberacoes_status_check
      CHECK (liberacao_status IN ('LIBERADA', 'BLOQUEADA_LIBERACAO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_liberacoes_resultado_check') THEN
    ALTER TABLE programacoes_pagamento_liberacoes
      ADD CONSTRAINT programacoes_pagamento_liberacoes_resultado_check
      CHECK (resultado IN ('PERMITIDO', 'NEGADO'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_liberacao_status
  ON programacoes_pagamento(company_id, liberacao_status, liberado_em);

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_liberacoes_programacao
  ON programacoes_pagamento_liberacoes(programacao_id, created_at DESC);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('programacoes-pagamento', 'liberar', 'Liberar programacao aprovada para execucao futura sem executar pagamento')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('FINANCEIRO', 'programacoes-pagamento', 'liberar'),
    ('DIRETORIA', 'programacoes-pagamento', 'liberar')
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

WITH regras(perfil_nome, modulo, tipo_documento, acao, valor_minimo, valor_maximo, observacoes) AS (
  VALUES
    ('FINANCEIRO', 'programacoes-pagamento', 'PROGRAMACAO_PAGAMENTO', 'liberar', 0::numeric, 20000::numeric, 'FINANCEIRO libera programacao local ate 20000 sem executar pagamento.'),
    ('DIRETORIA', 'programacoes-pagamento', 'PROGRAMACAO_PAGAMENTO', 'liberar', 20000.01::numeric, NULL::numeric, 'DIRETORIA libera programacao local acima de 20000 sem executar pagamento.')
),
empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
)
INSERT INTO alcadas_aprovacao (
  company_id,
  perfil_id,
  modulo,
  tipo_documento,
  acao,
  valor_minimo,
  valor_maximo,
  efeito,
  observacoes,
  status
)
SELECT empresa.id, p.id, regras.modulo, regras.tipo_documento, regras.acao, regras.valor_minimo, regras.valor_maximo, 'PERMITIR', regras.observacoes, 'ativo'
FROM regras
JOIN empresa ON true
JOIN perfis p ON p.company_id = empresa.id AND p.nome = regras.perfil_nome
WHERE NOT EXISTS (
  SELECT 1
  FROM alcadas_aprovacao a
  WHERE a.company_id = empresa.id
    AND a.perfil_id = p.id
    AND a.usuario_id IS NULL
    AND a.modulo = regras.modulo
    AND a.tipo_documento = regras.tipo_documento
    AND a.acao = regras.acao
    AND a.valor_minimo = regras.valor_minimo
    AND COALESCE(a.valor_maximo, -1) = COALESCE(regras.valor_maximo, -1)
);

INSERT INTO auditoria_eventos (company_id, entidade, acao, payload)
SELECT id, 'v3.5e', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_5E', 'escopo', 'liberacao_programacao_pagamento_sem_pagamento')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.5e' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_5E'
  );

COMMIT;
