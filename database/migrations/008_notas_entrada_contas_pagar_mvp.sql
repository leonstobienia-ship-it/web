-- V3.5A - Nota Fiscal de Entrada e Contas a Pagar Inicial ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.
-- Nao implementa programacao bancaria, pagamento, baixa, conciliacao, integracao fiscal real, SharePoint, Entra, automacoes ou DELETE fisico.

BEGIN;

CREATE TABLE IF NOT EXISTS notas_fiscais_entrada (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  pedido_id uuid NOT NULL REFERENCES pedidos_compra(id),
  fornecedor_id uuid NOT NULL REFERENCES fornecedores(id),
  obra_id uuid REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  numero text NOT NULL,
  serie text,
  chave_acesso text,
  tipo_documento text NOT NULL DEFAULT 'NOTA_FISCAL',
  data_emissao date NOT NULL,
  data_entrada date NOT NULL,
  valor_produtos numeric(14,2) NOT NULL DEFAULT 0,
  valor_servicos numeric(14,2) NOT NULL DEFAULT 0,
  valor_frete numeric(14,2) NOT NULL DEFAULT 0,
  valor_desconto numeric(14,2) NOT NULL DEFAULT 0,
  valor_impostos numeric(14,2) NOT NULL DEFAULT 0,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'RASCUNHO',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS notas_fiscais_entrada_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id uuid NOT NULL REFERENCES notas_fiscais_entrada(id),
  pedido_item_id uuid REFERENCES pedidos_compra_itens(id),
  descricao text NOT NULL,
  unidade text NOT NULL,
  quantidade numeric(14,4) NOT NULL,
  valor_unitario numeric(14,2) NOT NULL DEFAULT 0,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  observacoes text,
  ordem integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contas_pagar
  ADD COLUMN IF NOT EXISTS nota_entrada_id uuid REFERENCES notas_fiscais_entrada(id),
  ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES pedidos_compra(id),
  ADD COLUMN IF NOT EXISTS numero_documento text,
  ADD COLUMN IF NOT EXISTS parcela integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_parcelas integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS data_emissao date,
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS valor_aberto numeric(14,2),
  ADD COLUMN IF NOT EXISTS forma_pagamento_prevista text,
  ADD COLUMN IF NOT EXISTS observacoes text;

UPDATE contas_pagar
SET
  data_vencimento = COALESCE(data_vencimento, vencimento),
  valor_aberto = COALESCE(valor_aberto, saldo, valor_original, 0),
  numero_documento = COALESCE(numero_documento, 'CP-MIGRADA-' || upper(substr(id::text, 1, 8))),
  forma_pagamento_prevista = COALESCE(forma_pagamento_prevista, forma_pagamento),
  status = CASE lower(status)
    WHEN 'aberta' THEN 'ABERTA'
    WHEN 'aguardando_programacao' THEN 'AGUARDANDO_PROGRAMACAO'
    WHEN 'aguardando programacao' THEN 'AGUARDANDO_PROGRAMACAO'
    WHEN 'programada' THEN 'PROGRAMADA'
    WHEN 'cancelada' THEN 'CANCELADA'
    WHEN 'baixada' THEN 'BAIXADA'
    WHEN 'paga' THEN 'BAIXADA'
    WHEN 'pendente' THEN 'ABERTA'
    ELSE 'ABERTA'
  END;

ALTER TABLE contas_pagar
  ALTER COLUMN status SET DEFAULT 'ABERTA',
  ALTER COLUMN data_vencimento SET NOT NULL,
  ALTER COLUMN valor_aberto SET NOT NULL,
  ALTER COLUMN numero_documento SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_entrada_status_check') THEN
    ALTER TABLE notas_fiscais_entrada
      ADD CONSTRAINT notas_fiscais_entrada_status_check
      CHECK (status IN ('RASCUNHO', 'LANCADA', 'CONFERIDA', 'APROVADA_FINANCEIRO', 'CANCELADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_entrada_valores_check') THEN
    ALTER TABLE notas_fiscais_entrada
      ADD CONSTRAINT notas_fiscais_entrada_valores_check
      CHECK (
        valor_produtos >= 0
        AND valor_servicos >= 0
        AND valor_frete >= 0
        AND valor_desconto >= 0
        AND valor_impostos >= 0
        AND valor_total > 0
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_entrada_itens_quantidade_check') THEN
    ALTER TABLE notas_fiscais_entrada_itens
      ADD CONSTRAINT notas_fiscais_entrada_itens_quantidade_check
      CHECK (quantidade > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_entrada_itens_valor_unitario_check') THEN
    ALTER TABLE notas_fiscais_entrada_itens
      ADD CONSTRAINT notas_fiscais_entrada_itens_valor_unitario_check
      CHECK (valor_unitario >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_entrada_itens_valor_total_check') THEN
    ALTER TABLE notas_fiscais_entrada_itens
      ADD CONSTRAINT notas_fiscais_entrada_itens_valor_total_check
      CHECK (valor_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_pagar_status_check') THEN
    ALTER TABLE contas_pagar
      ADD CONSTRAINT contas_pagar_status_check
      CHECK (status IN ('ABERTA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'CANCELADA', 'BAIXADA'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_pagar_parcelas_check') THEN
    ALTER TABLE contas_pagar
      ADD CONSTRAINT contas_pagar_parcelas_check
      CHECK (parcela >= 1 AND total_parcelas >= 1 AND parcela <= total_parcelas);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_pagar_valores_v35a_check') THEN
    ALTER TABLE contas_pagar
      ADD CONSTRAINT contas_pagar_valores_v35a_check
      CHECK (valor_original > 0 AND valor_aberto >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notas_entrada_company_status
  ON notas_fiscais_entrada(company_id, status);

CREATE INDEX IF NOT EXISTS idx_notas_entrada_company_fornecedor
  ON notas_fiscais_entrada(company_id, fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_notas_entrada_pedido
  ON notas_fiscais_entrada(pedido_id);

CREATE INDEX IF NOT EXISTS idx_notas_entrada_obra
  ON notas_fiscais_entrada(obra_id);

CREATE INDEX IF NOT EXISTS idx_notas_entrada_centro_custo
  ON notas_fiscais_entrada(centro_custo_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notas_entrada_fornecedor_numero_serie
  ON notas_fiscais_entrada(company_id, fornecedor_id, numero, COALESCE(serie, ''))
  WHERE numero IS NOT NULL AND status <> 'CANCELADA';

CREATE INDEX IF NOT EXISTS idx_notas_entrada_itens_nota
  ON notas_fiscais_entrada_itens(nota_id, ordem);

CREATE INDEX IF NOT EXISTS idx_notas_entrada_itens_pedido_item
  ON notas_fiscais_entrada_itens(pedido_item_id);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_company_status_v35a
  ON contas_pagar(company_id, status);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_company_vencimento_v35a
  ON contas_pagar(company_id, data_vencimento, status);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_nota_entrada_v35a
  ON contas_pagar(nota_entrada_id);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_pedido_v35a
  ON contas_pagar(pedido_id);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor_v35a
  ON contas_pagar(fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_obra_v35a
  ON contas_pagar(obra_id);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_centro_custo_v35a
  ON contas_pagar(centro_custo_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_nota_parcela_ativa
  ON contas_pagar(nota_entrada_id, parcela)
  WHERE nota_entrada_id IS NOT NULL AND status <> 'CANCELADA';

COMMIT;
