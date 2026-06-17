-- V3.14 - Anexos e Documentos preparados para SharePoint ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Registra apenas metadados e referencias mock; nao faz upload real, Graph,
-- SharePoint real, Entra real, Power Automate, pagamento, baixa, CNAB,
-- NFS-e real, prefeitura, boleto ou DELETE fisico.

BEGIN;

CREATE TABLE IF NOT EXISTS documentos_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  entidade_tipo text NOT NULL,
  entidade_id uuid NOT NULL,
  obra_id uuid REFERENCES obras(id),
  contrato_id uuid REFERENCES contratos_obra(id),
  tipo_documento text NOT NULL,
  nome_arquivo text NOT NULL,
  extensao text NOT NULL,
  mime_type text,
  tamanho_bytes bigint NOT NULL DEFAULT 0,
  descricao text,
  observacao text,
  origem text NOT NULL DEFAULT 'ERP_LOCAL',
  status text NOT NULL DEFAULT 'ATIVO',
  referencia_local_mock text,
  sharepoint_site_id_mock text,
  sharepoint_drive_id_mock text,
  sharepoint_item_id_mock text,
  url_mock text,
  substitui_documento_id uuid REFERENCES documentos_anexos(id),
  substituido_por_documento_id uuid REFERENCES documentos_anexos(id),
  criado_por uuid REFERENCES usuarios(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid REFERENCES usuarios(id),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  inativado_por uuid REFERENCES usuarios(id),
  inativado_em timestamptz,
  motivo_inativacao text
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documentos_anexos_entidade_tipo_v314_check') THEN
    ALTER TABLE documentos_anexos
      ADD CONSTRAINT documentos_anexos_entidade_tipo_v314_check
      CHECK (entidade_tipo IN (
        'cliente',
        'fornecedor',
        'obra',
        'contrato_obra',
        'aditivo',
        'orcamento',
        'solicitacao_compra',
        'cotacao',
        'pedido_compra',
        'nota_fiscal_entrada',
        'conta_pagar',
        'programacao_pagamento',
        'baixa_manual',
        'medicao',
        'pedido_faturamento',
        'risco_pendencia',
        'tarefa',
        'auditoria'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documentos_anexos_tipo_documento_v314_check') THEN
    ALTER TABLE documentos_anexos
      ADD CONSTRAINT documentos_anexos_tipo_documento_v314_check
      CHECK (tipo_documento IN (
        'CONTRATO',
        'ADITIVO',
        'NF',
        'BOLETO_REFERENCIA',
        'COMPROVANTE_REFERENCIA',
        'MEDICAO',
        'FATURAMENTO',
        'ORCAMENTO',
        'PROPOSTA',
        'COTACAO',
        'PEDIDO',
        'FOTO_OBRA',
        'RELATORIO',
        'OUTROS'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documentos_anexos_status_v314_check') THEN
    ALTER TABLE documentos_anexos
      ADD CONSTRAINT documentos_anexos_status_v314_check
      CHECK (status IN ('ATIVO', 'INATIVO', 'SUBSTITUIDO', 'PENDENTE_ENVIO_FUTURO', 'ERRO_REFERENCIA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documentos_anexos_tamanho_v314_check') THEN
    ALTER TABLE documentos_anexos
      ADD CONSTRAINT documentos_anexos_tamanho_v314_check
      CHECK (tamanho_bytes >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documentos_anexos_company_status_v314
  ON documentos_anexos(company_id, status, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_documentos_anexos_entidade_v314
  ON documentos_anexos(entidade_tipo, entidade_id, status, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_documentos_anexos_obra_v314
  ON documentos_anexos(obra_id, status, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_documentos_anexos_contrato_v314
  ON documentos_anexos(contrato_id, status, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_documentos_anexos_tipo_v314
  ON documentos_anexos(company_id, tipo_documento, status);

WITH empresa AS (
  SELECT id FROM empresas WHERE cnpj = '00.000.000/0001-33' LIMIT 1
),
escopo_seed(modulo, acao, descricao) AS (
  VALUES
    ('documentos', 'visualizar', 'Visualizar documentos e anexos por metadados locais'),
    ('documentos', 'criar', 'Criar referencia documental local sem upload real'),
    ('documentos', 'editar', 'Editar metadados de referencia documental'),
    ('documentos', 'inativar', 'Inativar logicamente referencia documental sem DELETE fisico'),
    ('documentos', 'substituir', 'Substituir referencia documental preservando historico')
)
INSERT INTO escopos_acesso (company_id, modulo, acao, descricao, status)
SELECT empresa.id, escopo_seed.modulo, escopo_seed.acao, escopo_seed.descricao, 'ativo'
FROM empresa
CROSS JOIN escopo_seed
ON CONFLICT (company_id, modulo, acao)
DO UPDATE SET descricao = excluded.descricao, status = 'ativo', updated_at = now();

WITH perfil_escopo_seed(perfil_nome, modulo, acao) AS (
  VALUES
    ('ADMIN', 'documentos', 'visualizar'),
    ('ADMIN', 'documentos', 'criar'),
    ('ADMIN', 'documentos', 'editar'),
    ('ADMIN', 'documentos', 'inativar'),
    ('ADMIN', 'documentos', 'substituir'),
    ('DIRETORIA', 'documentos', 'visualizar'),
    ('DIRETORIA', 'documentos', 'criar'),
    ('DIRETORIA', 'documentos', 'editar'),
    ('DIRETORIA', 'documentos', 'inativar'),
    ('DIRETORIA', 'documentos', 'substituir'),
    ('PLANEJAMENTO', 'documentos', 'visualizar'),
    ('PLANEJAMENTO', 'documentos', 'criar'),
    ('PLANEJAMENTO', 'documentos', 'editar'),
    ('PLANEJAMENTO', 'documentos', 'inativar'),
    ('PLANEJAMENTO', 'documentos', 'substituir'),
    ('COMPRAS', 'documentos', 'visualizar'),
    ('COMPRAS', 'documentos', 'criar'),
    ('COMPRAS', 'documentos', 'editar'),
    ('FINANCEIRO', 'documentos', 'visualizar'),
    ('FINANCEIRO', 'documentos', 'criar'),
    ('FINANCEIRO', 'documentos', 'editar'),
    ('FINANCEIRO', 'documentos', 'inativar'),
    ('CAMPO', 'documentos', 'visualizar'),
    ('CAMPO', 'documentos', 'criar')
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
SELECT id, 'v3.14', 'seed_local', jsonb_build_object(
  'marker', 'DEV_LOCAL_V3_14',
  'escopo', 'anexos_documentos_sharepoint_ready',
  'sharepoint_real', false,
  'upload_real', false
)
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1 FROM auditoria_eventos
    WHERE entidade = 'v3.14' AND acao = 'seed_local' AND payload->>'marker' = 'DEV_LOCAL_V3_14'
  );

COMMIT;
