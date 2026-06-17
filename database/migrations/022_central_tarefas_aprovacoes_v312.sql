-- V3.12 - Central de Tarefas e Aprovacoes ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- A central e agregadora e nao executa pagamento, baixa, CNAB, banco, NFS-e,
-- prefeitura, SharePoint/Entra/Power Automate real ou DELETE fisico.

BEGIN;

CREATE TABLE IF NOT EXISTS central_tarefas_manuais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  codigo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  modulo text NOT NULL DEFAULT 'central-tarefas',
  origem text NOT NULL DEFAULT 'MANUAL',
  origem_id uuid,
  status text NOT NULL DEFAULT 'ABERTA',
  prioridade text NOT NULL DEFAULT 'MEDIA',
  responsavel_id uuid REFERENCES usuarios(id),
  perfil_id uuid REFERENCES perfis(id),
  prazo date,
  obra_id uuid REFERENCES obras(id),
  cliente_id uuid REFERENCES clientes(id),
  vista_por uuid REFERENCES usuarios(id),
  vista_em timestamptz,
  iniciado_por uuid REFERENCES usuarios(id),
  iniciado_em timestamptz,
  concluido_por uuid REFERENCES usuarios(id),
  concluido_em timestamptz,
  conclusao_observacoes text,
  cancelado_por uuid REFERENCES usuarios(id),
  cancelado_em timestamptz,
  cancelamento_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (company_id, codigo)
);

CREATE TABLE IF NOT EXISTS central_tarefas_manuais_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id uuid NOT NULL REFERENCES central_tarefas_manuais(id),
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
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'central_tarefas_manuais_status_v312_check') THEN
    ALTER TABLE central_tarefas_manuais
      ADD CONSTRAINT central_tarefas_manuais_status_v312_check
      CHECK (status IN ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'central_tarefas_manuais_prioridade_v312_check') THEN
    ALTER TABLE central_tarefas_manuais
      ADD CONSTRAINT central_tarefas_manuais_prioridade_v312_check
      CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_central_tarefas_manuais_company_status_v312
  ON central_tarefas_manuais(company_id, status, prioridade, prazo);

CREATE INDEX IF NOT EXISTS idx_central_tarefas_manuais_responsavel_v312
  ON central_tarefas_manuais(responsavel_id, status, prazo);

CREATE INDEX IF NOT EXISTS idx_central_tarefas_manuais_perfil_v312
  ON central_tarefas_manuais(perfil_id, status, prazo);

CREATE INDEX IF NOT EXISTS idx_central_tarefas_manuais_modulo_v312
  ON central_tarefas_manuais(company_id, modulo, status);

CREATE INDEX IF NOT EXISTS idx_central_tarefas_manuais_historico_v312
  ON central_tarefas_manuais_historico(tarefa_id, created_at DESC);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('central-tarefas', 'visualizar', 'Visualizar central de tarefas e aprovacoes'),
    ('central-tarefas', 'criar_manual', 'Criar tarefa manual auxiliar na central'),
    ('central-tarefas', 'marcar_vista', 'Marcar tarefa manual auxiliar como vista'),
    ('central-tarefas', 'iniciar_manual', 'Iniciar tarefa manual auxiliar'),
    ('central-tarefas', 'concluir_manual', 'Concluir tarefa manual auxiliar'),
    ('central-tarefas', 'cancelar_manual', 'Cancelar tarefa manual auxiliar logicamente')
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
    ('ADMIN', 'central-tarefas', 'visualizar'),
    ('ADMIN', 'central-tarefas', 'criar_manual'),
    ('ADMIN', 'central-tarefas', 'marcar_vista'),
    ('ADMIN', 'central-tarefas', 'iniciar_manual'),
    ('ADMIN', 'central-tarefas', 'concluir_manual'),
    ('ADMIN', 'central-tarefas', 'cancelar_manual'),
    ('DIRETORIA', 'central-tarefas', 'visualizar'),
    ('DIRETORIA', 'central-tarefas', 'criar_manual'),
    ('DIRETORIA', 'central-tarefas', 'marcar_vista'),
    ('DIRETORIA', 'central-tarefas', 'iniciar_manual'),
    ('DIRETORIA', 'central-tarefas', 'concluir_manual'),
    ('DIRETORIA', 'central-tarefas', 'cancelar_manual'),
    ('PLANEJAMENTO', 'central-tarefas', 'visualizar'),
    ('PLANEJAMENTO', 'central-tarefas', 'criar_manual'),
    ('PLANEJAMENTO', 'central-tarefas', 'marcar_vista'),
    ('PLANEJAMENTO', 'central-tarefas', 'iniciar_manual'),
    ('PLANEJAMENTO', 'central-tarefas', 'concluir_manual'),
    ('COMPRAS', 'central-tarefas', 'visualizar'),
    ('COMPRAS', 'central-tarefas', 'criar_manual'),
    ('COMPRAS', 'central-tarefas', 'marcar_vista'),
    ('COMPRAS', 'central-tarefas', 'iniciar_manual'),
    ('COMPRAS', 'central-tarefas', 'concluir_manual'),
    ('FINANCEIRO', 'central-tarefas', 'visualizar'),
    ('FINANCEIRO', 'central-tarefas', 'criar_manual'),
    ('FINANCEIRO', 'central-tarefas', 'marcar_vista'),
    ('FINANCEIRO', 'central-tarefas', 'iniciar_manual'),
    ('FINANCEIRO', 'central-tarefas', 'concluir_manual'),
    ('CAMPO', 'central-tarefas', 'visualizar'),
    ('CAMPO', 'central-tarefas', 'criar_manual'),
    ('CAMPO', 'central-tarefas', 'marcar_vista'),
    ('CAMPO', 'central-tarefas', 'iniciar_manual'),
    ('CAMPO', 'central-tarefas', 'concluir_manual')
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
SELECT id, 'v3.12', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_12', 'escopo', 'central_tarefas_aprovacoes')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.12' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_12'
  );

COMMIT;
