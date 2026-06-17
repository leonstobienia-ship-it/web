import type { PoolClient, QueryResultRow } from 'pg';
import { closePool, getPool } from './client.js';

const marker = 'DEV_LOCAL_HOMOLOGACAO_ENAC_V316';

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const currentMonth = (): string => today().slice(0, 7);

const addMonths = (months: number): string => {
  const value = new Date(`${currentMonth()}-01T00:00:00.000Z`);
  value.setUTCMonth(value.getUTCMonth() + months);
  return value.toISOString().slice(0, 7);
};

const firstRow = <T extends QueryResultRow>(rows: T[], label: string): T => {
  const row = rows[0];
  if (!row) {
    throw new Error(`Seed de homologacao nao retornou ${label}.`);
  }
  return row;
};

const upsertEmpresa = async (client: PoolClient): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into empresas (razao_social, nome_fantasia, cnpj, regime_tributario, status)
    values ($1, $2, '00.000.000/0001-33', $3, 'ativo')
    on conflict (cnpj)
    do update set nome_fantasia = excluded.nome_fantasia, regime_tributario = excluded.regime_tributario, updated_at = now()
    returning id
    `,
    ['ENAC DEV - Homologacao V3.16/V3.17', 'ENAC Homologacao Local', marker]
  );
  return firstRow(result.rows, 'empresa').id;
};

const ensurePerfil = async (client: PoolClient, companyId: string, nome: string): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into perfis (company_id, nome, descricao, permissoes, escopo_padrao, status)
    values ($1, $2, $3, '[]'::jsonb, 'empresa', 'ativo')
    on conflict (company_id, nome)
    do update set descricao = excluded.descricao, status = 'ativo', updated_at = now()
    returning id
    `,
    [companyId, nome, `${nome} homologacao local - ${marker}`]
  );
  return firstRow(result.rows, `perfil ${nome}`).id;
};

const ensureUsuario = async (
  client: PoolClient,
  companyId: string,
  nome: string,
  email: string,
  cargo: string,
  perfilIds: string[]
): Promise<string> => {
  const principal = perfilIds[0];
  const result = await client.query<{ id: string }>(
    `
    insert into usuarios (company_id, nome, email, perfil_principal_id, perfil_ids, cargo_funcao, ativo, status)
    values ($1, $2, $3, $4, $5::uuid[], $6, true, 'ativo')
    on conflict (email)
    do update set
      company_id = excluded.company_id,
      nome = excluded.nome,
      perfil_principal_id = excluded.perfil_principal_id,
      perfil_ids = excluded.perfil_ids,
      cargo_funcao = excluded.cargo_funcao,
      ativo = true,
      status = 'ativo',
      updated_at = now()
    returning id
    `,
    [companyId, `${nome} - Homologacao`, email, principal, perfilIds, `${cargo} - ${marker}`]
  );
  const usuarioId = firstRow(result.rows, `usuario ${email}`).id;

  for (const perfilId of perfilIds) {
    await client.query(
      `
      insert into usuarios_perfis (usuario_id, perfil_id, principal, status)
      values ($1, $2, $3, 'ativo')
      on conflict (usuario_id, perfil_id)
      do update set principal = excluded.principal, status = 'ativo', updated_at = now()
      `,
      [usuarioId, perfilId, perfilId === principal]
    );
  }

  return usuarioId;
};

const ensureCliente = async (
  client: PoolClient,
  companyId: string,
  nome: string,
  cpfCnpj: string,
  responsavel: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into clientes (company_id, nome, tipo_pessoa, cpf_cnpj, email, telefone, responsavel, endereco, observacoes, status)
    values ($1, $2, 'juridica', $3, $4, '(00) 3000-0000', $5, $6, $7, 'ativo')
    on conflict (company_id, cpf_cnpj) where cpf_cnpj is not null
    do update set nome = excluded.nome, responsavel = excluded.responsavel, observacoes = excluded.observacoes, status = 'ativo', updated_at = now()
    returning id
    `,
    [companyId, `${nome} - Homologacao`, cpfCnpj, `homologacao+${cpfCnpj.replace(/\D/g, '')}@enac.local`, responsavel, `Endereco simulado - ${nome}`, marker]
  );
  return firstRow(result.rows, `cliente ${nome}`).id;
};

const ensureFornecedor = async (
  client: PoolClient,
  companyId: string,
  nome: string,
  cpfCnpj: string,
  categoria: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into fornecedores (
      company_id, nome, tipo_pessoa, cpf_cnpj, categoria, email, telefone, contato, pix, dados_bancarios, endereco, observacoes, status
    )
    values ($1, $2, 'juridica', $3, $4, $5, '(00) 4000-0000', 'Contato homologacao', $5, $6, $7, $8, 'ativo')
    on conflict (company_id, cpf_cnpj) where cpf_cnpj is not null
    do update set nome = excluded.nome, categoria = excluded.categoria, observacoes = excluded.observacoes, status = 'ativo', updated_at = now()
    returning id
    `,
    [
      companyId,
      `${nome} - Homologacao`,
      cpfCnpj,
      categoria,
      `fornecedor+${cpfCnpj.replace(/\D/g, '')}@enac.local`,
      'Banco mock local / sem integracao bancaria',
      `Endereco simulado - ${nome}`,
      marker
    ]
  );
  return firstRow(result.rows, `fornecedor ${nome}`).id;
};

const ensureCentroCusto = async (
  client: PoolClient,
  companyId: string,
  codigo: string,
  nome: string,
  tipo: string,
  conta: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into centros_custo (company_id, codigo, nome, tipo, conta_analitica, observacoes, status)
    values ($1, $2, $3, $4, $5, $6, 'ativo')
    on conflict (company_id, codigo)
    do update set nome = excluded.nome, tipo = excluded.tipo, conta_analitica = excluded.conta_analitica, observacoes = excluded.observacoes, status = 'ativo', updated_at = now()
    returning id
    `,
    [companyId, codigo, `${nome} - Homologacao`, tipo, conta, marker]
  );
  return firstRow(result.rows, `centro ${codigo}`).id;
};

const ensureObra = async (
  client: PoolClient,
  companyId: string,
  clienteId: string,
  centroCustoId: string,
  codigo: string,
  nome: string,
  offsetDias: number
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into obras (
      company_id, cliente_id, centro_custo_id, codigo, nome, endereco, data_inicio_prevista, data_fim_prevista, observacoes, status
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ativo')
    on conflict (company_id, codigo)
    do update set
      cliente_id = excluded.cliente_id,
      centro_custo_id = excluded.centro_custo_id,
      nome = excluded.nome,
      endereco = excluded.endereco,
      observacoes = excluded.observacoes,
      status = 'ativo',
      updated_at = now()
    returning id
    `,
    [
      companyId,
      clienteId,
      centroCustoId,
      codigo,
      `${nome} - Homologacao`,
      `Endereco simulado - ${nome}`,
      addDays(offsetDias),
      addDays(offsetDias + 210),
      marker
    ]
  );
  return firstRow(result.rows, `obra ${codigo}`).id;
};

const ensureContrato = async (
  client: PoolClient,
  companyId: string,
  clienteId: string,
  obraId: string,
  centroCustoId: string,
  diretoriaId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into contratos_obra (
      company_id, cliente_id, obra_id, centro_custo_id, numero, objeto, escopo_resumo,
      valor_original, valor_aditivos, valor_total_contratado, data_inicio, data_fim,
      percentual_retencao_previsto, impostos_previstos, observacoes, status, ativado_por, ativado_em
    )
    values ($1, $2, $3, $4, 'CT-HOMO-V316-001', $5, $6, 360000, 45000, 405000, $7, $8, 5, $9, $10, 'ATIVO', $11, now())
    on conflict (company_id, numero)
    do update set
      cliente_id = excluded.cliente_id,
      obra_id = excluded.obra_id,
      centro_custo_id = excluded.centro_custo_id,
      objeto = excluded.objeto,
      escopo_resumo = excluded.escopo_resumo,
      valor_original = excluded.valor_original,
      valor_aditivos = excluded.valor_aditivos,
      valor_total_contratado = excluded.valor_total_contratado,
      status = 'ATIVO',
      updated_at = now()
    returning id
    `,
    [
      companyId,
      clienteId,
      obraId,
      centroCustoId,
      `Contrato ativo de obra industrial simulado - ${marker}`,
      'Escopo comercial simulado com civil, instalacoes e acabamento.',
      addDays(-30),
      addDays(210),
      'Impostos estimados em mock local, sem emissao fiscal real.',
      marker,
      diretoriaId
    ]
  );
  return firstRow(result.rows, 'contrato homologacao').id;
};

const ensureContratoItem = async (client: PoolClient, contratoId: string, companyId: string, centroId: string, codigo: string, descricao: string, valor: number): Promise<void> => {
  const existing = await client.query<{ id: string }>('select id from contratos_obra_itens where contrato_id = $1 and codigo = $2 limit 1', [contratoId, codigo]);
  if (existing.rowCount) {
    await client.query('update contratos_obra_itens set descricao = $1, valor_total = $2, status = $3, updated_at = now() where id = $4', [descricao, valor, 'ATIVO', existing.rows[0].id]);
    return;
  }
  await client.query(
    `
    insert into contratos_obra_itens (contrato_id, company_id, codigo, descricao, unidade, quantidade, valor_unitario, valor_total, centro_custo_id, etapa_servico, status)
    values ($1, $2, $3, $4, 'un', 1, $5, $5, $6, 'Execucao', 'ATIVO')
    `,
    [contratoId, companyId, codigo, descricao, valor, centroId]
  );
};

const ensureAditivo = async (client: PoolClient, contratoId: string, companyId: string, diretoriaId: string): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into contratos_obra_aditivos (
      contrato_id, company_id, numero, tipo, descricao, escopo_descricao, valor_delta, prazo_delta_dias,
      nova_data_fim, justificativa, status, aprovacao_status, aprovado_por, aprovado_em, aprovacao_observacoes
    )
    values ($1, $2, 'AD-HOMO-V316-001', 'VALOR_ESCOPO', $3, $4, 45000, 30, $5, $6, 'APROVADO', 'APROVADO_DIRETORIA', $7, now(), $8)
    on conflict (company_id, numero)
    do update set
      contrato_id = excluded.contrato_id,
      descricao = excluded.descricao,
      escopo_descricao = excluded.escopo_descricao,
      valor_delta = excluded.valor_delta,
      status = 'APROVADO',
      aprovacao_status = 'APROVADO_DIRETORIA',
      aprovado_por = excluded.aprovado_por,
      aprovado_em = coalesce(contratos_obra_aditivos.aprovado_em, now()),
      updated_at = now()
    returning id
    `,
    [
      contratoId,
      companyId,
      `Aditivo aprovado de homologacao - ${marker}`,
      'Acrescimo simulado de escopo e prazo para testes da diretoria.',
      addDays(240),
      marker,
      diretoriaId,
      'Aprovacao simulada por alçada local.'
    ]
  );
  return firstRow(result.rows, 'aditivo homologacao').id;
};

const ensureOrcamento = async (
  client: PoolClient,
  companyId: string,
  clienteId: string,
  obraId: string,
  contratoId: string,
  centroCustoId: string,
  planejamentoId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into orcamentos_obra (
      company_id, obra_id, cliente_id, contrato_obra_id, centro_custo_id, codigo, versao, descricao,
      competencia_base, valor_previsto_total, valor_material, valor_mao_obra, valor_equipamento,
      valor_servico, valor_outros, margem_prevista_percentual, observacoes, status, aprovado_por, aprovado_em, aprovado_observacoes
    )
    values ($1, $2, $3, $4, $5, 'ORC-HOMO-V316-001', 'V1', $6, $7, 300000, 120000, 95000, 35000, 42000, 8000, 25.93, $8, 'APROVADO', $9, now(), $10)
    on conflict (company_id, obra_id) where status = 'APROVADO'
    do update set
      cliente_id = excluded.cliente_id,
      contrato_obra_id = excluded.contrato_obra_id,
      centro_custo_id = excluded.centro_custo_id,
      codigo = excluded.codigo,
      descricao = excluded.descricao,
      valor_previsto_total = excluded.valor_previsto_total,
      valor_material = excluded.valor_material,
      valor_mao_obra = excluded.valor_mao_obra,
      valor_equipamento = excluded.valor_equipamento,
      valor_servico = excluded.valor_servico,
      valor_outros = excluded.valor_outros,
      observacoes = excluded.observacoes,
      updated_at = now()
    returning id
    `,
    [
      companyId,
      obraId,
      clienteId,
      contratoId,
      centroCustoId,
      `Orcamento base aprovado para homologacao - ${marker}`,
      currentMonth(),
      marker,
      planejamentoId,
      'Orcamento aprovado em ambiente local.'
    ]
  );
  return firstRow(result.rows, 'orcamento homologacao').id;
};

const ensurePacote = async (
  client: PoolClient,
  orcamentoId: string,
  companyId: string,
  codigo: string,
  nome: string,
  etapa: string,
  centroId: string,
  ordem: number
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into orcamentos_obra_pacotes (orcamento_id, company_id, codigo, nome, descricao, etapa, centro_custo_id, ordem, status)
    values ($1, $2, $3, $4, $5, $6, $7, $8, 'ATIVO')
    on conflict (orcamento_id, codigo)
    do update set nome = excluded.nome, descricao = excluded.descricao, etapa = excluded.etapa, centro_custo_id = excluded.centro_custo_id, ordem = excluded.ordem, status = 'ATIVO', updated_at = now()
    returning id
    `,
    [orcamentoId, companyId, codigo, `${nome} - Homologacao`, marker, etapa, centroId, ordem]
  );
  return firstRow(result.rows, `pacote ${codigo}`).id;
};

const ensureOrcamentoItem = async (
  client: PoolClient,
  orcamentoId: string,
  pacoteId: string,
  companyId: string,
  centroId: string,
  tipo: string,
  codigo: string,
  descricao: string,
  valor: number
): Promise<void> => {
  const existing = await client.query<{ id: string }>('select id from orcamentos_obra_itens where orcamento_id = $1 and codigo = $2 limit 1', [orcamentoId, codigo]);
  if (existing.rowCount) {
    await client.query(
      'update orcamentos_obra_itens set pacote_id = $1, centro_custo_id = $2, descricao = $3, valor_unitario_previsto = $4, valor_total_previsto = $4, status = $5, updated_at = now() where id = $6',
      [pacoteId, centroId, descricao, valor, 'ATIVO', existing.rows[0].id]
    );
    return;
  }
  await client.query(
    `
    insert into orcamentos_obra_itens (
      orcamento_id, pacote_id, company_id, centro_custo_id, tipo, codigo, descricao, unidade,
      quantidade, valor_unitario_previsto, valor_total_previsto, observacoes, status
    )
    values ($1, $2, $3, $4, $5, $6, $7, 'un', 1, $8, $8, $9, 'ATIVO')
    `,
    [orcamentoId, pacoteId, companyId, centroId, tipo, codigo, descricao, valor, marker]
  );
};

const ensureCronograma = async (client: PoolClient, orcamentoId: string, pacoteId: string, companyId: string, competencia: string, valor: number, percentual: number): Promise<void> => {
  const existing = await client.query<{ id: string }>('select id from orcamentos_obra_cronograma where orcamento_id = $1 and pacote_id = $2 and competencia = $3 limit 1', [orcamentoId, pacoteId, competencia]);
  if (existing.rowCount) {
    await client.query(
      'update orcamentos_obra_cronograma set valor_previsto = $1, percentual_fisico_previsto = $2, observacoes = $3, status = $4, updated_at = now() where id = $5',
      [valor, percentual, marker, 'ATIVO', existing.rows[0].id]
    );
    return;
  }
  await client.query(
    `
    insert into orcamentos_obra_cronograma (orcamento_id, pacote_id, company_id, competencia, valor_previsto, percentual_fisico_previsto, observacoes, status)
    values ($1, $2, $3, $4, $5, $6, $7, 'ATIVO')
    `,
    [orcamentoId, pacoteId, companyId, competencia, valor, percentual, marker]
  );
};

const ensurePlanejamento = async (
  client: PoolClient,
  companyId: string,
  obraId: string,
  orcamentoId: string,
  contratoId: string,
  centroId: string,
  responsavelId: string,
  etapa: string,
  inicioOffset: number,
  fimOffset: number
): Promise<string> => {
  const existing = await client.query<{ id: string }>(
    'select id from planejamento_executivo where obra_id = $1 and etapa = $2 limit 1',
    [obraId, etapa]
  );
  if (existing.rowCount) {
    await client.query(
      `
      update planejamento_executivo
      set orcamento_id = $1, contrato_obra_id = $2, centro_custo_id = $3, responsavel_id = $4,
          descricao = $5, data_inicio_prevista = $6, data_fim_prevista = $7, observacoes = $8,
          status = 'ATIVO', updated_at = now()
      where id = $9
      `,
      [orcamentoId, contratoId, centroId, responsavelId, `${etapa} - ${marker}`, addDays(inicioOffset), addDays(fimOffset), marker, existing.rows[0].id]
    );
    return existing.rows[0].id;
  }
  const result = await client.query<{ id: string }>(
    `
    insert into planejamento_executivo (
      company_id, obra_id, orcamento_id, contrato_obra_id, centro_custo_id, etapa, descricao,
      data_inicio_prevista, data_fim_prevista, responsavel_id, observacoes, status, ativado_por, ativado_em
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ATIVO', $10, now())
    returning id
    `,
    [companyId, obraId, orcamentoId, contratoId, centroId, etapa, `${etapa} - ${marker}`, addDays(inicioOffset), addDays(fimOffset), responsavelId, marker]
  );
  return firstRow(result.rows, `planejamento ${etapa}`).id;
};

const ensureSolicitacao = async (
  client: PoolClient,
  companyId: string,
  obraId: string,
  centroId: string,
  solicitanteId: string,
  aprovadorId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into solicitacoes_compra (
      company_id, obra_id, centro_custo_id, solicitante_id, tipo, descricao, especificacao_tecnica,
      quantidade, unidade, data_necessaria, prioridade, status, codigo, titulo, data_necessidade,
      valor_estimado_total, observacoes, aprovacao_status, aprovado_por, aprovado_em, aprovacao_observacoes
    )
    values ($1, $2, $3, $4, 'MATERIAL', $5, $6, 1, 'un', $7, 'ALTA', 'APROVADA_PARA_COTACAO',
            'SC-HOMO-V316-001', $8, $7, 48000, $9, 'APROVADO_TECNICO', $10, now(), $11)
    on conflict (company_id, codigo)
    do update set
      obra_id = excluded.obra_id,
      centro_custo_id = excluded.centro_custo_id,
      solicitante_id = excluded.solicitante_id,
      descricao = excluded.descricao,
      valor_estimado_total = excluded.valor_estimado_total,
      status = 'APROVADA_PARA_COTACAO',
      aprovacao_status = 'APROVADO_TECNICO',
      aprovado_por = excluded.aprovado_por,
      updated_at = now()
    returning id
    `,
    [
      companyId,
      obraId,
      centroId,
      solicitanteId,
      `Solicitacao de materiais para homologacao - ${marker}`,
      'Cenario simulado de compra com cotacao e pedido.',
      addDays(20),
      'Materiais eletricos e hidraulicos para obra homologacao',
      marker,
      aprovadorId,
      'Aprovacao tecnica simulada.'
    ]
  );
  return firstRow(result.rows, 'solicitacao homologacao').id;
};

const ensureSolicitacaoItem = async (client: PoolClient, solicitacaoId: string): Promise<string> => {
  const existing = await client.query<{ id: string }>('select id from solicitacoes_compra_itens where solicitacao_id = $1 and ordem = 1 limit 1', [solicitacaoId]);
  if (existing.rowCount) {
    await client.query(
      'update solicitacoes_compra_itens set descricao = $1, quantidade = 1, valor_estimado_unitario = 48000, valor_estimado_total = 48000, status = $2, updated_at = now() where id = $3',
      [`Item principal de homologacao - ${marker}`, 'ATIVO', existing.rows[0].id]
    );
    return existing.rows[0].id;
  }
  const result = await client.query<{ id: string }>(
    `
    insert into solicitacoes_compra_itens (solicitacao_id, descricao, unidade, quantidade, valor_estimado_unitario, valor_estimado_total, observacoes, ordem, status)
    values ($1, $2, 'un', 1, 48000, 48000, $3, 1, 'ATIVO')
    returning id
    `,
    [solicitacaoId, `Item principal de homologacao - ${marker}`, marker]
  );
  return firstRow(result.rows, 'item solicitacao').id;
};

const ensureCotacao = async (
  client: PoolClient,
  companyId: string,
  solicitacaoId: string,
  fornecedorId: string,
  aprovadorId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into cotacoes (
      company_id, solicitacao_compra_id, fornecedor_id, codigo, titulo, data_recebimento, prazo_resposta,
      valor_total, prazo_entrega, prazo_entrega_dias, condicao_pagamento, recomendada, justificativa,
      status, observacoes, aprovacao_status, aprovado_por, aprovado_em, aprovacao_observacoes
    )
    values ($1, $2, $3, 'COT-HOMO-V316-001', $4, $5, $6, 48000, '15 dias', 15, '30 dias', true, $7,
            'FORNECEDOR_ESCOLHIDO', $8, 'APROVADO_TECNICO', $9, now(), $10)
    on conflict (company_id, codigo)
    do update set
      solicitacao_compra_id = excluded.solicitacao_compra_id,
      fornecedor_id = excluded.fornecedor_id,
      titulo = excluded.titulo,
      valor_total = excluded.valor_total,
      status = 'FORNECEDOR_ESCOLHIDO',
      aprovacao_status = 'APROVADO_TECNICO',
      aprovado_por = excluded.aprovado_por,
      updated_at = now()
    returning id
    `,
    [
      companyId,
      solicitacaoId,
      fornecedorId,
      `Cotacao comparativa homologacao - ${marker}`,
      today(),
      addDays(7),
      'Melhor combinacao simulada de preco e prazo.',
      marker,
      aprovadorId,
      'Mapa aprovado em homologacao.'
    ]
  );
  return firstRow(result.rows, 'cotacao homologacao').id;
};

const ensureCotacaoFornecedor = async (
  client: PoolClient,
  cotacaoId: string,
  fornecedorId: string,
  status: string,
  valor: number,
  observacoes: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into cotacoes_fornecedores (cotacao_id, fornecedor_id, status, valor_total, prazo_entrega_dias, condicao_pagamento, observacoes)
    values ($1, $2, $3, $4, 15, '30 dias', $5)
    on conflict (cotacao_id, fornecedor_id)
    do update set status = excluded.status, valor_total = excluded.valor_total, observacoes = excluded.observacoes, updated_at = now()
    returning id
    `,
    [cotacaoId, fornecedorId, status, valor, observacoes]
  );
  return firstRow(result.rows, 'cotacao fornecedor').id;
};

const ensureCotacaoItem = async (
  client: PoolClient,
  cotacaoId: string,
  cotacaoFornecedorId: string,
  solicitacaoItemId: string,
  descricao: string,
  valor: number
): Promise<string> => {
  const existing = await client.query<{ id: string }>(
    'select id from cotacoes_itens where cotacao_id = $1 and cotacao_fornecedor_id = $2 and solicitacao_item_id = $3 limit 1',
    [cotacaoId, cotacaoFornecedorId, solicitacaoItemId]
  );
  if (existing.rowCount) {
    await client.query(
      'update cotacoes_itens set descricao = $1, valor_unitario = $2, valor_total = $2, status = $3, updated_at = now() where id = $4',
      [descricao, valor, 'ATIVO', existing.rows[0].id]
    );
    return existing.rows[0].id;
  }
  const result = await client.query<{ id: string }>(
    `
    insert into cotacoes_itens (
      cotacao_id, cotacao_fornecedor_id, solicitacao_item_id, descricao, unidade, quantidade,
      valor_unitario, valor_total, marca_modelo, prazo_entrega_dias, observacoes, ordem, status
    )
    values ($1, $2, $3, $4, 'un', 1, $5, $5, 'Mock homologacao', 15, $6, 1, 'ATIVO')
    returning id
    `,
    [cotacaoId, cotacaoFornecedorId, solicitacaoItemId, descricao, valor, marker]
  );
  return firstRow(result.rows, 'cotacao item').id;
};

const ensureMapaCotacao = async (client: PoolClient, cotacaoId: string, fornecedorId: string): Promise<void> => {
  await client.query(
    `
    insert into mapa_comparativo_cotacao (cotacao_id, fornecedor_vencedor_id, criterio_decisao, justificativa, valor_vencedor, status)
    values ($1, $2, 'MENOR_PRECO_COM_PRAZO', $3, 48000, 'FORNECEDOR_ESCOLHIDO')
    on conflict (cotacao_id)
    do update set fornecedor_vencedor_id = excluded.fornecedor_vencedor_id, justificativa = excluded.justificativa, valor_vencedor = excluded.valor_vencedor, status = excluded.status, updated_at = now()
    `,
    [cotacaoId, fornecedorId, `Mapa comparativo simulado - ${marker}`]
  );
};

const ensurePedidoCompra = async (
  client: PoolClient,
  companyId: string,
  solicitacaoId: string,
  cotacaoId: string,
  fornecedorId: string,
  obraId: string,
  centroId: string,
  aprovadorId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into pedidos_compra (
      company_id, solicitacao_compra_id, solicitacao_id, cotacao_id, fornecedor_id, obra_id, centro_custo_id,
      numero, codigo, titulo, valor_total, data_emissao, data_entrega_prevista, condicao_pagamento,
      status, observacoes, aprovacao_status, aprovado_por, aprovado_em, aprovacao_observacoes
    )
    values ($1, $2, $2, $3, $4, $5, $6, 'PC-HOMO-V316-001', 'PC-HOMO-V316-001', $7, 48000, $8, $9,
            '30 dias', 'CONFIRMADO', $10, 'APROVADO_TECNICO', $11, now(), $12)
    on conflict (company_id, codigo)
    do update set
      solicitacao_compra_id = excluded.solicitacao_compra_id,
      solicitacao_id = excluded.solicitacao_id,
      cotacao_id = excluded.cotacao_id,
      fornecedor_id = excluded.fornecedor_id,
      obra_id = excluded.obra_id,
      centro_custo_id = excluded.centro_custo_id,
      titulo = excluded.titulo,
      valor_total = excluded.valor_total,
      status = 'CONFIRMADO',
      aprovacao_status = 'APROVADO_TECNICO',
      aprovado_por = excluded.aprovado_por,
      updated_at = now()
    returning id
    `,
    [
      companyId,
      solicitacaoId,
      cotacaoId,
      fornecedorId,
      obraId,
      centroId,
      `Pedido confirmado homologacao - ${marker}`,
      today(),
      addDays(25),
      marker,
      aprovadorId,
      'Pedido aprovado em homologacao.'
    ]
  );
  return firstRow(result.rows, 'pedido compra').id;
};

const ensurePedidoItem = async (client: PoolClient, pedidoId: string, solicitacaoItemId: string, cotacaoItemId: string): Promise<string> => {
  const existing = await client.query<{ id: string }>('select id from pedidos_compra_itens where pedido_id = $1 and ordem = 1 limit 1', [pedidoId]);
  if (existing.rowCount) {
    await client.query(
      'update pedidos_compra_itens set solicitacao_item_id = $1, cotacao_item_id = $2, descricao = $3, valor_unitario = 48000, valor_total = 48000, updated_at = now() where id = $4',
      [solicitacaoItemId, cotacaoItemId, `Item pedido homologacao - ${marker}`, existing.rows[0].id]
    );
    return existing.rows[0].id;
  }
  const result = await client.query<{ id: string }>(
    `
    insert into pedidos_compra_itens (pedido_id, solicitacao_item_id, cotacao_item_id, descricao, unidade, quantidade, valor_unitario, valor_total, observacoes, ordem)
    values ($1, $2, $3, $4, 'un', 1, 48000, 48000, $5, 1)
    returning id
    `,
    [pedidoId, solicitacaoItemId, cotacaoItemId, `Item pedido homologacao - ${marker}`, marker]
  );
  return firstRow(result.rows, 'pedido item').id;
};

const ensureNotaEntrada = async (
  client: PoolClient,
  companyId: string,
  pedidoId: string,
  fornecedorId: string,
  obraId: string,
  centroId: string,
  aprovadorId: string
): Promise<string> => {
  const existing = await client.query<{ id: string }>(
    `
    select id from notas_fiscais_entrada
    where company_id = $1 and fornecedor_id = $2 and numero = 'NF-HOMO-V316-001' and coalesce(serie, '') = '316' and status <> 'CANCELADA'
    limit 1
    `,
    [companyId, fornecedorId]
  );
  if (existing.rowCount) {
    await client.query(
      `
      update notas_fiscais_entrada
      set pedido_id = $1, obra_id = $2, centro_custo_id = $3, valor_produtos = 48000,
          valor_total = 48000, status = 'APROVADA', aprovacao_status = 'APROVADO_TECNICO',
          aprovado_por = $4, aprovado_em = coalesce(aprovado_em, now()), observacoes = $5, updated_at = now()
      where id = $6
      `,
      [pedidoId, obraId, centroId, aprovadorId, marker, existing.rows[0].id]
    );
    return existing.rows[0].id;
  }
  const result = await client.query<{ id: string }>(
    `
    insert into notas_fiscais_entrada (
      company_id, pedido_id, fornecedor_id, obra_id, centro_custo_id, numero, serie, chave_acesso,
      tipo_documento, data_emissao, data_entrada, valor_produtos, valor_servicos, valor_frete,
      valor_desconto, valor_impostos, valor_total, status, observacoes, aprovacao_status, aprovado_por, aprovado_em, aprovacao_observacoes
    )
    values ($1, $2, $3, $4, $5, 'NF-HOMO-V316-001', '316', $6, 'NOTA_FISCAL', $7, $7,
            48000, 0, 0, 0, 0, 48000, 'APROVADA', $8, 'APROVADO_TECNICO', $9, now(), $10)
    returning id
    `,
    [companyId, pedidoId, fornecedorId, obraId, centroId, `HOMO${Date.now()}`, today(), marker, aprovadorId, 'NF conferida em homologacao local.']
  );
  return firstRow(result.rows, 'nota entrada').id;
};

const ensureNotaItem = async (client: PoolClient, notaId: string, pedidoItemId: string): Promise<void> => {
  const existing = await client.query<{ id: string }>('select id from notas_fiscais_entrada_itens where nota_id = $1 and ordem = 1 limit 1', [notaId]);
  if (existing.rowCount) {
    await client.query(
      'update notas_fiscais_entrada_itens set pedido_item_id = $1, descricao = $2, valor_unitario = 48000, valor_total = 48000, updated_at = now() where id = $3',
      [pedidoItemId, `Item NF homologacao - ${marker}`, existing.rows[0].id]
    );
    return;
  }
  await client.query(
    `
    insert into notas_fiscais_entrada_itens (nota_id, nota_fiscal_id, pedido_item_id, descricao, unidade, quantidade, valor_unitario, valor_total, observacoes, ordem)
    values ($1, $1, $2, $3, 'un', 1, 48000, 48000, $4, 1)
    `,
    [notaId, pedidoItemId, `Item NF homologacao - ${marker}`, marker]
  );
};

const ensureContaPagar = async (
  client: PoolClient,
  companyId: string,
  fornecedorId: string,
  notaId: string,
  pedidoId: string,
  obraId: string,
  centroId: string,
  financeiroId: string
): Promise<string> => {
  const existing = await client.query<{ id: string }>('select id from contas_pagar where company_id = $1 and numero_documento = $2 limit 1', [companyId, 'CP-HOMO-V316-001']);
  if (existing.rowCount) {
    await client.query(
      `
      update contas_pagar
      set fornecedor_id = $1, nota_entrada_id = $2, pedido_id = $3, obra_id = $4, centro_custo_id = $5,
          vencimento = $6, data_vencimento = $6, data_emissao = $7, valor_original = 48000,
          valor_aberto = 0, saldo = 0, forma_pagamento_prevista = 'TED mock local',
          status = 'BAIXADA_MANUAL', aprovacao_status = 'APROVADO_DIRETORIA', aprovado_por = $8,
          aprovado_em = coalesce(aprovado_em, now()), ativo = true, divergencia_pendente = false,
          baixa_status = 'BAIXADA_MANUAL', baixado_manual_por = $8, baixado_manual_em = coalesce(baixado_manual_em, now()),
          baixa_manual_data = $7, baixa_manual_valor = 48000, baixa_manual_forma_pagamento = 'Manual controlada mock',
          baixa_manual_observacoes = $9, baixa_manual_referencia_anexo = 'mock://homologacao/baixa-manual',
          updated_at = now()
      where id = $10
      `,
      [fornecedorId, notaId, pedidoId, obraId, centroId, addDays(15), today(), financeiroId, `Baixa manual simulada para seed - ${marker}`, existing.rows[0].id]
    );
    return existing.rows[0].id;
  }
  const result = await client.query<{ id: string }>(
    `
    insert into contas_pagar (
      company_id, fornecedor_id, nota_entrada_id, pedido_id, obra_id, centro_custo_id,
      vencimento, data_emissao, data_vencimento, valor_original, valor_aberto, saldo,
      numero_documento, parcela, total_parcelas, forma_pagamento_prevista, status,
      aprovacao_status, aprovado_por, aprovado_em, ativo, divergencia_pendente,
      baixa_status, baixado_manual_por, baixado_manual_em, baixa_manual_data, baixa_manual_valor,
      baixa_manual_forma_pagamento, baixa_manual_observacoes, baixa_manual_referencia_anexo, observacoes
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $7, 48000, 0, 0,
            'CP-HOMO-V316-001', 1, 1, 'TED mock local', 'BAIXADA_MANUAL',
            'APROVADO_DIRETORIA', $9, now(), true, false,
            'BAIXADA_MANUAL', $9, now(), $8, 48000, 'Manual controlada mock',
            $10, 'mock://homologacao/baixa-manual', $11)
    returning id
    `,
    [companyId, fornecedorId, notaId, pedidoId, obraId, centroId, addDays(15), today(), financeiroId, `Baixa manual simulada para seed - ${marker}`, marker]
  );
  return firstRow(result.rows, 'conta pagar').id;
};

const ensureProgramacao = async (
  client: PoolClient,
  companyId: string,
  fornecedorId: string,
  obraId: string,
  centroId: string,
  diretoriaId: string,
  financeiroId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into programacoes_pagamento (
      company_id, codigo, status, data_prevista, fornecedor_id, obra_id, centro_custo_id,
      forma_pagamento_prevista, valor_total, quantidade_contas, observacoes, justificativa,
      aprovacao_status, aprovado_por, aprovado_em, aprovacao_observacoes, submetido_por, submetido_em,
      liberacao_status, liberado_por, liberado_em, liberacao_justificativa, liberacao_valor_total,
      liberacao_quantidade_contas, liberacao_alcada_origem, liberacao_status_anterior,
      conferencia_status, conferido_por, conferido_em, conferencia_observacoes, conferencia_checklist,
      conferencia_valor_total, conferencia_quantidade_contas, conferencia_status_anterior, conferencia_status_novo
    )
    values ($1, 'PG-HOMO-V316-001', 'LIBERADA', $2, $3, $4, $5, 'TED mock local',
            48000, 1, $6, $7, 'APROVADO_DIRETORIA', $8, now(), $9, $10, now(),
            'LIBERADA', $8, now(), $11, 48000, 1, 'DIRETORIA', 'PENDENTE_LIBERACAO',
            'CONFERIDA', $10, now(), $12, $13::jsonb, 48000, 1, 'PENDENTE_CONFERENCIA', 'CONFERIDA')
    on conflict (codigo)
    do update set
      company_id = excluded.company_id,
      status = 'LIBERADA',
      data_prevista = excluded.data_prevista,
      fornecedor_id = excluded.fornecedor_id,
      obra_id = excluded.obra_id,
      centro_custo_id = excluded.centro_custo_id,
      valor_total = 48000,
      quantidade_contas = 1,
      aprovacao_status = 'APROVADO_DIRETORIA',
      liberacao_status = 'LIBERADA',
      conferencia_status = 'CONFERIDA',
      updated_at = now()
    returning id
    `,
    [
      companyId,
      addDays(16),
      fornecedorId,
      obraId,
      centroId,
      marker,
      'Programacao simulada para homologacao sem execucao bancaria.',
      diretoriaId,
      'Aprovacao de programacao simulada.',
      financeiroId,
      'Liberacao interna simulada; nao executa pagamento.',
      'Conferencia financeira simulada pre-baixa manual.',
      JSON.stringify({ dados_bancarios_mock: true, comprovante_real: false, marker })
    ]
  );
  return firstRow(result.rows, 'programacao').id;
};

const ensureProgramacaoItem = async (client: PoolClient, programacaoId: string, contaId: string, companyId: string, financeiroId: string): Promise<void> => {
  const existing = await client.query<{ id: string }>('select id from programacoes_pagamento_itens where programacao_id = $1 and conta_pagar_id = $2 limit 1', [programacaoId, contaId]);
  if (existing.rowCount) {
    await client.query(
      'update programacoes_pagamento_itens set valor_programado = 48000, status = $1, observacoes = $2, updated_at = now() where id = $3',
      ['ATIVA', marker, existing.rows[0].id]
    );
  } else {
    await client.query(
      `
      insert into programacoes_pagamento_itens (programacao_id, conta_pagar_id, company_id, valor_programado, status, observacoes, adicionado_por)
      values ($1, $2, $3, 48000, 'ATIVA', $4, $5)
      `,
      [programacaoId, contaId, companyId, marker, financeiroId]
    );
  }
  await client.query(
    `
    update contas_pagar
    set programado_por = $1, programado_em = coalesce(programado_em, now()),
        data_programada_pagamento = $2, forma_pagamento_programada = 'TED mock local',
        referencia_programacao = 'PG-HOMO-V316-001', valor_programado = 48000,
        programacao_observacoes = $3, updated_at = now()
    where id = $4
    `,
    [financeiroId, addDays(16), marker, contaId]
  );
};

const ensureProgramacaoHistoricos = async (
  client: PoolClient,
  programacaoId: string,
  companyId: string,
  diretoriaId: string,
  financeiroId: string
): Promise<void> => {
  const liberacao = await client.query<{ id: string }>(
    'select id from programacoes_pagamento_liberacoes where programacao_id = $1 and resultado = $2 limit 1',
    [programacaoId, 'PERMITIDO']
  );
  if (!liberacao.rowCount) {
    await client.query(
      `
      insert into programacoes_pagamento_liberacoes (
        programacao_id, company_id, status_anterior, status_novo, liberacao_status, usuario_id,
        valor_total_liberado, quantidade_contas, origem_alcada, justificativa, resultado
      )
      values ($1, $2, 'APROVADA', 'LIBERADA', 'LIBERADA', $3, 48000, 1, 'DIRETORIA', $4, 'PERMITIDO')
      `,
      [programacaoId, companyId, diretoriaId, `Liberacao simulada - ${marker}`]
    );
  }

  const conferencia = await client.query<{ id: string }>(
    'select id from programacoes_pagamento_conferencias where programacao_id = $1 and resultado = $2 limit 1',
    [programacaoId, 'PERMITIDO']
  );
  if (!conferencia.rowCount) {
    await client.query(
      `
      insert into programacoes_pagamento_conferencias (
        programacao_id, company_id, acao, status_anterior, status_novo, conferencia_status,
        usuario_id, valor_total_conferido, quantidade_contas, checklist, observacoes, resultado
      )
      values ($1, $2, 'CONFERIR_FINANCEIRO', 'PENDENTE_CONFERENCIA', 'CONFERIDA', 'CONFERIDA',
              $3, 48000, 1, $4::jsonb, $5, 'PERMITIDO')
      `,
      [programacaoId, companyId, financeiroId, JSON.stringify({ documento_mock: true, sem_pagamento_real: true, marker }), `Conferencia simulada - ${marker}`]
    );
  }
};

const ensureBaixaManual = async (client: PoolClient, contaId: string, companyId: string, programacaoId: string, financeiroId: string): Promise<void> => {
  const existing = await client.query<{ id: string }>(
    'select id from contas_pagar_baixas where conta_pagar_id = $1 and acao = $2 and resultado = $3 limit 1',
    [contaId, 'BAIXAR_MANUAL', 'PERMITIDO']
  );
  if (!existing.rowCount) {
    await client.query(
      `
      insert into contas_pagar_baixas (
        conta_pagar_id, company_id, programacao_id, acao, status_anterior, status_novo, baixa_status,
        usuario_id, valor_baixado, data_baixa, forma_pagamento_manual, observacoes, referencia_anexo, resultado
      )
      values ($1, $2, $3, 'BAIXAR_MANUAL', 'PROGRAMADA', 'BAIXADA_MANUAL', 'BAIXADA_MANUAL',
              $4, 48000, $5, 'Manual controlada mock', $6, 'mock://homologacao/baixa-manual', 'PERMITIDO')
      `,
      [contaId, companyId, programacaoId, financeiroId, today(), `Baixa manual simulada local - ${marker}`]
    );
  }
};

const ensureMedicao = async (
  client: PoolClient,
  companyId: string,
  clienteId: string,
  obraId: string,
  centroId: string,
  contratoId: string,
  responsavelId: string,
  aprovadorId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into medicoes_obra (
      company_id, cliente_id, obra_id, centro_custo_id, competencia, periodo_inicio, periodo_fim,
      numero, contrato_obra_id, contrato_escopo, valor_medido, valor_retido, percentual_fisico,
      valor_bruto, retencoes_previstas, impostos_estimados, valor_liquido_previsto,
      responsavel_id, observacoes, aprovacao_status, aprovado_por, aprovado_em,
      faturamento_solicitado_por, faturamento_solicitado_em, faturado_manual_por, faturado_manual_em,
      faturado_manual_data, faturado_manual_observacoes, status
    )
    values ($1, $2, $3, $4, $5, $6, $7, 'MED-HOMO-V316-001', $8, $9,
            90000, 4500, 30, 90000, 4500, 5000, 80500, $10, $11,
            'APROVADO_TECNICO', $12, now(), $10, now(), $10, now(), $13, $14, 'FATURADO_MANUALMENTE')
    on conflict (company_id, numero) where numero is not null
    do update set
      cliente_id = excluded.cliente_id,
      obra_id = excluded.obra_id,
      centro_custo_id = excluded.centro_custo_id,
      contrato_obra_id = excluded.contrato_obra_id,
      valor_medido = excluded.valor_medido,
      valor_bruto = excluded.valor_bruto,
      valor_liquido_previsto = excluded.valor_liquido_previsto,
      status = 'FATURADO_MANUALMENTE',
      updated_at = now()
    returning id
    `,
    [
      companyId,
      clienteId,
      obraId,
      centroId,
      `${currentMonth()}-01`,
      addDays(-20),
      addDays(10),
      contratoId,
      `Escopo medido simulado - ${marker}`,
      responsavelId,
      marker,
      aprovadorId,
      today(),
      'Faturamento manual simulado, sem NFS-e real.'
    ]
  );
  return firstRow(result.rows, 'medicao').id;
};

const ensureMedicaoItem = async (client: PoolClient, medicaoId: string, companyId: string, centroId: string): Promise<void> => {
  const existing = await client.query<{ id: string }>('select id from medicoes_obra_itens where medicao_id = $1 and etapa_servico = $2 limit 1', [medicaoId, 'Execucao homologacao']);
  if (existing.rowCount) {
    await client.query(
      'update medicoes_obra_itens set descricao = $1, valor_unitario = 90000, valor_total = 90000, status = $2, updated_at = now() where id = $3',
      [`Item medido homologacao - ${marker}`, 'ATIVO', existing.rows[0].id]
    );
    return;
  }
  await client.query(
    `
    insert into medicoes_obra_itens (medicao_id, company_id, descricao, unidade, quantidade, valor_unitario, valor_total, centro_custo_id, etapa_servico, status)
    values ($1, $2, $3, 'un', 1, 90000, 90000, $4, 'Execucao homologacao', 'ATIVO')
    `,
    [medicaoId, companyId, `Item medido homologacao - ${marker}`, centroId]
  );
};

const ensurePedidoFaturamento = async (
  client: PoolClient,
  medicaoId: string,
  companyId: string,
  clienteId: string,
  obraId: string,
  contratoId: string,
  responsavelId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into pedidos_faturamento (
      medicao_id, company_id, cliente_id, obra_id, codigo, valor_solicitado, data_solicitacao,
      responsavel_id, status, aprovacao_status, aprovado_por, aprovado_em,
      faturado_manual_por, faturado_manual_em, faturado_manual_data, faturado_manual_observacoes,
      contrato_obra_id, observacoes
    )
    values ($1, $2, $3, $4, 'PF-HOMO-V316-001', 85000, $5, $6, 'FATURADO_MANUALMENTE',
            'APROVADO_TECNICO', $6, now(), $6, now(), $5, $7, $8, $9)
    on conflict (company_id, codigo)
    do update set
      medicao_id = excluded.medicao_id,
      cliente_id = excluded.cliente_id,
      obra_id = excluded.obra_id,
      valor_solicitado = excluded.valor_solicitado,
      status = 'FATURADO_MANUALMENTE',
      contrato_obra_id = excluded.contrato_obra_id,
      updated_at = now()
    returning id
    `,
    [medicaoId, companyId, clienteId, obraId, today(), responsavelId, 'Faturamento manual simulado, sem NFS-e real.', contratoId, marker]
  );
  return firstRow(result.rows, 'pedido faturamento').id;
};

const ensureRisco = async (
  client: PoolClient,
  companyId: string,
  obraId: string,
  clienteId: string,
  contratoId: string,
  orcamentoId: string,
  contaId: string,
  programacaoId: string,
  medicaoId: string,
  pedidoFaturamentoId: string,
  responsavelId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into riscos_pendencias (
      company_id, codigo, titulo, descricao, tipo, prioridade, status, responsavel_id,
      prazo, obra_id, cliente_id, contrato_obra_id, orcamento_id, conta_pagar_id,
      programacao_pagamento_id, medicao_id, pedido_faturamento_id, dashboard_alerta_tipo,
      dashboard_alerta_payload, origem, bloqueio_motivo, created_by, updated_by
    )
    values ($1, 'RISC-HOMO-V316-001', $2, $3, 'MARGEM', 'ALTA', 'EM_ANDAMENTO', $4,
            $5, $6, $7, $8, $9, $10, $11, $12, $13, 'HOMOLOGACAO_MARGEM',
            $14::jsonb, 'OPERACIONAL', $15, $4, $4)
    on conflict (company_id, codigo)
    do update set
      titulo = excluded.titulo,
      descricao = excluded.descricao,
      status = 'EM_ANDAMENTO',
      responsavel_id = excluded.responsavel_id,
      obra_id = excluded.obra_id,
      dashboard_alerta_payload = excluded.dashboard_alerta_payload,
      updated_at = now()
    returning id
    `,
    [
      companyId,
      `Risco de margem homologacao - ${marker}`,
      'Pendencia simulada para validar central, dashboard e roteiro de diretoria.',
      responsavelId,
      addDays(5),
      obraId,
      clienteId,
      contratoId,
      orcamentoId,
      contaId,
      programacaoId,
      medicaoId,
      pedidoFaturamentoId,
      JSON.stringify({ marker, severidade: 'ALTA', origem: 'seed_homologacao' }),
      'Tratativa simulada em ambiente local.'
    ]
  );
  const riscoId = firstRow(result.rows, 'risco').id;
  const hist = await client.query<{ id: string }>('select id from riscos_pendencias_historico where pendencia_id = $1 and acao = $2 limit 1', [riscoId, 'SEED_HOMOLOGACAO']);
  if (!hist.rowCount) {
    await client.query(
      `
      insert into riscos_pendencias_historico (pendencia_id, company_id, acao, status_anterior, status_novo, usuario_id, comentario, payload)
      values ($1, $2, 'SEED_HOMOLOGACAO', null, 'EM_ANDAMENTO', $3, $4, $5::jsonb)
      `,
      [riscoId, companyId, responsavelId, `Risco criado pela seed ${marker}`, JSON.stringify({ marker })]
    );
  }
  return riscoId;
};

const ensureTarefa = async (
  client: PoolClient,
  companyId: string,
  codigo: string,
  titulo: string,
  modulo: string,
  prioridade: string,
  responsavelId: string,
  perfilId: string,
  obraId: string,
  clienteId: string
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
    insert into central_tarefas_manuais (
      company_id, codigo, titulo, descricao, modulo, origem, status, prioridade,
      responsavel_id, perfil_id, prazo, obra_id, cliente_id, created_by, updated_by
    )
    values ($1, $2, $3, $4, $5, 'MANUAL', 'ABERTA', $6, $7, $8, $9, $10, $11, $7, $7)
    on conflict (company_id, codigo)
    do update set
      titulo = excluded.titulo,
      descricao = excluded.descricao,
      modulo = excluded.modulo,
      prioridade = excluded.prioridade,
      responsavel_id = excluded.responsavel_id,
      perfil_id = excluded.perfil_id,
      prazo = excluded.prazo,
      obra_id = excluded.obra_id,
      cliente_id = excluded.cliente_id,
      status = 'ABERTA',
      updated_at = now()
    returning id
    `,
    [companyId, codigo, `${titulo} - ${marker}`, 'Tarefa manual de homologacao por perfil.', modulo, prioridade, responsavelId, perfilId, addDays(3), obraId, clienteId]
  );
  const tarefaId = firstRow(result.rows, `tarefa ${codigo}`).id;
  const hist = await client.query<{ id: string }>('select id from central_tarefas_manuais_historico where tarefa_id = $1 and acao = $2 limit 1', [tarefaId, 'SEED_HOMOLOGACAO']);
  if (!hist.rowCount) {
    await client.query(
      `
      insert into central_tarefas_manuais_historico (tarefa_id, company_id, acao, status_anterior, status_novo, usuario_id, comentario, payload)
      values ($1, $2, 'SEED_HOMOLOGACAO', null, 'ABERTA', $3, $4, $5::jsonb)
      `,
      [tarefaId, companyId, responsavelId, `Tarefa criada pela seed ${marker}`, JSON.stringify({ marker, modulo })]
    );
  }
  return tarefaId;
};

const ensureDocumento = async (
  client: PoolClient,
  companyId: string,
  entidadeTipo: string,
  entidadeId: string,
  obraId: string | null,
  contratoId: string | null,
  tipo: string,
  nomeArquivo: string,
  referencia: string,
  usuarioId: string
): Promise<string> => {
  const existing = await client.query<{ id: string }>('select id from documentos_anexos where referencia_local_mock = $1 limit 1', [referencia]);
  if (existing.rowCount) {
    await client.query(
      `
      update documentos_anexos
      set entidade_tipo = $1, entidade_id = $2, obra_id = $3, contrato_id = $4,
          tipo_documento = $5, nome_arquivo = $6, descricao = $7, observacao = $8,
          origem = 'ERP_LOCAL', status = 'ATIVO', atualizado_por = $9, atualizado_em = now()
      where id = $10
      `,
      [entidadeTipo, entidadeId, obraId, contratoId, tipo, nomeArquivo, `Documento mock homologacao - ${marker}`, 'Referencia local sem upload real externo.', usuarioId, existing.rows[0].id]
    );
    return existing.rows[0].id;
  }
  const result = await client.query<{ id: string }>(
    `
    insert into documentos_anexos (
      company_id, entidade_tipo, entidade_id, obra_id, contrato_id, tipo_documento,
      nome_arquivo, extensao, mime_type, tamanho_bytes, descricao, observacao, origem, status,
      referencia_local_mock, sharepoint_site_id_mock, sharepoint_drive_id_mock, sharepoint_item_id_mock,
      url_mock, criado_por, atualizado_por
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 12345, $10, $11, 'ERP_LOCAL', 'ATIVO',
            $12, 'mock-site-homologacao', 'mock-drive-homologacao', $13, $14, $15, $15)
    returning id
    `,
    [
      companyId,
      entidadeTipo,
      entidadeId,
      obraId,
      contratoId,
      tipo,
      nomeArquivo,
      nomeArquivo.split('.').pop() || 'pdf',
      nomeArquivo.endsWith('.xml') ? 'application/xml' : 'application/pdf',
      `Documento mock homologacao - ${marker}`,
      'Referencia local sem upload real externo.',
      referencia,
      referencia.replace('mock://', 'mock-item-'),
      referencia,
      usuarioId
    ]
  );
  return firstRow(result.rows, `documento ${nomeArquivo}`).id;
};

const ensureAuditoria = async (client: PoolClient, companyId: string, usuarioId: string, entidade: string, entidadeId: string | null, acao: string, payload: Record<string, unknown>): Promise<void> => {
  const existing = await client.query<{ id: string }>(
    `
    select id from auditoria_eventos
    where company_id = $1
      and entidade = $2
      and acao = $3
      and coalesce(entidade_id::text, '') = coalesce($4::text, '')
      and payload->>'marker' = $5
    limit 1
    `,
    [companyId, entidade, acao, entidadeId, marker]
  );
  if (existing.rowCount) {
    return;
  }
  await client.query(
    `
    insert into auditoria_eventos (company_id, entidade, entidade_id, acao, payload, created_by)
    values ($1, $2, $3, $4, $5::jsonb, $6)
    `,
    [companyId, entidade, entidadeId, acao, JSON.stringify({ marker, ...payload }), usuarioId]
  );
};

const run = async (): Promise<void> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('begin');

    const companyId = await upsertEmpresa(client);
    const perfis = new Map<string, string>();
    for (const perfil of ['ADMIN', 'DIRETORIA', 'PLANEJAMENTO', 'COMPRAS', 'FINANCEIRO', 'CAMPO']) {
      perfis.set(perfil, await ensurePerfil(client, companyId, perfil));
    }

    const perfilIds = (names: string[]): string[] => names.map((name) => {
      const id = perfis.get(name);
      if (!id) throw new Error(`Perfil ausente: ${name}`);
      return id;
    });

    const usuarios = {
      leon: await ensureUsuario(client, companyId, 'Leon', 'leon.homologacao.v316@enac.local', 'Diretoria / Admin', perfilIds(['DIRETORIA', 'ADMIN'])),
      gustavo: await ensureUsuario(client, companyId, 'Gustavo', 'gustavo.homologacao.v316@enac.local', 'Planejamento', perfilIds(['PLANEJAMENTO'])),
      matheus: await ensureUsuario(client, companyId, 'Matheus', 'matheus.homologacao.v316@enac.local', 'Compras / Financeiro', perfilIds(['COMPRAS', 'FINANCEIRO'])),
      kemilly: await ensureUsuario(client, companyId, 'Kemilly', 'kemilly.homologacao.v316@enac.local', 'Planejamento / Campo', perfilIds(['PLANEJAMENTO', 'CAMPO'])),
      davison: await ensureUsuario(client, companyId, 'Davison', 'davison.homologacao.v316@enac.local', 'Campo / Planejamento', perfilIds(['CAMPO', 'PLANEJAMENTO'])),
      admin: await ensureUsuario(client, companyId, 'Admin Teste', 'admin.homologacao.v316@enac.local', 'Admin homologacao', perfilIds(['ADMIN']))
    };

    const clientes = [
      await ensureCliente(client, companyId, 'Cliente Industrial Alimentos', '16.316.000/0001-01', 'Engenharia Industrial'),
      await ensureCliente(client, companyId, 'Cliente Tecnologia Retrofit', '16.316.000/0001-02', 'Operacoes Tecnologia'),
      await ensureCliente(client, companyId, 'Cliente Centro Medico', '16.316.000/0001-03', 'Facilities Saude'),
      await ensureCliente(client, companyId, 'Cliente Condominio Logistico', '16.316.000/0001-04', 'Administracao Condominial'),
      await ensureCliente(client, companyId, 'Cliente Teste Homologacao', '16.316.000/0001-05', 'Homologacao ENAC')
    ];

    const fornecedores = [
      await ensureFornecedor(client, companyId, 'Fornecedor Materiais Eletricos', '26.316.000/0001-01', 'materiais'),
      await ensureFornecedor(client, companyId, 'Fornecedor Hidraulico', '26.316.000/0001-02', 'materiais'),
      await ensureFornecedor(client, companyId, 'Fornecedor Concreto', '26.316.000/0001-03', 'materiais'),
      await ensureFornecedor(client, companyId, 'Fornecedor Aco', '26.316.000/0001-04', 'materiais'),
      await ensureFornecedor(client, companyId, 'Fornecedor Esquadrias', '26.316.000/0001-05', 'materiais'),
      await ensureFornecedor(client, companyId, 'Fornecedor Mao de Obra', '26.316.000/0001-06', 'servicos'),
      await ensureFornecedor(client, companyId, 'Fornecedor Locacao Equipamentos', '26.316.000/0001-07', 'equipamentos'),
      await ensureFornecedor(client, companyId, 'Fornecedor Servicos Tecnicos', '26.316.000/0001-08', 'servicos')
    ];

    const centros = {
      matriz: await ensureCentroCusto(client, companyId, 'HOMO-MATRIZ', 'Matriz', 'administrativo', 'HOMO.001'),
      obra: await ensureCentroCusto(client, companyId, 'HOMO-OBRA', 'Obra', 'obra', 'HOMO.002'),
      materiais: await ensureCentroCusto(client, companyId, 'HOMO-MATERIAIS', 'Materiais', 'operacional', 'HOMO.003'),
      maoObra: await ensureCentroCusto(client, companyId, 'HOMO-MAO-OBRA', 'Mao de Obra', 'operacional', 'HOMO.004'),
      equipamentos: await ensureCentroCusto(client, companyId, 'HOMO-EQUIPAMENTOS', 'Equipamentos', 'operacional', 'HOMO.005'),
      terceiros: await ensureCentroCusto(client, companyId, 'HOMO-TERCEIROS', 'Terceiros', 'operacional', 'HOMO.006'),
      administrativo: await ensureCentroCusto(client, companyId, 'HOMO-ADMIN', 'Administrativo', 'administrativo', 'HOMO.007'),
      financeiro: await ensureCentroCusto(client, companyId, 'HOMO-FINANCEIRO', 'Financeiro', 'financeiro', 'HOMO.008'),
      faturamento: await ensureCentroCusto(client, companyId, 'HOMO-FATURAMENTO', 'Faturamento', 'financeiro', 'HOMO.009')
    };

    const obras = [
      await ensureObra(client, companyId, clientes[0], centros.obra, 'HOMO-OBRA-001', 'Obra Industrial em Andamento', -30),
      await ensureObra(client, companyId, clientes[1], centros.obra, 'HOMO-OBRA-002', 'Retrofit de Banheiros', -10),
      await ensureObra(client, companyId, clientes[2], centros.obra, 'HOMO-OBRA-003', 'Manutencao Predial', 0),
      await ensureObra(client, companyId, clientes[3], centros.obra, 'HOMO-OBRA-004', 'Condominio de Galpoes', 15),
      await ensureObra(client, companyId, clientes[4], centros.obra, 'HOMO-OBRA-005', 'Obra Teste de Homologacao', 30)
    ];

    const contratoId = await ensureContrato(client, companyId, clientes[0], obras[0], centros.obra, usuarios.leon);
    await ensureContratoItem(client, contratoId, companyId, centros.materiais, 'CT-HOMO-MAT', `Materiais principais - ${marker}`, 120000);
    await ensureContratoItem(client, contratoId, companyId, centros.maoObra, 'CT-HOMO-MOB', `Mao de obra - ${marker}`, 95000);
    await ensureContratoItem(client, contratoId, companyId, centros.equipamentos, 'CT-HOMO-EQP', `Equipamentos - ${marker}`, 35000);
    const aditivoId = await ensureAditivo(client, contratoId, companyId, usuarios.leon);

    const orcamentoId = await ensureOrcamento(client, companyId, clientes[0], obras[0], contratoId, centros.obra, usuarios.gustavo);
    const pacoteMateriais = await ensurePacote(client, orcamentoId, companyId, 'PAC-HOMO-MAT', 'Materiais', 'Compras', centros.materiais, 1);
    const pacoteMaoObra = await ensurePacote(client, orcamentoId, companyId, 'PAC-HOMO-MOB', 'Mao de Obra', 'Execucao', centros.maoObra, 2);
    const pacoteEquipamentos = await ensurePacote(client, orcamentoId, companyId, 'PAC-HOMO-EQP', 'Equipamentos', 'Execucao', centros.equipamentos, 3);
    await ensureOrcamentoItem(client, orcamentoId, pacoteMateriais, companyId, centros.materiais, 'MATERIAL', 'MAT-HOMO-001', `Materiais eletricos e hidraulicos - ${marker}`, 120000);
    await ensureOrcamentoItem(client, orcamentoId, pacoteMaoObra, companyId, centros.maoObra, 'MAO_DE_OBRA', 'MOB-HOMO-001', `Equipe de campo - ${marker}`, 95000);
    await ensureOrcamentoItem(client, orcamentoId, pacoteEquipamentos, companyId, centros.equipamentos, 'EQUIPAMENTO', 'EQP-HOMO-001', `Locacao de equipamentos - ${marker}`, 35000);
    await ensureOrcamentoItem(client, orcamentoId, pacoteMateriais, companyId, centros.terceiros, 'SERVICO', 'SRV-HOMO-001', `Servicos tecnicos - ${marker}`, 42000);
    await ensureOrcamentoItem(client, orcamentoId, pacoteMateriais, companyId, centros.administrativo, 'OUTROS', 'OUT-HOMO-001', `Outros custos - ${marker}`, 8000);
    await ensureCronograma(client, orcamentoId, pacoteMateriais, companyId, currentMonth(), 90000, 30);
    await ensureCronograma(client, orcamentoId, pacoteMaoObra, companyId, addMonths(1), 110000, 65);
    await ensureCronograma(client, orcamentoId, pacoteEquipamentos, companyId, addMonths(2), 100000, 100);

    await ensurePlanejamento(client, companyId, obras[0], orcamentoId, contratoId, centros.materiais, usuarios.gustavo, 'Compras principais', -20, 45);
    await ensurePlanejamento(client, companyId, obras[0], orcamentoId, contratoId, centros.maoObra, usuarios.davison, 'Execucao de campo', -5, 120);
    await ensurePlanejamento(client, companyId, obras[0], orcamentoId, contratoId, centros.faturamento, usuarios.kemilly, 'Medicao e faturamento', 20, 160);

    const solicitacaoId = await ensureSolicitacao(client, companyId, obras[0], centros.materiais, usuarios.davison, usuarios.gustavo);
    const solicitacaoItemId = await ensureSolicitacaoItem(client, solicitacaoId);
    const cotacaoId = await ensureCotacao(client, companyId, solicitacaoId, fornecedores[0], usuarios.matheus);
    const cotacaoFornecedorVencedor = await ensureCotacaoFornecedor(client, cotacaoId, fornecedores[0], 'ESCOLHIDO', 48000, `Fornecedor escolhido - ${marker}`);
    const cotacaoFornecedorAlternativo = await ensureCotacaoFornecedor(client, cotacaoId, fornecedores[1], 'RESPOSTA_RECEBIDA', 51500, `Fornecedor alternativo - ${marker}`);
    const cotacaoItemId = await ensureCotacaoItem(client, cotacaoId, cotacaoFornecedorVencedor, solicitacaoItemId, `Item vencedor homologacao - ${marker}`, 48000);
    await ensureCotacaoItem(client, cotacaoId, cotacaoFornecedorAlternativo, solicitacaoItemId, `Item alternativo homologacao - ${marker}`, 51500);
    await ensureMapaCotacao(client, cotacaoId, fornecedores[0]);

    const pedidoId = await ensurePedidoCompra(client, companyId, solicitacaoId, cotacaoId, fornecedores[0], obras[0], centros.materiais, usuarios.matheus);
    const pedidoItemId = await ensurePedidoItem(client, pedidoId, solicitacaoItemId, cotacaoItemId);
    const notaId = await ensureNotaEntrada(client, companyId, pedidoId, fornecedores[0], obras[0], centros.materiais, usuarios.matheus);
    await ensureNotaItem(client, notaId, pedidoItemId);
    const contaId = await ensureContaPagar(client, companyId, fornecedores[0], notaId, pedidoId, obras[0], centros.materiais, usuarios.matheus);
    const programacaoId = await ensureProgramacao(client, companyId, fornecedores[0], obras[0], centros.materiais, usuarios.leon, usuarios.matheus);
    await ensureProgramacaoItem(client, programacaoId, contaId, companyId, usuarios.matheus);
    await ensureProgramacaoHistoricos(client, programacaoId, companyId, usuarios.leon, usuarios.matheus);
    await ensureBaixaManual(client, contaId, companyId, programacaoId, usuarios.matheus);

    const medicaoId = await ensureMedicao(client, companyId, clientes[0], obras[0], centros.obra, contratoId, usuarios.kemilly, usuarios.gustavo);
    await ensureMedicaoItem(client, medicaoId, companyId, centros.obra);
    const pedidoFaturamentoId = await ensurePedidoFaturamento(client, medicaoId, companyId, clientes[0], obras[0], contratoId, usuarios.matheus);

    const riscoId = await ensureRisco(client, companyId, obras[0], clientes[0], contratoId, orcamentoId, contaId, programacaoId, medicaoId, pedidoFaturamentoId, usuarios.gustavo);
    await ensureTarefa(client, companyId, 'TASK-HOMO-DIR-001', 'Diretoria revisar margem e riscos', 'dashboard-executivo', 'CRITICA', usuarios.leon, perfis.get('DIRETORIA') || '', obras[0], clientes[0]);
    await ensureTarefa(client, companyId, 'TASK-HOMO-PLA-001', 'Planejamento revisar desvio previsto x realizado', 'previsto-realizado', 'ALTA', usuarios.gustavo, perfis.get('PLANEJAMENTO') || '', obras[0], clientes[0]);
    await ensureTarefa(client, companyId, 'TASK-HOMO-FIN-001', 'Financeiro validar programacao e baixa manual', 'programacoes-pagamento', 'ALTA', usuarios.matheus, perfis.get('FINANCEIRO') || '', obras[0], clientes[0]);
    await ensureTarefa(client, companyId, 'TASK-HOMO-CAM-001', 'Campo validar medicao e pendencias', 'medicoes-faturamento', 'MEDIA', usuarios.davison, perfis.get('CAMPO') || '', obras[0], clientes[0]);
    await ensureTarefa(client, companyId, 'TASK-HOMO-ADM-001', 'Admin validar acessos auditoria e documentos', 'auditoria', 'MEDIA', usuarios.admin, perfis.get('ADMIN') || '', obras[0], clientes[0]);

    await ensureDocumento(client, companyId, 'contrato_obra', contratoId, obras[0], contratoId, 'CONTRATO', 'homologacao-contrato-obra-v316.pdf', 'mock://homologacao/v316/contrato', usuarios.admin);
    await ensureDocumento(client, companyId, 'aditivo', aditivoId, obras[0], contratoId, 'ADITIVO', 'homologacao-aditivo-v316.pdf', 'mock://homologacao/v316/aditivo', usuarios.admin);
    await ensureDocumento(client, companyId, 'nota_fiscal_entrada', notaId, obras[0], null, 'NF', 'homologacao-nota-entrada-v316.xml', 'mock://homologacao/v316/nota-entrada', usuarios.matheus);
    await ensureDocumento(client, companyId, 'medicao', medicaoId, obras[0], contratoId, 'MEDICAO', 'homologacao-medicao-v316.pdf', 'mock://homologacao/v316/medicao', usuarios.kemilly);
    await ensureDocumento(client, companyId, 'risco_pendencia', riscoId, obras[0], contratoId, 'RELATORIO', 'homologacao-risco-v316.pdf', 'mock://homologacao/v316/risco', usuarios.gustavo);

    await ensureAuditoria(client, companyId, usuarios.admin, 'homologacao', null, 'seed_v316_v317_aplicada', {
      usuarios: Object.keys(usuarios).length,
      clientes: clientes.length,
      fornecedores: fornecedores.length,
      obras: obras.length
    });
    for (const [entidade, id] of [
      ['contrato_obra', contratoId],
      ['orcamento_obra', orcamentoId],
      ['solicitacao_compra', solicitacaoId],
      ['cotacao', cotacaoId],
      ['pedido_compra', pedidoId],
      ['nota_fiscal_entrada', notaId],
      ['conta_pagar', contaId],
      ['programacao_pagamento', programacaoId],
      ['medicao', medicaoId],
      ['pedido_faturamento', pedidoFaturamentoId],
      ['risco_pendencia', riscoId]
    ]) {
      await ensureAuditoria(client, companyId, usuarios.admin, entidade, id, 'seed_homologacao', { fonte: 'seedHomologacao' });
    }

    await client.query('commit');
    console.info(`Seed de homologacao aplicado com sucesso. Marcador: ${marker}`);
    console.info(`Empresa: ${companyId}`);
    console.info(`Obra principal: ${obras[0]}`);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
