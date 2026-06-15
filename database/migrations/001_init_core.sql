-- V3.2 - Fundacao Operacional ERP ENAC
-- Uso previsto: ambiente local/controlado de desenvolvimento.
-- Nao executar em producao nesta etapa.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj varchar(18) NOT NULL UNIQUE,
  regime_tributario text,
  inscricao_municipal text,
  inscricao_estadual text,
  matriz_id uuid REFERENCES empresas(id),
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES empresas(id),
  nome text NOT NULL,
  descricao text,
  permissoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  escopo_padrao text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE (company_id, nome)
);

CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES empresas(id),
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  entra_object_id text UNIQUE,
  perfil_principal_id uuid REFERENCES perfis(id),
  perfil_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  cargo_funcao text,
  ativo boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  nome text NOT NULL,
  cpf_cnpj varchar(18),
  email text,
  telefone text,
  responsavel text,
  observacoes text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  nome text NOT NULL,
  cpf_cnpj varchar(18),
  email text,
  telefone text,
  contato text,
  pix text,
  dados_bancarios text,
  observacoes text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  codigo text NOT NULL,
  nome text NOT NULL,
  site_id uuid,
  conta_analitica text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE (company_id, codigo)
);

CREATE TABLE obras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  cliente_id uuid REFERENCES clientes(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  site_id uuid,
  codigo text NOT NULL,
  nome text NOT NULL,
  endereco text,
  gestor_id uuid REFERENCES usuarios(id),
  data_inicio_prevista date,
  data_fim_prevista date,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE (company_id, codigo)
);

CREATE TABLE contratos_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  cliente_id uuid NOT NULL REFERENCES clientes(id),
  obra_id uuid REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  numero text NOT NULL,
  objeto text NOT NULL,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  data_inicio date NOT NULL,
  data_fim date,
  indice_reajuste text,
  percentual_retencao numeric(7,4),
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE (company_id, numero)
);

CREATE TABLE contratos_fornecedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  fornecedor_id uuid NOT NULL REFERENCES fornecedores(id),
  obra_id uuid REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  numero text NOT NULL,
  objeto text NOT NULL,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  data_inicio date NOT NULL,
  data_fim date,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE (company_id, numero)
);

CREATE TABLE solicitacoes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  obra_id uuid REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  solicitante_id uuid REFERENCES usuarios(id),
  tipo text NOT NULL,
  descricao text NOT NULL,
  especificacao_tecnica text,
  quantidade numeric(14,4),
  unidade text,
  data_necessaria date,
  prioridade text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE cotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  solicitacao_compra_id uuid NOT NULL REFERENCES solicitacoes_compra(id),
  fornecedor_id uuid NOT NULL REFERENCES fornecedores(id),
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  prazo_entrega text,
  condicao_pagamento text,
  frete text,
  recomendada boolean NOT NULL DEFAULT false,
  justificativa text,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE pedidos_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  solicitacao_compra_id uuid REFERENCES solicitacoes_compra(id),
  cotacao_id uuid REFERENCES cotacoes(id),
  fornecedor_id uuid NOT NULL REFERENCES fornecedores(id),
  obra_id uuid REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  numero text NOT NULL,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  data_emissao date,
  prazo_entrega text,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE (company_id, numero)
);

CREATE TABLE notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  fornecedor_id uuid REFERENCES fornecedores(id),
  cliente_id uuid REFERENCES clientes(id),
  pedido_compra_id uuid REFERENCES pedidos_compra(id),
  obra_id uuid REFERENCES obras(id),
  numero text NOT NULL,
  serie text,
  chave_acesso text,
  tipo text NOT NULL DEFAULT 'outro',
  data_emissao date NOT NULL,
  data_vencimento date,
  valor_bruto numeric(14,2) NOT NULL DEFAULT 0,
  valor_liquido numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'recebida',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  fornecedor_id uuid REFERENCES fornecedores(id),
  nota_fiscal_id uuid REFERENCES notas_fiscais(id),
  contrato_fornecedor_id uuid REFERENCES contratos_fornecedor(id),
  obra_id uuid REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  vencimento date NOT NULL,
  valor_original numeric(14,2) NOT NULL DEFAULT 0,
  saldo numeric(14,2) NOT NULL DEFAULT 0,
  forma_pagamento text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  cliente_id uuid REFERENCES clientes(id),
  contrato_cliente_id uuid REFERENCES contratos_cliente(id),
  medicao_obra_id uuid,
  obra_id uuid REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  vencimento date NOT NULL,
  valor_original numeric(14,2) NOT NULL DEFAULT 0,
  saldo numeric(14,2) NOT NULL DEFAULT 0,
  origem text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE medicoes_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  contrato_cliente_id uuid REFERENCES contratos_cliente(id),
  obra_id uuid NOT NULL REFERENCES obras(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  competencia date NOT NULL,
  periodo_inicio date,
  periodo_fim date,
  valor_medido numeric(14,2) NOT NULL DEFAULT 0,
  percentual_fisico numeric(7,4),
  valor_retido numeric(14,2) NOT NULL DEFAULT 0,
  aprovado_por uuid REFERENCES usuarios(id),
  aprovado_em timestamptz,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

ALTER TABLE contas_receber
  ADD CONSTRAINT contas_receber_medicao_obra_fk
  FOREIGN KEY (medicao_obra_id) REFERENCES medicoes_obra(id);

CREATE TABLE documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES empresas(id),
  obra_id uuid REFERENCES obras(id),
  contrato_cliente_id uuid REFERENCES contratos_cliente(id),
  contrato_fornecedor_id uuid REFERENCES contratos_fornecedor(id),
  entidade_tipo text NOT NULL,
  entidade_id uuid,
  nome text NOT NULL,
  tipo_documento text NOT NULL,
  sharepoint_url text NOT NULL,
  sharepoint_item_id text,
  versao text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX idx_usuarios_company_id ON usuarios(company_id);
CREATE INDEX idx_clientes_company_id ON clientes(company_id);
CREATE INDEX idx_fornecedores_company_id ON fornecedores(company_id);
CREATE INDEX idx_obras_company_id ON obras(company_id);
CREATE INDEX idx_obras_cliente_id ON obras(cliente_id);
CREATE INDEX idx_solicitacoes_compra_obra_id ON solicitacoes_compra(obra_id);
CREATE INDEX idx_cotacoes_solicitacao_id ON cotacoes(solicitacao_compra_id);
CREATE INDEX idx_pedidos_compra_fornecedor_id ON pedidos_compra(fornecedor_id);
CREATE INDEX idx_notas_fiscais_pedido_id ON notas_fiscais(pedido_compra_id);
CREATE INDEX idx_contas_pagar_vencimento ON contas_pagar(company_id, vencimento, status);
CREATE INDEX idx_contas_receber_vencimento ON contas_receber(company_id, vencimento, status);
CREATE INDEX idx_medicoes_obra_competencia ON medicoes_obra(obra_id, competencia);
CREATE INDEX idx_documentos_entidade ON documentos(entidade_tipo, entidade_id);

COMMIT;
