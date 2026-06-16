-- V3.5B - Perfis, Escopos e Alcadas ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao implementa programacao bancaria, liberacao financeira, pagamento, baixa, SharePoint, Entra, Power Automate ou DELETE fisico.

BEGIN;

CREATE TABLE IF NOT EXISTS escopos_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  modulo text NOT NULL,
  acao text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (company_id, modulo, acao)
);

CREATE TABLE IF NOT EXISTS perfis_escopos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES perfis(id),
  escopo_id uuid NOT NULL REFERENCES escopos_acesso(id),
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (perfil_id, escopo_id)
);

CREATE TABLE IF NOT EXISTS usuarios_perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  perfil_id uuid NOT NULL REFERENCES perfis(id),
  principal boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE (usuario_id, perfil_id)
);

CREATE TABLE IF NOT EXISTS alcadas_aprovacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  usuario_id uuid REFERENCES usuarios(id),
  perfil_id uuid REFERENCES perfis(id),
  modulo text NOT NULL,
  tipo_documento text NOT NULL,
  acao text NOT NULL,
  obra_id uuid REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  valor_minimo numeric(14,2) NOT NULL DEFAULT 0,
  valor_maximo numeric(14,2),
  efeito text NOT NULL DEFAULT 'PERMITIR',
  observacoes text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS auditoria_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES empresas(id),
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'escopos_acesso_status_check') THEN
    ALTER TABLE escopos_acesso
      ADD CONSTRAINT escopos_acesso_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perfis_status_check') THEN
    ALTER TABLE perfis
      ADD CONSTRAINT perfis_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_perfis_status_check') THEN
    ALTER TABLE usuarios_perfis
      ADD CONSTRAINT usuarios_perfis_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perfis_escopos_status_check') THEN
    ALTER TABLE perfis_escopos
      ADD CONSTRAINT perfis_escopos_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alcadas_aprovacao_status_check') THEN
    ALTER TABLE alcadas_aprovacao
      ADD CONSTRAINT alcadas_aprovacao_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alcadas_aprovacao_efeito_check') THEN
    ALTER TABLE alcadas_aprovacao
      ADD CONSTRAINT alcadas_aprovacao_efeito_check CHECK (efeito IN ('PERMITIR', 'NEGAR'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alcadas_aprovacao_responsavel_check') THEN
    ALTER TABLE alcadas_aprovacao
      ADD CONSTRAINT alcadas_aprovacao_responsavel_check CHECK (usuario_id IS NOT NULL OR perfil_id IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alcadas_aprovacao_valor_check') THEN
    ALTER TABLE alcadas_aprovacao
      ADD CONSTRAINT alcadas_aprovacao_valor_check CHECK (valor_minimo >= 0 AND (valor_maximo IS NULL OR valor_maximo >= valor_minimo));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_escopos_acesso_company_status ON escopos_acesso(company_id, status);
CREATE INDEX IF NOT EXISTS idx_perfis_escopos_perfil_status ON perfis_escopos(perfil_id, status);
CREATE INDEX IF NOT EXISTS idx_perfis_escopos_escopo_status ON perfis_escopos(escopo_id, status);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfis_usuario_status ON usuarios_perfis(usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfis_perfil_status ON usuarios_perfis(perfil_id, status);
CREATE INDEX IF NOT EXISTS idx_alcadas_company_modulo_acao ON alcadas_aprovacao(company_id, modulo, tipo_documento, acao, status);
CREATE INDEX IF NOT EXISTS idx_alcadas_usuario_status ON alcadas_aprovacao(usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_alcadas_perfil_status ON alcadas_aprovacao(perfil_id, status);
CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_entidade ON auditoria_eventos(entidade, entidade_id, created_at DESC);

WITH empresa_seed AS (
  INSERT INTO empresas (razao_social, nome_fantasia, cnpj, regime_tributario, status)
  VALUES ('ENAC DEV - DEV_LOCAL_V3_5B', 'ENAC DEV DEV_LOCAL_V3_5B', '00.000.000/0001-33', 'DEV DEV_LOCAL_V3_5B', 'ativo')
  ON CONFLICT (cnpj)
  DO UPDATE SET nome_fantasia = excluded.nome_fantasia, updated_at = now()
  RETURNING id
),
empresa AS (
  SELECT id FROM empresa_seed
  UNION ALL
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33'
  LIMIT 1
),
perfil_seed(nome, descricao) AS (
  VALUES
    ('ADMIN', 'Administracao local DEV_LOCAL_V3_5B'),
    ('DIRETORIA', 'Diretoria local DEV_LOCAL_V3_5B'),
    ('PLANEJAMENTO', 'Planejamento local DEV_LOCAL_V3_5B'),
    ('COMPRAS', 'Compras local DEV_LOCAL_V3_5B'),
    ('FINANCEIRO', 'Financeiro local DEV_LOCAL_V3_5B'),
    ('CAMPO', 'Campo local DEV_LOCAL_V3_5B')
)
INSERT INTO perfis (company_id, nome, descricao, permissoes, escopo_padrao, status)
SELECT empresa.id, perfil_seed.nome, perfil_seed.descricao, '[]'::jsonb, 'empresa', 'ativo'
FROM empresa
CROSS JOIN perfil_seed
ON CONFLICT (company_id, nome)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
usuario_seed(nome, email, cargo) AS (
  VALUES
    ('Leon DEV V3.5B', 'leon.dev.v35b@enac.local', 'DIRETORIA ADMIN DEV_LOCAL_V3_5B'),
    ('Gustavo DEV V3.5B', 'gustavo.dev.v35b@enac.local', 'PLANEJAMENTO DEV_LOCAL_V3_5B'),
    ('Matheus DEV V3.5B', 'matheus.dev.v35b@enac.local', 'COMPRAS FINANCEIRO DEV_LOCAL_V3_5B'),
    ('Kemilly DEV V3.5B', 'kemilly.dev.v35b@enac.local', 'PLANEJAMENTO CAMPO DEV_LOCAL_V3_5B'),
    ('Davison DEV V3.5B', 'davison.dev.v35b@enac.local', 'CAMPO PLANEJAMENTO DEV_LOCAL_V3_5B')
)
INSERT INTO usuarios (company_id, nome, email, cargo_funcao, ativo, status)
SELECT empresa.id, usuario_seed.nome, usuario_seed.email, usuario_seed.cargo, true, 'ativo'
FROM empresa
CROSS JOIN usuario_seed
ON CONFLICT (email)
DO UPDATE SET nome = excluded.nome, cargo_funcao = excluded.cargo_funcao, ativo = true, status = 'ativo', updated_at = now();

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('cadastros', 'visualizar', 'Visualizar cadastros'),
    ('cadastros', 'criar', 'Criar cadastros'),
    ('cadastros', 'editar', 'Editar cadastros'),
    ('cadastros', 'inativar', 'Inativar cadastros'),
    ('cadastros', 'reativar', 'Reativar cadastros'),
    ('solicitacoes-compra', 'visualizar', 'Visualizar solicitacoes'),
    ('solicitacoes-compra', 'criar', 'Criar solicitacoes'),
    ('solicitacoes-compra', 'editar', 'Editar solicitacoes'),
    ('solicitacoes-compra', 'enviar', 'Enviar solicitacoes'),
    ('solicitacoes-compra', 'aprovar_tecnico', 'Aprovar tecnicamente solicitacoes'),
    ('solicitacoes-compra', 'aprovar_diretoria', 'Aprovar solicitacoes pela diretoria'),
    ('solicitacoes-compra', 'cancelar', 'Cancelar solicitacoes'),
    ('cotacoes', 'visualizar', 'Visualizar cotacoes'),
    ('cotacoes', 'criar', 'Criar cotacoes'),
    ('cotacoes', 'editar', 'Editar cotacoes'),
    ('cotacoes', 'enviar', 'Enviar cotacoes'),
    ('cotacoes', 'cancelar', 'Cancelar cotacoes'),
    ('pedidos-compra', 'visualizar', 'Visualizar pedidos'),
    ('pedidos-compra', 'criar', 'Criar pedidos'),
    ('pedidos-compra', 'editar', 'Editar pedidos'),
    ('pedidos-compra', 'enviar', 'Enviar pedidos'),
    ('pedidos-compra', 'aprovar_diretoria', 'Aprovar pedidos pela diretoria'),
    ('pedidos-compra', 'cancelar', 'Cancelar pedidos'),
    ('notas-fiscais-entrada', 'visualizar', 'Visualizar notas fiscais de entrada'),
    ('notas-fiscais-entrada', 'criar', 'Criar notas fiscais de entrada'),
    ('notas-fiscais-entrada', 'editar', 'Editar notas fiscais de entrada'),
    ('notas-fiscais-entrada', 'conferir', 'Conferir notas fiscais de entrada'),
    ('notas-fiscais-entrada', 'cancelar', 'Cancelar notas fiscais de entrada'),
    ('contas-pagar', 'visualizar', 'Visualizar contas a pagar'),
    ('contas-pagar', 'editar', 'Editar contas a pagar provisionadas'),
    ('contas-pagar', 'conferir', 'Conferir contas a pagar'),
    ('contas-pagar', 'cancelar', 'Cancelar contas a pagar provisionadas'),
    ('usuarios', 'visualizar', 'Visualizar usuarios'),
    ('usuarios', 'criar', 'Criar usuarios'),
    ('usuarios', 'editar', 'Editar usuarios'),
    ('usuarios', 'inativar', 'Inativar usuarios'),
    ('usuarios', 'reativar', 'Reativar usuarios'),
    ('perfis', 'visualizar', 'Visualizar perfis'),
    ('perfis', 'criar', 'Criar perfis'),
    ('perfis', 'editar', 'Editar perfis'),
    ('perfis', 'inativar', 'Inativar perfis'),
    ('perfis', 'reativar', 'Reativar perfis'),
    ('perfis', 'administrar', 'Administrar perfis'),
    ('alcadas', 'visualizar', 'Visualizar alcadas'),
    ('alcadas', 'criar', 'Criar alcadas'),
    ('alcadas', 'editar', 'Editar alcadas'),
    ('alcadas', 'inativar', 'Inativar alcadas'),
    ('alcadas', 'reativar', 'Reativar alcadas'),
    ('alcadas', 'administrar', 'Administrar alcadas'),
    ('auditoria', 'visualizar', 'Visualizar auditoria')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH pares(email, perfil_nome, principal) AS (
  VALUES
    ('leon.dev.v35b@enac.local', 'DIRETORIA', true),
    ('leon.dev.v35b@enac.local', 'ADMIN', false),
    ('gustavo.dev.v35b@enac.local', 'PLANEJAMENTO', true),
    ('matheus.dev.v35b@enac.local', 'COMPRAS', true),
    ('matheus.dev.v35b@enac.local', 'FINANCEIRO', false),
    ('kemilly.dev.v35b@enac.local', 'PLANEJAMENTO', true),
    ('kemilly.dev.v35b@enac.local', 'CAMPO', false),
    ('davison.dev.v35b@enac.local', 'CAMPO', true),
    ('davison.dev.v35b@enac.local', 'PLANEJAMENTO', false)
)
INSERT INTO usuarios_perfis (usuario_id, perfil_id, principal, status)
SELECT u.id, p.id, pares.principal, 'ativo'
FROM pares
JOIN usuarios u ON u.email = pares.email
JOIN perfis p ON p.company_id = u.company_id AND p.nome = pares.perfil_nome
ON CONFLICT (usuario_id, perfil_id)
DO UPDATE SET principal = excluded.principal, status = 'ativo', updated_at = now();

UPDATE usuarios u
SET
  perfil_principal_id = principal.perfil_id,
  perfil_ids = ativos.perfil_ids,
  updated_at = now()
FROM (
  SELECT usuario_id, perfil_id
  FROM usuarios_perfis
  WHERE principal = true AND status = 'ativo'
) principal
JOIN (
  SELECT usuario_id, array_agg(perfil_id ORDER BY perfil_id)::uuid[] AS perfil_ids
  FROM usuarios_perfis
  WHERE status = 'ativo'
  GROUP BY usuario_id
) ativos ON ativos.usuario_id = principal.usuario_id
WHERE u.id = principal.usuario_id;

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('ADMIN', '*', 'administrar'),
    ('DIRETORIA', 'solicitacoes-compra', 'visualizar'),
    ('DIRETORIA', 'solicitacoes-compra', 'aprovar_diretoria'),
    ('DIRETORIA', 'pedidos-compra', 'visualizar'),
    ('DIRETORIA', 'pedidos-compra', 'aprovar_diretoria'),
    ('DIRETORIA', 'contas-pagar', 'visualizar'),
    ('PLANEJAMENTO', 'solicitacoes-compra', 'visualizar'),
    ('PLANEJAMENTO', 'solicitacoes-compra', 'aprovar_tecnico'),
    ('PLANEJAMENTO', 'pedidos-compra', 'visualizar'),
    ('CAMPO', 'solicitacoes-compra', 'visualizar'),
    ('CAMPO', 'solicitacoes-compra', 'criar'),
    ('CAMPO', 'solicitacoes-compra', 'enviar'),
    ('COMPRAS', 'cotacoes', 'visualizar'),
    ('COMPRAS', 'cotacoes', 'criar'),
    ('COMPRAS', 'cotacoes', 'editar'),
    ('COMPRAS', 'cotacoes', 'enviar'),
    ('COMPRAS', 'pedidos-compra', 'visualizar'),
    ('COMPRAS', 'pedidos-compra', 'criar'),
    ('COMPRAS', 'pedidos-compra', 'editar'),
    ('COMPRAS', 'pedidos-compra', 'enviar'),
    ('FINANCEIRO', 'notas-fiscais-entrada', 'visualizar'),
    ('FINANCEIRO', 'notas-fiscais-entrada', 'conferir'),
    ('FINANCEIRO', 'contas-pagar', 'visualizar'),
    ('FINANCEIRO', 'contas-pagar', 'conferir'),
    ('FINANCEIRO', 'contas-pagar', 'editar')
),
empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
admin_scopes AS (
  SELECT 'ADMIN'::text AS perfil_nome, e.modulo, e.acao
  FROM escopos_acesso e
  JOIN empresa ON empresa.id = e.company_id
),
all_pairs AS (
  SELECT * FROM admin_scopes
  UNION
  SELECT perfil_nome, modulo, acao
  FROM perfil_escopo_seed
  WHERE modulo <> '*'
)
INSERT INTO perfis_escopos (perfil_id, escopo_id, status)
SELECT p.id, e.id, 'ativo'
FROM all_pairs
JOIN empresa ON true
JOIN perfis p ON p.company_id = empresa.id AND p.nome = all_pairs.perfil_nome
JOIN escopos_acesso e ON e.company_id = empresa.id AND e.modulo = all_pairs.modulo AND e.acao = all_pairs.acao
ON CONFLICT (perfil_id, escopo_id)
DO UPDATE SET status = 'ativo', updated_at = now();

WITH regras(perfil_nome, modulo, tipo_documento, acao, valor_minimo, valor_maximo, observacoes) AS (
  VALUES
    ('CAMPO', 'solicitacoes-compra', 'SOLICITACAO_COMPRA', 'criar', 0::numeric, NULL::numeric, 'CAMPO cria solicitacao, sem aprovacao de compra.'),
    ('COMPRAS', 'cotacoes', 'COTACAO', 'criar', 0::numeric, NULL::numeric, 'COMPRAS conduz cotacao.'),
    ('COMPRAS', 'pedidos-compra', 'PEDIDO_COMPRA', 'criar', 0::numeric, NULL::numeric, 'COMPRAS conduz pedido, sem aprovacao de pagamento.'),
    ('PLANEJAMENTO', 'solicitacoes-compra', 'SOLICITACAO_COMPRA', 'aprovar_tecnico', 0::numeric, 20000::numeric, 'PLANEJAMENTO aprova tecnicamente ate 20000.'),
    ('DIRETORIA', 'solicitacoes-compra', 'SOLICITACAO_COMPRA', 'aprovar_diretoria', 20000.01::numeric, NULL::numeric, 'DIRETORIA aprova acima de 20000.'),
    ('DIRETORIA', 'pedidos-compra', 'PEDIDO_COMPRA', 'aprovar_diretoria', 20000.01::numeric, NULL::numeric, 'DIRETORIA aprova compra acima de 20000.'),
    ('FINANCEIRO', 'notas-fiscais-entrada', 'NOTA_FISCAL_ENTRADA', 'conferir', 0::numeric, NULL::numeric, 'FINANCEIRO confere nota fiscal de entrada.'),
    ('FINANCEIRO', 'contas-pagar', 'CONTA_PAGAR', 'conferir', 0::numeric, NULL::numeric, 'FINANCEIRO confere conta a pagar sem liberar pagamento.')
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
SELECT id, 'v3.5b', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_5B', 'escopo', 'perfis_escopos_alcadas')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.5b' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_5B'
  );

COMMIT;
