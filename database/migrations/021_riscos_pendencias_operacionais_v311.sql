-- V3.11 - Gestao de Riscos e Pendencias Operacionais ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao executa pagamento, baixa, CNAB, banco, NFS-e, prefeitura, SharePoint/Entra/Power Automate real ou DELETE fisico.

BEGIN;

CREATE TABLE IF NOT EXISTS riscos_pendencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  codigo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'OUTROS',
  prioridade text NOT NULL DEFAULT 'MEDIA',
  status text NOT NULL DEFAULT 'ABERTA',
  responsavel_id uuid REFERENCES usuarios(id),
  prazo date,
  obra_id uuid REFERENCES obras(id),
  cliente_id uuid REFERENCES clientes(id),
  contrato_obra_id uuid REFERENCES contratos_obra(id),
  contrato_obra_aditivo_id uuid REFERENCES contratos_obra_aditivos(id),
  orcamento_id uuid REFERENCES orcamentos_obra(id),
  solicitacao_compra_id uuid REFERENCES solicitacoes_compra(id),
  cotacao_id uuid REFERENCES cotacoes(id),
  pedido_compra_id uuid REFERENCES pedidos_compra(id),
  nota_fiscal_entrada_id uuid REFERENCES notas_fiscais_entrada(id),
  conta_pagar_id uuid REFERENCES contas_pagar(id),
  programacao_pagamento_id uuid REFERENCES programacoes_pagamento(id),
  medicao_id uuid REFERENCES medicoes_obra(id),
  pedido_faturamento_id uuid REFERENCES pedidos_faturamento(id),
  dashboard_alerta_tipo text,
  dashboard_alerta_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  origem text NOT NULL DEFAULT 'MANUAL',
  bloqueio_motivo text,
  resolucao text,
  iniciado_por uuid REFERENCES usuarios(id),
  iniciado_em timestamptz,
  bloqueado_por uuid REFERENCES usuarios(id),
  bloqueado_em timestamptz,
  resolvido_por uuid REFERENCES usuarios(id),
  resolvido_em timestamptz,
  cancelado_por uuid REFERENCES usuarios(id),
  cancelado_em timestamptz,
  cancelamento_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (company_id, codigo)
);

CREATE TABLE IF NOT EXISTS riscos_pendencias_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pendencia_id uuid NOT NULL REFERENCES riscos_pendencias(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  comentario text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS riscos_pendencias_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pendencia_id uuid NOT NULL REFERENCES riscos_pendencias(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  acao text NOT NULL,
  status_anterior text,
  status_novo text,
  usuario_id uuid REFERENCES usuarios(id),
  comentario text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'riscos_pendencias_status_v311_check') THEN
    ALTER TABLE riscos_pendencias
      ADD CONSTRAINT riscos_pendencias_status_v311_check
      CHECK (status IN ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA', 'RESOLVIDA', 'CANCELADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'riscos_pendencias_prioridade_v311_check') THEN
    ALTER TABLE riscos_pendencias
      ADD CONSTRAINT riscos_pendencias_prioridade_v311_check
      CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'riscos_pendencias_tipo_v311_check') THEN
    ALTER TABLE riscos_pendencias
      ADD CONSTRAINT riscos_pendencias_tipo_v311_check
      CHECK (tipo IN ('FINANCEIRO', 'COMPRA', 'CONTRATO', 'OBRA', 'MEDICAO', 'FATURAMENTO', 'ORCAMENTO', 'MARGEM', 'DOCUMENTACAO', 'OUTROS'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'riscos_pendencias_origem_v311_check') THEN
    ALTER TABLE riscos_pendencias
      ADD CONSTRAINT riscos_pendencias_origem_v311_check
      CHECK (origem IN ('MANUAL', 'DASHBOARD_ALERTA', 'OPERACIONAL'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_riscos_pendencias_company_status_v311
  ON riscos_pendencias(company_id, status, prioridade, prazo);

CREATE INDEX IF NOT EXISTS idx_riscos_pendencias_responsavel_v311
  ON riscos_pendencias(responsavel_id, status, prazo);

CREATE INDEX IF NOT EXISTS idx_riscos_pendencias_obra_v311
  ON riscos_pendencias(obra_id, status, prioridade);

CREATE INDEX IF NOT EXISTS idx_riscos_pendencias_cliente_v311
  ON riscos_pendencias(cliente_id, status);

CREATE INDEX IF NOT EXISTS idx_riscos_pendencias_dashboard_alerta_v311
  ON riscos_pendencias(company_id, dashboard_alerta_tipo, status)
  WHERE dashboard_alerta_tipo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_riscos_pendencias_comentarios_v311
  ON riscos_pendencias_comentarios(pendencia_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_riscos_pendencias_historico_v311
  ON riscos_pendencias_historico(pendencia_id, created_at DESC);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('riscos-pendencias', 'visualizar', 'Visualizar riscos e pendencias operacionais'),
    ('riscos-pendencias', 'criar', 'Criar risco ou pendencia operacional'),
    ('riscos-pendencias', 'editar', 'Editar risco ou pendencia em aberto'),
    ('riscos-pendencias', 'iniciar', 'Iniciar atendimento de pendencia'),
    ('riscos-pendencias', 'bloquear', 'Bloquear pendencia sem exclusao fisica'),
    ('riscos-pendencias', 'resolver', 'Resolver pendencia com registro de solucao'),
    ('riscos-pendencias', 'cancelar', 'Cancelar pendencia logicamente'),
    ('riscos-pendencias', 'comentar', 'Adicionar comentario em pendencia'),
    ('riscos-pendencias', 'gerar_de_alerta', 'Gerar pendencia a partir de alerta executivo')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('DIRETORIA', 'riscos-pendencias', 'visualizar'),
    ('DIRETORIA', 'riscos-pendencias', 'criar'),
    ('DIRETORIA', 'riscos-pendencias', 'editar'),
    ('DIRETORIA', 'riscos-pendencias', 'iniciar'),
    ('DIRETORIA', 'riscos-pendencias', 'bloquear'),
    ('DIRETORIA', 'riscos-pendencias', 'resolver'),
    ('DIRETORIA', 'riscos-pendencias', 'cancelar'),
    ('DIRETORIA', 'riscos-pendencias', 'comentar'),
    ('DIRETORIA', 'riscos-pendencias', 'gerar_de_alerta'),
    ('PLANEJAMENTO', 'riscos-pendencias', 'visualizar'),
    ('PLANEJAMENTO', 'riscos-pendencias', 'criar'),
    ('PLANEJAMENTO', 'riscos-pendencias', 'editar'),
    ('PLANEJAMENTO', 'riscos-pendencias', 'iniciar'),
    ('PLANEJAMENTO', 'riscos-pendencias', 'bloquear'),
    ('PLANEJAMENTO', 'riscos-pendencias', 'resolver'),
    ('PLANEJAMENTO', 'riscos-pendencias', 'comentar'),
    ('FINANCEIRO', 'riscos-pendencias', 'visualizar'),
    ('FINANCEIRO', 'riscos-pendencias', 'criar'),
    ('FINANCEIRO', 'riscos-pendencias', 'editar'),
    ('FINANCEIRO', 'riscos-pendencias', 'iniciar'),
    ('FINANCEIRO', 'riscos-pendencias', 'bloquear'),
    ('FINANCEIRO', 'riscos-pendencias', 'resolver'),
    ('FINANCEIRO', 'riscos-pendencias', 'comentar')
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
SELECT id, 'v3.11', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_11', 'escopo', 'riscos_pendencias_operacionais')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.11' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_11'
  );

COMMIT;
