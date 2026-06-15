-- V3.5A - Alinhamento Nota Fiscal de Entrada e Conta a Pagar Inicial ERP ENAC
-- Uso previsto: PostgreSQL local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Esta migration complementa a 008_notas_entrada_contas_pagar_mvp.sql ja versionada,
-- preservando historico e ajustando o contrato da V3.5A solicitado.

BEGIN;

ALTER TABLE notas_fiscais_entrada_itens
  ADD COLUMN IF NOT EXISTS nota_fiscal_id uuid;

UPDATE notas_fiscais_entrada_itens
SET nota_fiscal_id = COALESCE(nota_fiscal_id, nota_id)
WHERE nota_fiscal_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_entrada_itens_nota_fiscal_fk') THEN
    ALTER TABLE notas_fiscais_entrada_itens
      ADD CONSTRAINT notas_fiscais_entrada_itens_nota_fiscal_fk
      FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais_entrada(id);
  END IF;
END $$;

ALTER TABLE notas_fiscais_entrada_itens
  ALTER COLUMN nota_fiscal_id SET NOT NULL;

ALTER TABLE notas_fiscais_entrada
  DROP CONSTRAINT IF EXISTS notas_fiscais_entrada_status_check,
  DROP CONSTRAINT IF EXISTS notas_fiscais_entrada_valores_check;

ALTER TABLE contas_pagar
  DROP CONSTRAINT IF EXISTS contas_pagar_status_check;

UPDATE notas_fiscais_entrada
SET status = CASE status
  WHEN 'LANCADA' THEN 'CONFERIDA'
  WHEN 'APROVADA_FINANCEIRO' THEN
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM contas_pagar cp
        WHERE cp.nota_entrada_id = notas_fiscais_entrada.id
          AND cp.status <> 'CANCELADA'
      ) THEN 'PROVISIONADA'
      ELSE 'APROVADA'
    END
  ELSE status
END;

UPDATE contas_pagar
SET status = CASE status
  WHEN 'ABERTA' THEN 'PROVISIONADA'
  WHEN 'BAIXADA' THEN 'PAGA'
  ELSE status
END;

ALTER TABLE notas_fiscais_entrada
  ALTER COLUMN status SET DEFAULT 'RASCUNHO';

ALTER TABLE contas_pagar
  ALTER COLUMN status SET DEFAULT 'PROVISIONADA';

ALTER TABLE notas_fiscais_entrada
  ADD CONSTRAINT notas_fiscais_entrada_status_check
  CHECK (status IN ('RASCUNHO', 'CONFERIDA', 'DIVERGENTE', 'APROVADA', 'PROVISIONADA', 'CANCELADA'));

ALTER TABLE notas_fiscais_entrada
  ADD CONSTRAINT notas_fiscais_entrada_valores_check
  CHECK (
    valor_produtos >= 0
    AND valor_servicos >= 0
    AND valor_frete >= 0
    AND valor_desconto >= 0
    AND valor_impostos >= 0
    AND valor_total >= 0
  );

ALTER TABLE contas_pagar
  ADD CONSTRAINT contas_pagar_status_check
  CHECK (status IN ('PROVISIONADA', 'APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'PAGA', 'CANCELADA'));

CREATE INDEX IF NOT EXISTS idx_notas_entrada_itens_nota_fiscal
  ON notas_fiscais_entrada_itens(nota_fiscal_id, ordem);

COMMIT;
