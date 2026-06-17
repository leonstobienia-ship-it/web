-- V3.5G - Baixa Manual Controlada sem Banco ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Baixa manual e registro administrativo interno; nao executa pagamento eletronico, integracao bancaria, CNAB, SharePoint, Entra, Power Automate ou DELETE fisico.

BEGIN;

ALTER TABLE contas_pagar
  DROP CONSTRAINT IF EXISTS contas_pagar_status_check;

ALTER TABLE contas_pagar
  ADD CONSTRAINT contas_pagar_status_check
  CHECK (status IN ('PROVISIONADA', 'APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'BAIXADA_MANUAL', 'PAGA', 'CANCELADA'));

ALTER TABLE contas_pagar
  ADD COLUMN IF NOT EXISTS baixa_status text NOT NULL DEFAULT 'BAIXA_PENDENTE',
  ADD COLUMN IF NOT EXISTS baixado_manual_por uuid REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS baixado_manual_em timestamptz,
  ADD COLUMN IF NOT EXISTS baixa_manual_data date,
  ADD COLUMN IF NOT EXISTS baixa_manual_valor numeric(14,2),
  ADD COLUMN IF NOT EXISTS baixa_manual_forma_pagamento text,
  ADD COLUMN IF NOT EXISTS baixa_manual_observacoes text,
  ADD COLUMN IF NOT EXISTS baixa_manual_referencia_anexo text,
  ADD COLUMN IF NOT EXISTS baixa_status_anterior text,
  ADD COLUMN IF NOT EXISTS baixa_status_novo text,
  ADD COLUMN IF NOT EXISTS bloqueio_baixa_motivo text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_pagar_baixa_status_check') THEN
    ALTER TABLE contas_pagar
      ADD CONSTRAINT contas_pagar_baixa_status_check
      CHECK (baixa_status IN ('BAIXA_PENDENTE', 'BAIXADA_MANUAL', 'BAIXA_ESTORNADA', 'BLOQUEADA_BAIXA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_pagar_baixa_valor_check') THEN
    ALTER TABLE contas_pagar
      ADD CONSTRAINT contas_pagar_baixa_valor_check
      CHECK (baixa_manual_valor IS NULL OR baixa_manual_valor >= 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS contas_pagar_baixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_pagar_id uuid NOT NULL REFERENCES contas_pagar(id),
  company_id uuid NOT NULL REFERENCES empresas(id),
  programacao_id uuid REFERENCES programacoes_pagamento(id),
  acao text NOT NULL,
  status_anterior text NOT NULL,
  status_novo text NOT NULL,
  baixa_status text NOT NULL,
  usuario_id uuid REFERENCES usuarios(id),
  valor_baixado numeric(14,2) NOT NULL DEFAULT 0,
  data_baixa date,
  forma_pagamento_manual text,
  observacoes text,
  referencia_anexo text,
  resultado text NOT NULL,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_pagar_baixas_status_check') THEN
    ALTER TABLE contas_pagar_baixas
      ADD CONSTRAINT contas_pagar_baixas_status_check
      CHECK (baixa_status IN ('BAIXADA_MANUAL', 'BAIXA_ESTORNADA', 'BLOQUEADA_BAIXA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_pagar_baixas_resultado_check') THEN
    ALTER TABLE contas_pagar_baixas
      ADD CONSTRAINT contas_pagar_baixas_resultado_check
      CHECK (resultado IN ('PERMITIDO', 'NEGADO'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_pagar_baixas_acao_check') THEN
    ALTER TABLE contas_pagar_baixas
      ADD CONSTRAINT contas_pagar_baixas_acao_check
      CHECK (acao IN ('BAIXAR_MANUAL', 'ESTORNAR_BAIXA'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contas_pagar_baixa_status_v35g
  ON contas_pagar(company_id, baixa_status, baixado_manual_em);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_baixas_conta_v35g
  ON contas_pagar_baixas(conta_pagar_id, created_at DESC);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('contas-pagar', 'baixar_manual', 'Registrar baixa manual controlada sem banco, CNAB ou pagamento eletronico'),
    ('contas-pagar', 'estornar_baixa', 'Estornar logicamente baixa manual sem apagar historico')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('FINANCEIRO', 'contas-pagar', 'baixar_manual'),
    ('FINANCEIRO', 'contas-pagar', 'estornar_baixa'),
    ('DIRETORIA', 'contas-pagar', 'baixar_manual'),
    ('DIRETORIA', 'contas-pagar', 'estornar_baixa')
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
    ('FINANCEIRO', 'contas-pagar', 'CONTA_PAGAR', 'baixar_manual', 0::numeric, 20000::numeric, 'FINANCEIRO registra baixa manual local ate 20000 sem banco.'),
    ('DIRETORIA', 'contas-pagar', 'CONTA_PAGAR', 'baixar_manual', 20000.01::numeric, NULL::numeric, 'DIRETORIA registra baixa manual local acima de 20000 sem banco.'),
    ('FINANCEIRO', 'contas-pagar', 'CONTA_PAGAR', 'estornar_baixa', 0::numeric, 20000::numeric, 'FINANCEIRO estorna baixa manual local ate 20000 sem apagar historico.'),
    ('DIRETORIA', 'contas-pagar', 'CONTA_PAGAR', 'estornar_baixa', 20000.01::numeric, NULL::numeric, 'DIRETORIA estorna baixa manual local acima de 20000 sem apagar historico.')
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
SELECT id, 'v3.5g', 'seed_local', jsonb_build_object('marker', 'DEV_LOCAL_V3_5G', 'escopo', 'baixa_manual_controlada_sem_banco')
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.5g' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_5G'
  );

COMMIT;
