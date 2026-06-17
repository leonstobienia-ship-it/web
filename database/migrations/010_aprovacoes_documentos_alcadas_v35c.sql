-- V3.5C - Aprovacoes por alcada nos documentos ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao implementa programacao bancaria, liberacao bancaria, pagamento, baixa, SharePoint, Entra, Power Automate ou DELETE fisico.

BEGIN;

ALTER TABLE solicitacoes_compra
  ADD COLUMN IF NOT EXISTS aprovacao_status text,
  ADD COLUMN IF NOT EXISTS aprovado_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovacao_observacoes text,
  ADD COLUMN IF NOT EXISTS bloqueio_alcada_motivo text;

ALTER TABLE cotacoes
  ADD COLUMN IF NOT EXISTS aprovacao_status text,
  ADD COLUMN IF NOT EXISTS aprovado_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovacao_observacoes text,
  ADD COLUMN IF NOT EXISTS bloqueio_alcada_motivo text;

ALTER TABLE pedidos_compra
  ADD COLUMN IF NOT EXISTS aprovacao_status text,
  ADD COLUMN IF NOT EXISTS aprovado_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovacao_observacoes text,
  ADD COLUMN IF NOT EXISTS bloqueio_alcada_motivo text;

ALTER TABLE notas_fiscais_entrada
  ADD COLUMN IF NOT EXISTS aprovacao_status text,
  ADD COLUMN IF NOT EXISTS aprovado_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovacao_observacoes text,
  ADD COLUMN IF NOT EXISTS bloqueio_alcada_motivo text;

ALTER TABLE contas_pagar
  ADD COLUMN IF NOT EXISTS aprovacao_status text,
  ADD COLUMN IF NOT EXISTS aprovado_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovacao_observacoes text,
  ADD COLUMN IF NOT EXISTS bloqueio_alcada_motivo text;

DO $$
DECLARE
  approval_values text := '(''PENDENTE_APROVACAO'', ''APROVADO_TECNICO'', ''APROVADO_DIRETORIA'', ''REPROVADO'', ''DEVOLVIDO'', ''BLOQUEADO_ALCADA'')';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_compra_aprovacao_status_check') THEN
    ALTER TABLE solicitacoes_compra
      ADD CONSTRAINT solicitacoes_compra_aprovacao_status_check
      CHECK (aprovacao_status IS NULL OR aprovacao_status IN ('PENDENTE_APROVACAO', 'APROVADO_TECNICO', 'APROVADO_DIRETORIA', 'REPROVADO', 'DEVOLVIDO', 'BLOQUEADO_ALCADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_aprovacao_status_check') THEN
    ALTER TABLE cotacoes
      ADD CONSTRAINT cotacoes_aprovacao_status_check
      CHECK (aprovacao_status IS NULL OR aprovacao_status IN ('PENDENTE_APROVACAO', 'APROVADO_TECNICO', 'APROVADO_DIRETORIA', 'REPROVADO', 'DEVOLVIDO', 'BLOQUEADO_ALCADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_compra_aprovacao_status_check') THEN
    ALTER TABLE pedidos_compra
      ADD CONSTRAINT pedidos_compra_aprovacao_status_check
      CHECK (aprovacao_status IS NULL OR aprovacao_status IN ('PENDENTE_APROVACAO', 'APROVADO_TECNICO', 'APROVADO_DIRETORIA', 'REPROVADO', 'DEVOLVIDO', 'BLOQUEADO_ALCADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_entrada_aprovacao_status_check') THEN
    ALTER TABLE notas_fiscais_entrada
      ADD CONSTRAINT notas_fiscais_entrada_aprovacao_status_check
      CHECK (aprovacao_status IS NULL OR aprovacao_status IN ('PENDENTE_APROVACAO', 'APROVADO_TECNICO', 'APROVADO_DIRETORIA', 'REPROVADO', 'DEVOLVIDO', 'BLOQUEADO_ALCADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_pagar_aprovacao_status_check') THEN
    ALTER TABLE contas_pagar
      ADD CONSTRAINT contas_pagar_aprovacao_status_check
      CHECK (aprovacao_status IS NULL OR aprovacao_status IN ('PENDENTE_APROVACAO', 'APROVADO_TECNICO', 'APROVADO_DIRETORIA', 'REPROVADO', 'DEVOLVIDO', 'BLOQUEADO_ALCADA'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_compra_aprovacao ON solicitacoes_compra(aprovacao_status, aprovado_em DESC);
CREATE INDEX IF NOT EXISTS idx_cotacoes_aprovacao ON cotacoes(aprovacao_status, aprovado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_aprovacao ON pedidos_compra(aprovacao_status, aprovado_em DESC);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_entrada_aprovacao ON notas_fiscais_entrada(aprovacao_status, aprovado_em DESC);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_aprovacao ON contas_pagar(aprovacao_status, aprovado_em DESC);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('cotacoes', 'aprovar_tecnico', 'Aprovar tecnicamente cotacoes'),
    ('cotacoes', 'aprovar_diretoria', 'Aprovar cotacoes pela diretoria'),
    ('pedidos-compra', 'aprovar_tecnico', 'Aprovar tecnicamente pedidos'),
    ('notas-fiscais-entrada', 'aprovar_tecnico', 'Aprovar tecnicamente notas fiscais de entrada'),
    ('notas-fiscais-entrada', 'aprovar_diretoria', 'Aprovar notas fiscais de entrada pela diretoria'),
    ('contas-pagar', 'aprovar_tecnico', 'Aprovar tecnicamente contas a pagar'),
    ('contas-pagar', 'aprovar_diretoria', 'Aprovar contas a pagar pela diretoria')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('DIRETORIA', 'cotacoes', 'aprovar_diretoria'),
    ('DIRETORIA', 'notas-fiscais-entrada', 'aprovar_diretoria'),
    ('DIRETORIA', 'contas-pagar', 'aprovar_diretoria'),
    ('PLANEJAMENTO', 'cotacoes', 'aprovar_tecnico'),
    ('PLANEJAMENTO', 'pedidos-compra', 'aprovar_tecnico'),
    ('FINANCEIRO', 'notas-fiscais-entrada', 'aprovar_tecnico'),
    ('FINANCEIRO', 'contas-pagar', 'aprovar_tecnico')
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
    ('PLANEJAMENTO', 'cotacoes', 'COTACAO', 'aprovar_tecnico', 0::numeric, 20000::numeric, 'PLANEJAMENTO aprova tecnicamente cotacoes ate 20000.'),
    ('DIRETORIA', 'cotacoes', 'COTACAO', 'aprovar_diretoria', 20000.01::numeric, NULL::numeric, 'DIRETORIA aprova cotacoes acima de 20000.'),
    ('PLANEJAMENTO', 'pedidos-compra', 'PEDIDO_COMPRA', 'aprovar_tecnico', 0::numeric, 20000::numeric, 'PLANEJAMENTO aprova tecnicamente pedidos ate 20000.'),
    ('FINANCEIRO', 'notas-fiscais-entrada', 'NOTA_FISCAL_ENTRADA', 'aprovar_tecnico', 0::numeric, 20000::numeric, 'FINANCEIRO aprova tecnicamente NF de entrada ate 20000.'),
    ('DIRETORIA', 'notas-fiscais-entrada', 'NOTA_FISCAL_ENTRADA', 'aprovar_diretoria', 20000.01::numeric, NULL::numeric, 'DIRETORIA aprova NF de entrada acima de 20000.'),
    ('FINANCEIRO', 'contas-pagar', 'CONTA_PAGAR', 'aprovar_tecnico', 0::numeric, 20000::numeric, 'FINANCEIRO aprova conta a pagar sem liberar pagamento.'),
    ('DIRETORIA', 'contas-pagar', 'CONTA_PAGAR', 'aprovar_diretoria', 20000.01::numeric, NULL::numeric, 'DIRETORIA aprova conta a pagar acima de 20000 sem liberar pagamento.')
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
SELECT id, 'v3.5c', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_5C', 'escopo', 'aprovacoes_documentos_alcadas')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.5c' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_5C'
  );

COMMIT;
