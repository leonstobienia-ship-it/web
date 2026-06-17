-- V3.8 - Orcamento Base da Obra e Planejamento Executivo ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao emite NFS-e real, nao integra prefeitura, nao gera boleto, nao integra banco,
-- nao executa pagamento, nao gera CNAB, nao usa SharePoint/Entra/Power Automate real e nao executa DELETE fisico.

BEGIN;

CREATE TABLE IF NOT EXISTS orcamentos_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  obra_id uuid NOT NULL REFERENCES obras(id),
  cliente_id uuid REFERENCES clientes(id),
  contrato_obra_id uuid REFERENCES contratos_obra(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  codigo text NOT NULL,
  versao text NOT NULL DEFAULT 'V1',
  descricao text NOT NULL,
  competencia_base text,
  valor_previsto_total numeric(14,2) NOT NULL DEFAULT 0,
  valor_material numeric(14,2) NOT NULL DEFAULT 0,
  valor_mao_obra numeric(14,2) NOT NULL DEFAULT 0,
  valor_equipamento numeric(14,2) NOT NULL DEFAULT 0,
  valor_servico numeric(14,2) NOT NULL DEFAULT 0,
  valor_outros numeric(14,2) NOT NULL DEFAULT 0,
  margem_prevista_percentual numeric(7,4),
  observacoes text,
  status text NOT NULL DEFAULT 'RASCUNHO',
  enviado_revisao_por uuid REFERENCES usuarios(id),
  enviado_revisao_em timestamptz,
  aprovado_por uuid REFERENCES usuarios(id),
  aprovado_em timestamptz,
  aprovado_observacoes text,
  bloqueado_por uuid REFERENCES usuarios(id),
  bloqueado_em timestamptz,
  bloqueio_motivo text,
  cancelado_por uuid REFERENCES usuarios(id),
  cancelado_em timestamptz,
  cancelamento_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (company_id, codigo)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_obra_status_v38_check') THEN
    ALTER TABLE orcamentos_obra
      ADD CONSTRAINT orcamentos_obra_status_v38_check
      CHECK (status IN ('RASCUNHO', 'EM_REVISAO', 'APROVADO', 'BLOQUEADO', 'CANCELADO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_obra_valores_v38_check') THEN
    ALTER TABLE orcamentos_obra
      ADD CONSTRAINT orcamentos_obra_valores_v38_check
      CHECK (
        valor_previsto_total >= 0
        AND valor_material >= 0
        AND valor_mao_obra >= 0
        AND valor_equipamento >= 0
        AND valor_servico >= 0
        AND valor_outros >= 0
        AND (margem_prevista_percentual IS NULL OR margem_prevista_percentual >= 0)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_obra_competencia_v38_check') THEN
    ALTER TABLE orcamentos_obra
      ADD CONSTRAINT orcamentos_obra_competencia_v38_check
      CHECK (competencia_base IS NULL OR competencia_base ~ '^[0-9]{4}-[0-9]{2}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_orcamentos_obra_vigente_v38
  ON orcamentos_obra(company_id, obra_id)
  WHERE status = 'APROVADO';

CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_company_status_v38
  ON orcamentos_obra(company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_obra_v38
  ON orcamentos_obra(company_id, obra_id, status);

CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_contrato_v38
  ON orcamentos_obra(contrato_obra_id, status);

CREATE TABLE IF NOT EXISTS orcamentos_obra_pacotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES orcamentos_obra(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  codigo text NOT NULL,
  nome text NOT NULL,
  descricao text,
  etapa text,
  centro_custo_id uuid REFERENCES centros_custo(id),
  ordem integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ATIVO',
  inativado_por uuid REFERENCES usuarios(id),
  inativado_em timestamptz,
  inativacao_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (orcamento_id, codigo)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_obra_pacotes_status_v38_check') THEN
    ALTER TABLE orcamentos_obra_pacotes
      ADD CONSTRAINT orcamentos_obra_pacotes_status_v38_check
      CHECK (status IN ('ATIVO', 'INATIVO'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_pacotes_orcamento_v38
  ON orcamentos_obra_pacotes(orcamento_id, status, ordem, created_at);

CREATE TABLE IF NOT EXISTS orcamentos_obra_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES orcamentos_obra(id),
  pacote_id uuid REFERENCES orcamentos_obra_pacotes(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  tipo text NOT NULL,
  codigo text,
  descricao text NOT NULL,
  unidade text NOT NULL,
  quantidade numeric(14,4) NOT NULL DEFAULT 0,
  valor_unitario_previsto numeric(14,2) NOT NULL DEFAULT 0,
  valor_total_previsto numeric(14,2) NOT NULL DEFAULT 0,
  insumo_descricao text,
  mao_obra_categoria text,
  equipamento_descricao text,
  observacoes text,
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
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_obra_itens_tipo_v38_check') THEN
    ALTER TABLE orcamentos_obra_itens
      ADD CONSTRAINT orcamentos_obra_itens_tipo_v38_check
      CHECK (tipo IN ('MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO', 'SERVICO', 'OUTROS'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_obra_itens_status_v38_check') THEN
    ALTER TABLE orcamentos_obra_itens
      ADD CONSTRAINT orcamentos_obra_itens_status_v38_check
      CHECK (status IN ('ATIVO', 'INATIVO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_obra_itens_valores_v38_check') THEN
    ALTER TABLE orcamentos_obra_itens
      ADD CONSTRAINT orcamentos_obra_itens_valores_v38_check
      CHECK (quantidade > 0 AND valor_unitario_previsto >= 0 AND valor_total_previsto >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_itens_orcamento_v38
  ON orcamentos_obra_itens(orcamento_id, status, tipo, created_at);

CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_itens_pacote_v38
  ON orcamentos_obra_itens(pacote_id, status);

CREATE TABLE IF NOT EXISTS orcamentos_obra_cronograma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES orcamentos_obra(id),
  pacote_id uuid REFERENCES orcamentos_obra_pacotes(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  competencia text NOT NULL,
  valor_previsto numeric(14,2) NOT NULL DEFAULT 0,
  percentual_fisico_previsto numeric(7,4),
  observacoes text,
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
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_obra_cronograma_status_v38_check') THEN
    ALTER TABLE orcamentos_obra_cronograma
      ADD CONSTRAINT orcamentos_obra_cronograma_status_v38_check
      CHECK (status IN ('ATIVO', 'INATIVO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_obra_cronograma_valores_v38_check') THEN
    ALTER TABLE orcamentos_obra_cronograma
      ADD CONSTRAINT orcamentos_obra_cronograma_valores_v38_check
      CHECK (
        competencia ~ '^[0-9]{4}-[0-9]{2}$'
        AND valor_previsto >= 0
        AND (percentual_fisico_previsto IS NULL OR percentual_fisico_previsto >= 0)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_cronograma_orcamento_v38
  ON orcamentos_obra_cronograma(orcamento_id, status, competencia);

CREATE TABLE IF NOT EXISTS planejamento_executivo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  obra_id uuid NOT NULL REFERENCES obras(id),
  orcamento_id uuid REFERENCES orcamentos_obra(id),
  contrato_obra_id uuid REFERENCES contratos_obra(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  etapa text NOT NULL,
  descricao text,
  data_inicio_prevista date NOT NULL,
  data_fim_prevista date NOT NULL,
  responsavel_id uuid REFERENCES usuarios(id),
  observacoes text,
  status text NOT NULL DEFAULT 'RASCUNHO',
  ativado_por uuid REFERENCES usuarios(id),
  ativado_em timestamptz,
  revisado_por uuid REFERENCES usuarios(id),
  revisado_em timestamptz,
  revisao_motivo text,
  encerrado_por uuid REFERENCES usuarios(id),
  encerrado_em timestamptz,
  encerramento_motivo text,
  cancelado_por uuid REFERENCES usuarios(id),
  cancelado_em timestamptz,
  cancelamento_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'planejamento_executivo_status_v38_check') THEN
    ALTER TABLE planejamento_executivo
      ADD CONSTRAINT planejamento_executivo_status_v38_check
      CHECK (status IN ('RASCUNHO', 'ATIVO', 'REVISADO', 'ENCERRADO', 'CANCELADO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'planejamento_executivo_periodo_v38_check') THEN
    ALTER TABLE planejamento_executivo
      ADD CONSTRAINT planejamento_executivo_periodo_v38_check
      CHECK (data_fim_prevista >= data_inicio_prevista);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_planejamento_executivo_company_status_v38
  ON planejamento_executivo(company_id, status, data_inicio_prevista);

CREATE INDEX IF NOT EXISTS idx_planejamento_executivo_obra_v38
  ON planejamento_executivo(company_id, obra_id, status);

CREATE INDEX IF NOT EXISTS idx_planejamento_executivo_orcamento_v38
  ON planejamento_executivo(orcamento_id, status);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('orcamento-planejamento', 'visualizar', 'Visualizar orcamento base e planejamento executivo'),
    ('orcamento-planejamento', 'criar_orcamento', 'Criar orcamento base de obra local'),
    ('orcamento-planejamento', 'editar_orcamento', 'Editar orcamento base em rascunho'),
    ('orcamento-planejamento', 'aprovar_orcamento', 'Aprovar orcamento base vigente por obra'),
    ('orcamento-planejamento', 'bloquear_orcamento', 'Bloquear orcamento base sem exclusao fisica'),
    ('orcamento-planejamento', 'cancelar_orcamento', 'Cancelar orcamento base logicamente'),
    ('orcamento-planejamento', 'inativar_item', 'Inativar pacote, item ou cronograma sem DELETE fisico'),
    ('orcamento-planejamento', 'criar_planejamento', 'Criar planejamento executivo local'),
    ('orcamento-planejamento', 'ativar_planejamento', 'Ativar planejamento executivo'),
    ('orcamento-planejamento', 'revisar_planejamento', 'Revisar planejamento executivo'),
    ('orcamento-planejamento', 'encerrar_planejamento', 'Encerrar planejamento executivo')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('DIRETORIA', 'orcamento-planejamento', 'visualizar'),
    ('DIRETORIA', 'orcamento-planejamento', 'aprovar_orcamento'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'visualizar'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'criar_orcamento'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'editar_orcamento'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'bloquear_orcamento'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'cancelar_orcamento'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'inativar_item'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'criar_planejamento'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'ativar_planejamento'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'revisar_planejamento'),
    ('PLANEJAMENTO', 'orcamento-planejamento', 'encerrar_planejamento'),
    ('FINANCEIRO', 'orcamento-planejamento', 'visualizar')
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
SELECT id, 'v3.8', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_8', 'escopo', 'orcamento_base_planejamento_executivo')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.8' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_8'
  );

COMMIT;
