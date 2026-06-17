-- V3.13 - Auditoria Geral, Logs e Rastreabilidade
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao implementa pagamento, baixa nova, CNAB, banco real, NFS-e real,
-- prefeitura, boleto, SharePoint real, Entra real, Power Automate ou DELETE fisico.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_created_at
  ON auditoria_eventos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_company_created_at
  ON auditoria_eventos(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_acao_created_at
  ON auditoria_eventos(acao, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_created_by_created_at
  ON auditoria_eventos(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_payload_gin
  ON auditoria_eventos USING gin (payload);

INSERT INTO auditoria_eventos (company_id, entidade, acao, payload)
SELECT id, 'v3.13', 'seed_local', jsonb_build_object(
  'marker', 'DEV_LOCAL_V3_13',
  'escopo', 'auditoria_logs_rastreabilidade',
  'readonly', true
)
FROM empresas
WHERE cnpj = '00.000.000/0001-33'
  AND NOT EXISTS (
    SELECT 1
    FROM auditoria_eventos
    WHERE entidade = 'v3.13'
      AND acao = 'seed_local'
      AND payload->>'marker' = 'DEV_LOCAL_V3_13'
  );

COMMIT;
