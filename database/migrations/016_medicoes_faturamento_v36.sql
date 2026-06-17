-- V3.6 - Medicoes e Faturamento ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao emite NFS-e real, nao integra prefeitura, nao gera boleto, nao executa cobranca bancaria,
-- nao baixa recebivel automaticamente, nao usa SharePoint/Entra/Power Automate real e nao executa DELETE fisico.

BEGIN;

UPDATE medicoes_obra
SET status = CASE lower(status)
  WHEN 'rascunho' THEN 'RASCUNHO'
  WHEN 'aprovada' THEN 'APROVADA'
  WHEN 'cancelada' THEN 'CANCELADA'
  ELSE status
END
WHERE status = lower(status);

ALTER TABLE medicoes_obra
  ALTER COLUMN status SET DEFAULT 'RASCUNHO',
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id),
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS contrato_escopo text,
  ADD COLUMN IF NOT EXISTS valor_bruto numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retencoes_previstas numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impostos_estimados numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_liquido_previsto numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS aprovacao_status text,
  ADD COLUMN IF NOT EXISTS aprovacao_observacoes text,
  ADD COLUMN IF NOT EXISTS bloqueio_alcada_motivo text,
  ADD COLUMN IF NOT EXISTS submetido_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS submetido_em timestamptz,
  ADD COLUMN IF NOT EXISTS devolvido_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS devolvido_em timestamptz,
  ADD COLUMN IF NOT EXISTS devolucao_motivo text,
  ADD COLUMN IF NOT EXISTS cancelado_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS cancelado_em timestamptz,
  ADD COLUMN IF NOT EXISTS cancelamento_motivo text,
  ADD COLUMN IF NOT EXISTS faturamento_solicitado_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS faturamento_solicitado_em timestamptz,
  ADD COLUMN IF NOT EXISTS faturado_manual_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS faturado_manual_em timestamptz,
  ADD COLUMN IF NOT EXISTS faturado_manual_data date,
  ADD COLUMN IF NOT EXISTS faturado_manual_observacoes text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medicoes_obra_status_v36_check') THEN
    ALTER TABLE medicoes_obra
      ADD CONSTRAINT medicoes_obra_status_v36_check
      CHECK (status IN ('RASCUNHO', 'SUBMETIDA', 'EM_ANALISE', 'APROVADA', 'DEVOLVIDA', 'CANCELADA', 'FATURAMENTO_SOLICITADO', 'FATURADO_MANUALMENTE'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medicoes_obra_aprovacao_status_v36_check') THEN
    ALTER TABLE medicoes_obra
      ADD CONSTRAINT medicoes_obra_aprovacao_status_v36_check
      CHECK (aprovacao_status IS NULL OR aprovacao_status IN ('PENDENTE_APROVACAO', 'APROVADO_TECNICO', 'APROVADO_DIRETORIA', 'REPROVADO', 'DEVOLVIDO', 'BLOQUEADO_ALCADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medicoes_obra_valores_v36_check') THEN
    ALTER TABLE medicoes_obra
      ADD CONSTRAINT medicoes_obra_valores_v36_check
      CHECK (
        valor_bruto >= 0
        AND retencoes_previstas >= 0
        AND impostos_estimados >= 0
        AND valor_liquido_previsto >= 0
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_medicoes_obra_company_numero_v36
  ON medicoes_obra(company_id, numero)
  WHERE numero IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medicoes_obra_cliente_v36
  ON medicoes_obra(company_id, cliente_id, status);

CREATE INDEX IF NOT EXISTS idx_medicoes_obra_status_v36
  ON medicoes_obra(company_id, status, competencia DESC);

CREATE TABLE IF NOT EXISTS medicoes_obra_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicao_id uuid NOT NULL REFERENCES medicoes_obra(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  descricao text NOT NULL,
  unidade text NOT NULL,
  quantidade numeric(14,4) NOT NULL DEFAULT 0,
  valor_unitario numeric(14,2) NOT NULL DEFAULT 0,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  centro_custo_id uuid REFERENCES centros_custo(id),
  etapa_servico text,
  status text NOT NULL DEFAULT 'ATIVO',
  inativado_por uuid REFERENCES usuarios(id),
  inativado_em timestamptz,
  inativacao_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medicoes_obra_itens_status_v36_check') THEN
    ALTER TABLE medicoes_obra_itens
      ADD CONSTRAINT medicoes_obra_itens_status_v36_check
      CHECK (status IN ('ATIVO', 'INATIVO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medicoes_obra_itens_valores_v36_check') THEN
    ALTER TABLE medicoes_obra_itens
      ADD CONSTRAINT medicoes_obra_itens_valores_v36_check
      CHECK (quantidade > 0 AND valor_unitario >= 0 AND valor_total >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_medicoes_obra_itens_medicao_v36
  ON medicoes_obra_itens(medicao_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_medicoes_obra_itens_company_v36
  ON medicoes_obra_itens(company_id, status);

CREATE TABLE IF NOT EXISTS pedidos_faturamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicao_id uuid NOT NULL REFERENCES medicoes_obra(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  cliente_id uuid NOT NULL REFERENCES clientes(id),
  obra_id uuid NOT NULL REFERENCES obras(id),
  codigo text NOT NULL,
  valor_solicitado numeric(14,2) NOT NULL DEFAULT 0,
  data_solicitacao date NOT NULL DEFAULT current_date,
  responsavel_id uuid REFERENCES usuarios(id),
  status text NOT NULL DEFAULT 'SOLICITADO',
  aprovacao_status text,
  aprovado_por uuid REFERENCES usuarios(id),
  aprovado_em timestamptz,
  aprovacao_observacoes text,
  bloqueio_alcada_motivo text,
  faturado_manual_por uuid REFERENCES usuarios(id),
  faturado_manual_em timestamptz,
  faturado_manual_data date,
  faturado_manual_observacoes text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (company_id, codigo)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_faturamento_status_v36_check') THEN
    ALTER TABLE pedidos_faturamento
      ADD CONSTRAINT pedidos_faturamento_status_v36_check
      CHECK (status IN ('SOLICITADO', 'APROVADO', 'FATURADO_MANUALMENTE', 'CANCELADO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_faturamento_aprovacao_status_v36_check') THEN
    ALTER TABLE pedidos_faturamento
      ADD CONSTRAINT pedidos_faturamento_aprovacao_status_v36_check
      CHECK (aprovacao_status IS NULL OR aprovacao_status IN ('PENDENTE_APROVACAO', 'APROVADO_TECNICO', 'APROVADO_DIRETORIA', 'REPROVADO', 'DEVOLVIDO', 'BLOQUEADO_ALCADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_faturamento_valor_v36_check') THEN
    ALTER TABLE pedidos_faturamento
      ADD CONSTRAINT pedidos_faturamento_valor_v36_check
      CHECK (valor_solicitado > 0);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_pedidos_faturamento_medicao_ativo_v36
  ON pedidos_faturamento(medicao_id)
  WHERE status <> 'CANCELADO';

CREATE INDEX IF NOT EXISTS idx_pedidos_faturamento_status_v36
  ON pedidos_faturamento(company_id, status, data_solicitacao DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_faturamento_cliente_v36
  ON pedidos_faturamento(company_id, cliente_id, status);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('medicoes-faturamento', 'visualizar', 'Visualizar medicoes e pedidos de faturamento'),
    ('medicoes-faturamento', 'criar', 'Criar medicoes de obra locais'),
    ('medicoes-faturamento', 'editar', 'Editar medicoes de obra em rascunho ou devolvidas'),
    ('medicoes-faturamento', 'enviar', 'Enviar medicoes para analise interna'),
    ('medicoes-faturamento', 'aprovar_tecnico', 'Aprovar tecnicamente medicoes e pedidos de faturamento ate alcada'),
    ('medicoes-faturamento', 'aprovar_diretoria', 'Aprovar medicoes e pedidos de faturamento pela diretoria'),
    ('medicoes-faturamento', 'devolver', 'Devolver medicoes para ajuste'),
    ('medicoes-faturamento', 'cancelar', 'Cancelar logicamente medicoes ainda nao faturadas manualmente'),
    ('medicoes-faturamento', 'inativar_item', 'Inativar item de medicao sem DELETE fisico'),
    ('medicoes-faturamento', 'criar_pedido_faturamento', 'Criar pedido interno de faturamento sem emitir NFS-e real'),
    ('medicoes-faturamento', 'marcar_faturado_manual', 'Registrar faturamento manual informado externamente sem integracao fiscal')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('DIRETORIA', 'medicoes-faturamento', 'visualizar'),
    ('DIRETORIA', 'medicoes-faturamento', 'aprovar_diretoria'),
    ('DIRETORIA', 'medicoes-faturamento', 'marcar_faturado_manual'),
    ('PLANEJAMENTO', 'medicoes-faturamento', 'visualizar'),
    ('PLANEJAMENTO', 'medicoes-faturamento', 'criar'),
    ('PLANEJAMENTO', 'medicoes-faturamento', 'editar'),
    ('PLANEJAMENTO', 'medicoes-faturamento', 'enviar'),
    ('PLANEJAMENTO', 'medicoes-faturamento', 'aprovar_tecnico'),
    ('PLANEJAMENTO', 'medicoes-faturamento', 'devolver'),
    ('PLANEJAMENTO', 'medicoes-faturamento', 'cancelar'),
    ('PLANEJAMENTO', 'medicoes-faturamento', 'inativar_item'),
    ('FINANCEIRO', 'medicoes-faturamento', 'visualizar'),
    ('FINANCEIRO', 'medicoes-faturamento', 'criar_pedido_faturamento'),
    ('FINANCEIRO', 'medicoes-faturamento', 'aprovar_tecnico'),
    ('FINANCEIRO', 'medicoes-faturamento', 'marcar_faturado_manual')
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
    ('PLANEJAMENTO', 'medicoes-faturamento', 'MEDICAO_OBRA', 'aprovar_tecnico', 0::numeric, 20000::numeric, 'PLANEJAMENTO aprova medicao de obra ate 20000.'),
    ('DIRETORIA', 'medicoes-faturamento', 'MEDICAO_OBRA', 'aprovar_diretoria', 20000.01::numeric, NULL::numeric, 'DIRETORIA aprova medicao de obra acima de 20000.'),
    ('FINANCEIRO', 'medicoes-faturamento', 'PEDIDO_FATURAMENTO', 'aprovar_tecnico', 0::numeric, 20000::numeric, 'FINANCEIRO aprova pedido interno de faturamento ate 20000.'),
    ('DIRETORIA', 'medicoes-faturamento', 'PEDIDO_FATURAMENTO', 'aprovar_diretoria', 20000.01::numeric, NULL::numeric, 'DIRETORIA aprova pedido interno de faturamento acima de 20000.')
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
SELECT id, 'v3.6', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_6', 'escopo', 'medicoes_faturamento')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.6' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_6'
  );

COMMIT;
