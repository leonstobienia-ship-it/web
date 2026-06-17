-- V3.5D - Programacao de Pagamento sem Baixa ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao executa pagamento, baixa, integracao bancaria, CNAB, SharePoint, Entra, Power Automate ou DELETE fisico.

BEGIN;

ALTER TABLE contas_pagar
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS divergencia_pendente boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS programacoes_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  codigo text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'RASCUNHO',
  data_prevista date NOT NULL,
  fornecedor_id uuid REFERENCES fornecedores(id),
  obra_id uuid REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  forma_pagamento_prevista text,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  quantidade_contas integer NOT NULL DEFAULT 0,
  observacoes text,
  justificativa text,
  aprovacao_status text,
  aprovado_por uuid REFERENCES usuarios(id),
  aprovado_em timestamptz,
  aprovacao_observacoes text,
  bloqueio_alcada_motivo text,
  submetido_por uuid REFERENCES usuarios(id),
  submetido_em timestamptz,
  cancelado_por uuid REFERENCES usuarios(id),
  cancelado_em timestamptz,
  cancelamento_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS programacoes_pagamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programacao_id uuid NOT NULL REFERENCES programacoes_pagamento(id),
  conta_pagar_id uuid NOT NULL REFERENCES contas_pagar(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  valor_programado numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'ATIVA',
  observacoes text,
  adicionado_por uuid REFERENCES usuarios(id),
  adicionado_em timestamptz NOT NULL DEFAULT now(),
  removido_por uuid REFERENCES usuarios(id),
  removido_em timestamptz,
  remocao_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_status_check') THEN
    ALTER TABLE programacoes_pagamento
      ADD CONSTRAINT programacoes_pagamento_status_check
      CHECK (status IN ('RASCUNHO', 'SUBMETIDA', 'APROVADA', 'REPROVADA', 'CANCELADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_aprovacao_status_check') THEN
    ALTER TABLE programacoes_pagamento
      ADD CONSTRAINT programacoes_pagamento_aprovacao_status_check
      CHECK (aprovacao_status IS NULL OR aprovacao_status IN ('PENDENTE_APROVACAO', 'APROVADO_TECNICO', 'APROVADO_DIRETORIA', 'REPROVADO', 'DEVOLVIDO', 'BLOQUEADO_ALCADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_valores_check') THEN
    ALTER TABLE programacoes_pagamento
      ADD CONSTRAINT programacoes_pagamento_valores_check
      CHECK (valor_total >= 0 AND quantidade_contas >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_itens_status_check') THEN
    ALTER TABLE programacoes_pagamento_itens
      ADD CONSTRAINT programacoes_pagamento_itens_status_check
      CHECK (status IN ('ATIVA', 'REMOVIDA', 'CANCELADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programacoes_pagamento_itens_valor_check') THEN
    ALTER TABLE programacoes_pagamento_itens
      ADD CONSTRAINT programacoes_pagamento_itens_valor_check
      CHECK (valor_programado > 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contas_pagar_ativo_v35d
  ON contas_pagar(company_id, ativo, status);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_divergencia_v35d
  ON contas_pagar(company_id, divergencia_pendente);

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_company_status
  ON programacoes_pagamento(company_id, status, data_prevista);

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_fornecedor
  ON programacoes_pagamento(fornecedor_id, data_prevista);

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_obra
  ON programacoes_pagamento(obra_id, data_prevista);

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_centro_custo
  ON programacoes_pagamento(centro_custo_id, data_prevista);

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_itens_programacao
  ON programacoes_pagamento_itens(programacao_id, status);

CREATE INDEX IF NOT EXISTS idx_programacoes_pagamento_itens_conta
  ON programacoes_pagamento_itens(conta_pagar_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_programacoes_pagamento_itens_conta_ativa
  ON programacoes_pagamento_itens(conta_pagar_id)
  WHERE status = 'ATIVA';

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('programacoes-pagamento', 'visualizar', 'Visualizar programacoes de pagamento sem baixa'),
    ('programacoes-pagamento', 'criar', 'Criar programacoes de pagamento em rascunho'),
    ('programacoes-pagamento', 'editar', 'Editar programacoes de pagamento em rascunho'),
    ('programacoes-pagamento', 'adicionar_conta', 'Adicionar conta aprovada a programacao em rascunho'),
    ('programacoes-pagamento', 'remover_conta', 'Remover logicamente conta de programacao em rascunho'),
    ('programacoes-pagamento', 'submeter', 'Submeter programacao para aprovacao por alcada'),
    ('programacoes-pagamento', 'aprovar_tecnico', 'Aprovar tecnicamente programacao de pagamento sem executar pagamento'),
    ('programacoes-pagamento', 'aprovar_diretoria', 'Aprovar programacao de pagamento pela diretoria sem executar pagamento'),
    ('programacoes-pagamento', 'reprovar', 'Reprovar programacao de pagamento sem baixa'),
    ('programacoes-pagamento', 'cancelar', 'Cancelar logicamente programacao de pagamento')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('FINANCEIRO', 'programacoes-pagamento', 'visualizar'),
    ('FINANCEIRO', 'programacoes-pagamento', 'criar'),
    ('FINANCEIRO', 'programacoes-pagamento', 'editar'),
    ('FINANCEIRO', 'programacoes-pagamento', 'adicionar_conta'),
    ('FINANCEIRO', 'programacoes-pagamento', 'remover_conta'),
    ('FINANCEIRO', 'programacoes-pagamento', 'submeter'),
    ('FINANCEIRO', 'programacoes-pagamento', 'aprovar_tecnico'),
    ('DIRETORIA', 'programacoes-pagamento', 'visualizar'),
    ('DIRETORIA', 'programacoes-pagamento', 'aprovar_diretoria'),
    ('DIRETORIA', 'programacoes-pagamento', 'reprovar'),
    ('DIRETORIA', 'programacoes-pagamento', 'cancelar')
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
    ('FINANCEIRO', 'programacoes-pagamento', 'PROGRAMACAO_PAGAMENTO', 'aprovar_tecnico', 0::numeric, 20000::numeric, 'FINANCEIRO aprova programacao local ate 20000 sem executar pagamento.'),
    ('DIRETORIA', 'programacoes-pagamento', 'PROGRAMACAO_PAGAMENTO', 'aprovar_diretoria', 20000.01::numeric, NULL::numeric, 'DIRETORIA aprova programacao local acima de 20000 sem executar pagamento.')
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
SELECT id, 'v3.5d', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_5D', 'escopo', 'programacao_pagamento_sem_baixa')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.5d' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_5D'
  );

COMMIT;
