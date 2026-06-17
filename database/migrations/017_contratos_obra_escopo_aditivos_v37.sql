-- V3.7 - Contratos de Obra, Escopo Comercial e Aditivos ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao emite NFS-e real, nao integra prefeitura, nao gera boleto, nao integra banco,
-- nao executa pagamento, nao gera CNAB, nao usa SharePoint/Entra/Power Automate real e nao executa DELETE fisico.

BEGIN;

CREATE TABLE IF NOT EXISTS contratos_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  cliente_id uuid NOT NULL REFERENCES clientes(id),
  obra_id uuid NOT NULL REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  numero text NOT NULL,
  objeto text NOT NULL,
  escopo_resumo text,
  valor_original numeric(14,2) NOT NULL DEFAULT 0,
  valor_aditivos numeric(14,2) NOT NULL DEFAULT 0,
  valor_total_contratado numeric(14,2) NOT NULL DEFAULT 0,
  data_inicio date,
  data_fim date,
  percentual_retencao_previsto numeric(7,4),
  impostos_previstos text,
  observacoes text,
  status text NOT NULL DEFAULT 'RASCUNHO',
  ativado_por uuid REFERENCES usuarios(id),
  ativado_em timestamptz,
  suspenso_por uuid REFERENCES usuarios(id),
  suspenso_em timestamptz,
  suspensao_motivo text,
  encerrado_por uuid REFERENCES usuarios(id),
  encerrado_em timestamptz,
  encerramento_motivo text,
  cancelado_por uuid REFERENCES usuarios(id),
  cancelado_em timestamptz,
  cancelamento_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (company_id, numero)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_obra_status_v37_check') THEN
    ALTER TABLE contratos_obra
      ADD CONSTRAINT contratos_obra_status_v37_check
      CHECK (status IN ('RASCUNHO', 'ATIVO', 'SUSPENSO', 'ENCERRADO', 'CANCELADO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_obra_valores_v37_check') THEN
    ALTER TABLE contratos_obra
      ADD CONSTRAINT contratos_obra_valores_v37_check
      CHECK (
        valor_original > 0
        AND valor_aditivos >= 0
        AND valor_total_contratado >= valor_original
        AND (percentual_retencao_previsto IS NULL OR percentual_retencao_previsto >= 0)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_obra_periodo_v37_check') THEN
    ALTER TABLE contratos_obra
      ADD CONSTRAINT contratos_obra_periodo_v37_check
      CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contratos_obra_company_status_v37
  ON contratos_obra(company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contratos_obra_cliente_v37
  ON contratos_obra(company_id, cliente_id, status);

CREATE INDEX IF NOT EXISTS idx_contratos_obra_obra_v37
  ON contratos_obra(company_id, obra_id, status);

CREATE TABLE IF NOT EXISTS contratos_obra_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES contratos_obra(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  codigo text,
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
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_obra_itens_status_v37_check') THEN
    ALTER TABLE contratos_obra_itens
      ADD CONSTRAINT contratos_obra_itens_status_v37_check
      CHECK (status IN ('ATIVO', 'INATIVO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_obra_itens_valores_v37_check') THEN
    ALTER TABLE contratos_obra_itens
      ADD CONSTRAINT contratos_obra_itens_valores_v37_check
      CHECK (quantidade > 0 AND valor_unitario >= 0 AND valor_total >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contratos_obra_itens_contrato_v37
  ON contratos_obra_itens(contrato_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_contratos_obra_itens_company_v37
  ON contratos_obra_itens(company_id, status);

CREATE TABLE IF NOT EXISTS contratos_obra_aditivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES contratos_obra(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  numero text NOT NULL,
  tipo text NOT NULL DEFAULT 'VALOR_ESCOPO',
  descricao text NOT NULL,
  escopo_descricao text,
  valor_delta numeric(14,2) NOT NULL DEFAULT 0,
  prazo_delta_dias integer,
  nova_data_fim date,
  justificativa text,
  status text NOT NULL DEFAULT 'RASCUNHO',
  aprovacao_status text,
  aprovado_por uuid REFERENCES usuarios(id),
  aprovado_em timestamptz,
  aprovacao_observacoes text,
  bloqueio_alcada_motivo text,
  submetido_por uuid REFERENCES usuarios(id),
  submetido_em timestamptz,
  reprovado_por uuid REFERENCES usuarios(id),
  reprovado_em timestamptz,
  reprovacao_motivo text,
  cancelado_por uuid REFERENCES usuarios(id),
  cancelado_em timestamptz,
  cancelamento_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (company_id, numero)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_obra_aditivos_status_v37_check') THEN
    ALTER TABLE contratos_obra_aditivos
      ADD CONSTRAINT contratos_obra_aditivos_status_v37_check
      CHECK (status IN ('RASCUNHO', 'SUBMETIDO', 'APROVADO', 'REPROVADO', 'CANCELADO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_obra_aditivos_aprovacao_v37_check') THEN
    ALTER TABLE contratos_obra_aditivos
      ADD CONSTRAINT contratos_obra_aditivos_aprovacao_v37_check
      CHECK (aprovacao_status IS NULL OR aprovacao_status IN ('PENDENTE_APROVACAO', 'APROVADO_TECNICO', 'APROVADO_DIRETORIA', 'REPROVADO', 'DEVOLVIDO', 'BLOQUEADO_ALCADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_obra_aditivos_valor_v37_check') THEN
    ALTER TABLE contratos_obra_aditivos
      ADD CONSTRAINT contratos_obra_aditivos_valor_v37_check
      CHECK (valor_delta >= 0 AND (prazo_delta_dias IS NULL OR prazo_delta_dias >= 0));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contratos_obra_aditivos_contrato_v37
  ON contratos_obra_aditivos(contrato_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contratos_obra_aditivos_company_v37
  ON contratos_obra_aditivos(company_id, status);

ALTER TABLE medicoes_obra
  ADD COLUMN IF NOT EXISTS contrato_obra_id uuid REFERENCES contratos_obra(id),
  ADD COLUMN IF NOT EXISTS contrato_obra_aditivo_id uuid REFERENCES contratos_obra_aditivos(id),
  ADD COLUMN IF NOT EXISTS contrato_validacao_status text,
  ADD COLUMN IF NOT EXISTS contrato_validacao_motivo text;

ALTER TABLE pedidos_faturamento
  ADD COLUMN IF NOT EXISTS contrato_obra_id uuid REFERENCES contratos_obra(id),
  ADD COLUMN IF NOT EXISTS contrato_obra_aditivo_id uuid REFERENCES contratos_obra_aditivos(id);

CREATE INDEX IF NOT EXISTS idx_medicoes_obra_contrato_obra_v37
  ON medicoes_obra(contrato_obra_id, status, competencia DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_faturamento_contrato_obra_v37
  ON pedidos_faturamento(contrato_obra_id, status, data_solicitacao DESC);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('contratos-obra', 'visualizar', 'Visualizar contratos de obra e aditivos'),
    ('contratos-obra', 'criar', 'Criar contratos de obra locais'),
    ('contratos-obra', 'editar', 'Editar contratos de obra em rascunho'),
    ('contratos-obra', 'ativar', 'Ativar contratos de obra com escopo cadastrado'),
    ('contratos-obra', 'suspender', 'Suspender contratos de obra logicamente'),
    ('contratos-obra', 'encerrar', 'Encerrar contratos de obra logicamente'),
    ('contratos-obra', 'cancelar', 'Cancelar contratos de obra logicamente'),
    ('contratos-obra', 'inativar_item', 'Inativar item de escopo sem DELETE fisico'),
    ('contratos-obra', 'criar_aditivo', 'Criar aditivo contratual local'),
    ('contratos-obra', 'aprovar_tecnico', 'Aprovar tecnicamente aditivo contratual ate alcada'),
    ('contratos-obra', 'aprovar_diretoria', 'Aprovar aditivo contratual pela diretoria')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('DIRETORIA', 'contratos-obra', 'visualizar'),
    ('DIRETORIA', 'contratos-obra', 'aprovar_diretoria'),
    ('PLANEJAMENTO', 'contratos-obra', 'visualizar'),
    ('PLANEJAMENTO', 'contratos-obra', 'criar'),
    ('PLANEJAMENTO', 'contratos-obra', 'editar'),
    ('PLANEJAMENTO', 'contratos-obra', 'ativar'),
    ('PLANEJAMENTO', 'contratos-obra', 'suspender'),
    ('PLANEJAMENTO', 'contratos-obra', 'encerrar'),
    ('PLANEJAMENTO', 'contratos-obra', 'cancelar'),
    ('PLANEJAMENTO', 'contratos-obra', 'inativar_item'),
    ('PLANEJAMENTO', 'contratos-obra', 'criar_aditivo'),
    ('PLANEJAMENTO', 'contratos-obra', 'aprovar_tecnico'),
    ('FINANCEIRO', 'contratos-obra', 'visualizar')
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
    ('PLANEJAMENTO', 'contratos-obra', 'ADITIVO_CONTRATUAL', 'aprovar_tecnico', 0::numeric, 20000::numeric, 'PLANEJAMENTO aprova aditivo contratual ate 20000.'),
    ('DIRETORIA', 'contratos-obra', 'ADITIVO_CONTRATUAL', 'aprovar_diretoria', 20000.01::numeric, NULL::numeric, 'DIRETORIA aprova aditivo contratual acima de 20000.')
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
SELECT id, 'v3.7', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_7', 'escopo', 'contratos_obra_escopo_aditivos')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.7' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_7'
  );

COMMIT;
